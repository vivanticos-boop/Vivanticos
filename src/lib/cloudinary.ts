// ==========================================
// CONFIGURACIÓN CLOUDINARY - VIVANTICOS
// ==========================================

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dgdzs3u7k';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'vivanticos';

export const isCloudinaryConfigured = () => Boolean(CLOUDINARY_CLOUD_NAME);

export async function uploadImageToCloudinary(file: File): Promise<string | null> {
  if (!CLOUDINARY_CLOUD_NAME) {
    console.warn('Cloudinary no configurado. Usando URL local.');
    return null;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'vivanticos/productos');

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
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
  return false;
}

export function getCloudinaryUrl(publicId: string, width?: number, height?: number): string {
  if (!CLOUDINARY_CLOUD_NAME) return publicId;
  const transforms = [];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  transforms.push('c_fill', 'q_auto', 'f_auto');
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transforms.join(',')}/${publicId}`;
}
