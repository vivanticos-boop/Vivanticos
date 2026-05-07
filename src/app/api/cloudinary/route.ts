// ==========================================
// API ROUTE: CLOUDINARY UPLOAD (SIGNED)
// Usa firma del backend — no necesita upload preset
// ==========================================

import { NextRequest, NextResponse } from 'next/server';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dgdzs3u7k';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

// POST /api/cloudinary - Upload image to Cloudinary
export async function POST(request: NextRequest) {
  if (!CLOUDINARY_CLOUD_NAME) {
    return NextResponse.json({ error: 'Cloudinary no configurado' }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'vivanticos/productos';

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64File = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Generate timestamp and signature for signed upload
    const timestamp = Math.round(new Date().getTime() / 1000);

    let uploadData: Record<string, string> = {
      file: base64File,
      folder,
      timestamp: timestamp.toString(),
    };

    // If we have API secret, do signed upload (more secure, no preset needed)
    if (CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      const crypto = await import('crypto');
      const signatureString = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
      const signature = crypto.createHash('sha1').update(signatureString).digest('hex');
      uploadData.api_key = CLOUDINARY_API_KEY;
      uploadData.signature = signature;
    } else {
      // Fallback: try unsigned upload with preset
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'vivanticos';
      uploadData.upload_preset = uploadPreset;
    }

    // Build FormData for Cloudinary
    const cloudinaryFormData = new FormData();
    Object.entries(uploadData).forEach(([key, value]) => {
      cloudinaryFormData.append(key, value);
    });

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: cloudinaryFormData }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary upload error:', errorData);
      throw new Error(errorData.error?.message || 'Error al subir imagen a Cloudinary');
    }

    const data = await response.json();

    return NextResponse.json({
      url: data.secure_url,
      public_id: data.public_id,
      width: data.width,
      height: data.height,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/cloudinary - Delete image from Cloudinary
export async function DELETE(request: NextRequest) {
  if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return NextResponse.json({ error: 'API credentials no configuradas' }, { status: 503 });
  }

  try {
    const { public_id } = await request.json();
    if (!public_id) {
      return NextResponse.json({ error: 'public_id requerido' }, { status: 400 });
    }

    const crypto = await import('crypto');
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signatureString = `public_id=${public_id}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

    const deleteFormData = new FormData();
    deleteFormData.append('public_id', public_id);
    deleteFormData.append('api_key', CLOUDINARY_API_KEY);
    deleteFormData.append('signature', signature);
    deleteFormData.append('timestamp', timestamp.toString());

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
      { method: 'POST', body: deleteFormData }
    );

    if (!response.ok) {
      throw new Error('Error al eliminar imagen');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
