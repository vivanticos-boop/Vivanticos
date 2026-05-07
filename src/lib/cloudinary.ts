// ==========================================
// CONFIGURACIÓN CLOUDINARY - VIVANTICOS
// ==========================================

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dgdzs3u7k';

export const isCloudinaryConfigured = () => Boolean(CLOUDINARY_CLOUD_NAME);

/**
 * Upload an image directly to Cloudinary using a signed signature from our API.
 * This avoids routing the file through Vercel's serverless function (body size limits).
 */
export async function uploadImageToCloudinary(file: File): Promise<string | null> {
  if (!CLOUDINARY_CLOUD_NAME) {
    console.warn('Cloudinary no configurado.');
    return null;
  }

  try {
    // Step 1: Get signed upload params from our API
    const signResponse = await fetch('/api/cloudinary?folder=vivanticos/productos');
    if (!signResponse.ok) {
      throw new Error('Error obteniendo firma de subida');
    }
    const signData = await signResponse.json();

    // Step 2: Upload directly to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signData.api_key);
    formData.append('timestamp', signData.timestamp);
    formData.append('signature', signData.signature);
    formData.append('folder', signData.folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) throw new Error('Error al subir imagen');

    const data = await response.json();
    return data.secure_url as string;
  } catch (error) {
    console.error('Error subiendo imagen a Cloudinary:', error);
    return null;
  }
}

export async function deleteImageFromCloudinary(publicId: string): Promise<boolean> {
  // Requiere signed request desde el backend - se implementa en API route
  try {
    const response = await fetch('/api/cloudinary', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_id: publicId }),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export function getCloudinaryUrl(publicId: string, width?: number, height?: number): string {
  if (!CLOUDINARY_CLOUD_NAME) return publicId;
  const transforms: string[] = [];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  transforms.push('c_fill', 'q_auto', 'f_auto');
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transforms.join(',')}/${publicId}`;
}
