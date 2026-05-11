// ==========================================
// PDF GENERATOR - CATALOG VIVANTICOS
// Generates a downloadable PDF file
// ==========================================

import jsPDF from 'jspdf';
import type { Producto } from '@/types';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export async function generateCatalogPDF(
  productos: Producto[],
  categoriaNombre: string | null
): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const title = categoriaNombre
    ? `Catálogo ${categoriaNombre}`
    : 'Catálogo';

  // ===== COVER PAGE =====
  // Logo placeholder
  doc.setFillColor(124, 140, 110); // viv-sage
  doc.roundedRect(pageWidth / 2 - 15, 50, 30, 30, 6, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('V', pageWidth / 2, 70, { align: 'center' });

  // Brand name
  doc.setTextColor(124, 140, 110);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('Vivanticos', pageWidth / 2, 100, { align: 'center' });

  // Tagline
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('MUEBLES Y DECORACIÓN INFANTIL', pageWidth / 2, 110, { align: 'center' });

  // Title
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, 135, { align: 'center' });

  // Count
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${productos.length} producto${productos.length !== 1 ? 's' : ''} disponible${productos.length !== 1 ? 's' : ''}`,
    pageWidth / 2,
    145,
    { align: 'center' }
  );

  // Decorative line
  doc.setDrawColor(232, 160, 182); // viv-rose
  doc.setLineWidth(2);
  doc.line(pageWidth / 2 - 30, 155, pageWidth / 2 + 30, 155);

  // Footer
  doc.setTextColor(180, 180, 180);
  doc.setFontSize(9);
  doc.text('www.vivanticos.com', pageWidth / 2, pageHeight - 20, { align: 'center' });

  // ===== PRODUCT PAGES =====
  for (let i = 0; i < productos.length; i++) {
    const p = productos[i];
    doc.addPage();
    y = margin;

    // Header bar
    doc.setFillColor(124, 140, 110);
    doc.rect(0, 0, pageWidth, 8, 'F');

    // Product code
    doc.setTextColor(170, 170, 170);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(p.codigo, margin, y + 12);

    // Product name
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');

    // Word wrap for long names
    const nameLines = doc.splitTextToSize(p.nombre, contentWidth);
    doc.text(nameLines, margin, y + 22);
    y += 22 + nameLines.length * 8;

    // Image placeholder area
    const imgAreaHeight = 80;
    doc.setFillColor(245, 243, 240);
    doc.roundedRect(margin, y, contentWidth, imgAreaHeight, 4, 4, 'F');

    // Try to add first image
    if (p.imagenes.length > 0) {
      try {
        doc.addImage(p.imagenes[0], 'JPEG', margin + 2, y + 2, contentWidth - 4, imgAreaHeight - 4, undefined, 'FAST');
      } catch {
        // If image fails (CORS), show placeholder
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(36);
        doc.text('🧸', pageWidth / 2, y + imgAreaHeight / 2 + 5, { align: 'center' });
      }
    } else {
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(36);
      doc.text('🧸', pageWidth / 2, y + imgAreaHeight / 2 + 5, { align: 'center' });
    }

    y += imgAreaHeight + 8;

    // More images thumbnails (up to 3 more)
    if (p.imagenes.length > 1) {
      const thumbSize = 35;
      const thumbGap = 4;
      const totalThumbs = Math.min(p.imagenes.length - 1, 3);
      const thumbsWidth = totalThumbs * thumbSize + (totalThumbs - 1) * thumbGap;
      let thumbX = margin;

      for (let t = 1; t <= totalThumbs; t++) {
        doc.setFillColor(245, 243, 240);
        doc.roundedRect(thumbX, y, thumbSize, thumbSize, 3, 3, 'F');
        try {
          doc.addImage(p.imagenes[t], 'JPEG', thumbX + 1, y + 1, thumbSize - 2, thumbSize - 2, undefined, 'FAST');
        } catch {
          // Skip if CORS fails
        }
        thumbX += thumbSize + thumbGap;
      }
      y += thumbSize + 8;
    }

    // Price section
    doc.setFillColor(250, 248, 245);
    doc.roundedRect(margin, y, contentWidth, 30, 4, 4, 'F');

    doc.setTextColor(170, 170, 170);
    doc.setFontSize(8);
    doc.text('PRECIO', margin + 8, y + 10);

    doc.setTextColor(124, 140, 110);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(formatPrice(p.precio_base), margin + 8, y + 23);

    // Badge: Entrega inmediata or Fabricación
    if (p.entrega_inmediata) {
      doc.setFillColor(124, 140, 110);
      doc.roundedRect(contentWidth - 55 + margin, y + 8, 50, 14, 7, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Entrega Inmediata', contentWidth - 30 + margin, y + 17.5, { align: 'center' });
    } else {
      doc.setFillColor(184, 160, 144);
      doc.roundedRect(contentWidth - 42 + margin, y + 8, 37, 14, 7, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Fabricación', contentWidth - 23.5 + margin, y + 17.5, { align: 'center' });
    }

    y += 38;

    // Description
    if (p.descripcion) {
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const descLines = doc.splitTextToSize(p.descripcion, contentWidth);
      const maxLines = Math.min(descLines.length, 6); // Max 6 lines
      doc.text(descLines.slice(0, maxLines), margin, y);
      y += maxLines * 5 + 4;
    }

    // Garantía
    if (p.garantia) {
      doc.setTextColor(130, 130, 130);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Garantía: ', margin, y);
      const garantiaStart = doc.getTextWidth('Garantía: ');
      doc.setFont('helvetica', 'normal');
      doc.text(p.garantia, margin + garantiaStart, y);
      y += 8;
    }

    // Footer on each page
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Vivanticos · Muebles y Decoración Infantil · www.vivanticos.com`,
      pageWidth / 2,
      pageHeight - 12,
      { align: 'center' }
    );

    // Page number
    doc.text(
      `${i + 1} / ${productos.length}`,
      pageWidth - margin,
      pageHeight - 12,
      { align: 'right' }
    );
  }

  // Save the PDF
  const filename = categoriaNombre
    ? `catalogo-${categoriaNombre.toLowerCase().replace(/\s+/g, '-')}-vivanticos.pdf`
    : 'catalogo-vivanticos.pdf';

  doc.save(filename);
}
