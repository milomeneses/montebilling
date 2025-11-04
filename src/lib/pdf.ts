import { buildQrMatrix } from "./qr";

export type InvoicePdfPayload = {
  invoice: {
    number: string;
    issueDate: string;
    dueDate: string;
    subtotal: number;
    taxes: number;
    total: number;
    currency: string;
    notes?: string;
    branding: {
      accentColor: string;
      headerText?: string;
      footerText?: string;
      logoDataUrl?: string;
    };
    lineItems: { id: string; description: string; amount: number }[];
    verificationUrl: string;
  };
  projectName: string;
  clientName: string;
  clientEmail?: string;
  allocationsSummary?: string;
};

function stringToUint8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function mergeUint8(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const buffer = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    buffer.set(chunk, offset);
    offset += chunk.length;
  });
  return buffer;
}

async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

async function renderInvoiceCanvas(payload: InvoicePdfPayload) {
  const width = 1600;
  const height = 2260;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context no disponible");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const { invoice, clientName, clientEmail, projectName, allocationsSummary } = payload;
  const accent = invoice.branding.accentColor || "#10b981";

  // Header bar
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, width, 220);

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 48px 'Inter', 'Helvetica Neue', Arial";
  ctx.fillText(invoice.branding.headerText ?? "Factura Monte Animation", 80, 120);

  ctx.fillStyle = "#ffffff";
  ctx.font = "28px 'Inter', 'Helvetica Neue', Arial";
  ctx.fillText(invoice.number, 80, 180);

  if (invoice.branding.logoDataUrl) {
    try {
      const image = await loadImage(invoice.branding.logoDataUrl);
      const maxLogoWidth = 220;
      const aspect = image.width / image.height;
      const logoWidth = Math.min(maxLogoWidth, image.width);
      const logoHeight = logoWidth / aspect;
      ctx.drawImage(image, width - logoWidth - 80, 60, logoWidth, logoHeight);
    } catch (error) {
      console.warn("No se pudo cargar el logo", error);
    }
  }

  ctx.fillStyle = "#0f172a";
  ctx.font = "32px 'Inter', 'Helvetica Neue', Arial";
  ctx.fillText(clientName, 80, 300);
  ctx.fillStyle = "#475569";
  ctx.font = "24px 'Inter', 'Helvetica Neue', Arial";
  ctx.fillText(projectName, 80, 340);
  if (clientEmail) {
    ctx.fillText(clientEmail, 80, 380);
  }

  ctx.font = "24px 'Inter', 'Helvetica Neue', Arial";
  ctx.fillStyle = "#0f172a";
  ctx.fillText(`Emisión: ${invoice.issueDate}`, 80, 450);
  ctx.fillText(`Vencimiento: ${invoice.dueDate}`, 80, 490);
  if (allocationsSummary) {
    ctx.fillStyle = "#475569";
    ctx.fillText(allocationsSummary, 80, 530);
  }

  // Line items table
  const tableTop = 580;
  const tableLeft = 80;
  const tableWidth = width - 160;
  const rowHeight = 70;

  ctx.fillStyle = "#e2e8f0";
  drawRoundedRect(ctx, tableLeft, tableTop, tableWidth, rowHeight, 18);
  ctx.fill();

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 26px 'Inter', 'Helvetica Neue', Arial";
  ctx.fillText("Descripción", tableLeft + 40, tableTop + 45);
  ctx.fillText("Monto", tableLeft + tableWidth - 200, tableTop + 45);

  ctx.font = "24px 'Inter', 'Helvetica Neue', Arial";
  invoice.lineItems.forEach((item, index) => {
    const y = tableTop + rowHeight + index * rowHeight;
    ctx.fillStyle = index % 2 === 0 ? "#f8fafc" : "#ffffff";
    ctx.fillRect(tableLeft, y, tableWidth, rowHeight);
    ctx.fillStyle = "#0f172a";
    ctx.fillText(item.description, tableLeft + 40, y + 45);
    ctx.fillText(`${invoice.currency} ${item.amount.toLocaleString()}`, tableLeft + tableWidth - 200, y + 45);
  });

  const totalsTop = tableTop + rowHeight * (invoice.lineItems.length + 1) + 40;
  ctx.font = "26px 'Inter', 'Helvetica Neue', Arial";
  ctx.fillStyle = "#475569";
  ctx.fillText("Subtotal", tableLeft + tableWidth - 300, totalsTop);
  ctx.fillText(`${invoice.currency} ${invoice.subtotal.toLocaleString()}`, tableLeft + tableWidth - 80, totalsTop, 250);
  ctx.fillText("Impuestos", tableLeft + tableWidth - 300, totalsTop + 40);
  ctx.fillText(`${invoice.currency} ${invoice.taxes.toLocaleString()}`, tableLeft + tableWidth - 80, totalsTop + 40, 250);

  ctx.fillStyle = accent;
  ctx.font = "bold 32px 'Inter', 'Helvetica Neue', Arial";
  ctx.fillText("Total", tableLeft + tableWidth - 300, totalsTop + 100);
  ctx.fillText(`${invoice.currency} ${invoice.total.toLocaleString()}`, tableLeft + tableWidth - 80, totalsTop + 100, 250);

  const qrMatrix = buildQrMatrix(invoice.verificationUrl);
  const qrSize = 340;
  const cellSize = qrSize / qrMatrix.length;
  const qrX = tableLeft;
  const qrY = totalsTop + 40;
  ctx.fillStyle = "#000000";
  qrMatrix.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value) {
        ctx.fillRect(qrX + colIndex * cellSize, qrY + rowIndex * cellSize, cellSize, cellSize);
      }
    });
  });

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 24px 'Inter', 'Helvetica Neue', Arial";
  ctx.fillText("Verificación Monte", qrX, qrY + qrSize + 40);
  ctx.fillStyle = "#475569";
  ctx.font = "22px 'Inter', 'Helvetica Neue', Arial";
  ctx.fillText(invoice.verificationUrl, qrX, qrY + qrSize + 80);

  const notesTop = qrY + qrSize + 140;
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 26px 'Inter', 'Helvetica Neue', Arial";
  ctx.fillText("Notas", tableLeft, notesTop);
  ctx.fillStyle = "#475569";
  ctx.font = "24px 'Inter', 'Helvetica Neue', Arial";
  const noteText = invoice.notes ?? "";
  const wrapped = wrapText(ctx, noteText, tableWidth, tableLeft, notesTop + 40, 32);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "22px 'Inter', 'Helvetica Neue', Arial";
  ctx.fillText(invoice.branding.footerText ?? "", tableLeft, notesTop + 40 + wrapped * 32 + 60);

  return canvas;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  x: number,
  y: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let lineCount = 0;
  for (let n = 0; n < words.length; n += 1) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      line = words[n] + " ";
      lineCount += 1;
    } else {
      line = testLine;
    }
  }
  if (line.trim().length) {
    ctx.fillText(line, x, y + lineCount * lineHeight);
    lineCount += 1;
  }
  return lineCount;
}

function dataUrlToUint8(dataUrl: string): { bytes: Uint8Array; width: number; height: number } {
  const [header, base64] = dataUrl.split(",");
  if (!base64) {
    throw new Error("Logo inválido");
  }
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const view = new DataView(bytes.buffer);
  let width = 0;
  let height = 0;
  if (header.includes("image/jpeg")) {
    // JPEG dimensions from SOF0
    let offset = 2;
    while (offset < len) {
      if (bytes[offset] !== 0xff) break;
      const marker = bytes[offset + 1];
      const size = (bytes[offset + 2] << 8) + bytes[offset + 3];
      if (marker === 0xc0 || marker === 0xc2) {
        height = (bytes[offset + 5] << 8) + bytes[offset + 6];
        width = (bytes[offset + 7] << 8) + bytes[offset + 8];
        break;
      }
      offset += size + 2;
    }
  } else if (header.includes("image/png")) {
    width = view.getUint32(16);
    height = view.getUint32(20);
  }
  return { bytes, width, height };
}

function buildPdfFromImage(imageDataUrl: string, canvasWidth: number, canvasHeight: number): Uint8Array {
  const { bytes: imageBytes } = dataUrlToUint8(imageDataUrl);
  const objects: Uint8Array[] = [];
  const xref: number[] = [];
  const header = stringToUint8("%PDF-1.3\n");
  objects.push(header);
  xref.push(0);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 36;
  const drawWidth = pageWidth - margin * 2;
  const drawHeight = (drawWidth * canvasHeight) / canvasWidth;
  const drawX = margin;
  const drawY = (pageHeight - drawHeight) / 2;

  const objChunks: Uint8Array[] = [];

  function addObject(content: Uint8Array): number {
    const id = objChunks.length + 1;
    const prefix = stringToUint8(`${id} 0 obj\n`);
    const suffix = stringToUint8("endobj\n");
    objChunks.push(mergeUint8([prefix, content, suffix]));
    return id;
  }

  const catalogId = addObject(stringToUint8("<< /Type /Catalog /Pages 2 0 R >>\n"));
  addObject(stringToUint8("<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n"));

  const imageStream = mergeUint8([
    stringToUint8(
      `<< /Type /XObject /Subtype /Image /Width ${canvasWidth} /Height ${canvasHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`,
    ),
    imageBytes,
    stringToUint8("\nendstream\n"),
  ]);
  const imageId = addObject(imageStream);

  const contentCommands = `q\n${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${drawX.toFixed(2)} ${drawY.toFixed(2)} cm\n/Im0 Do\nQ\n`;
  const contentStream = mergeUint8([
    stringToUint8(`<< /Length ${contentCommands.length} >>\nstream\n`),
    stringToUint8(contentCommands),
    stringToUint8("endstream\n"),
  ]);
  const contentId = addObject(contentStream);

  const pageContent = stringToUint8(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>\n`,
  );
  addObject(pageContent);

  const xrefStart = objChunks.reduce((offset, chunk) => {
    xref.push(offset + header.length);
    return offset + chunk.length;
  }, 0);

  const xrefTable = ["xref\n", `0 ${objChunks.length + 1}\n`, "0000000000 65535 f \n"];
  for (let i = 1; i <= objChunks.length; i += 1) {
    const offset = xref[i];
    xrefTable.push(`${offset.toString().padStart(10, "0")} 00000 n \n`);
  }
  const trailer = `trailer\n<< /Size ${objChunks.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${header.length + xrefStart}\n%%EOF`;

  return mergeUint8([
    header,
    ...objChunks,
    stringToUint8(xrefTable.join("")),
    stringToUint8(trailer),
  ]);
}

export async function buildInvoicePreviewImage(payload: InvoicePdfPayload) {
  const canvas = await renderInvoiceCanvas(payload);
  return canvas.toDataURL("image/png");
}

export async function generateInvoicePdf(payload: InvoicePdfPayload): Promise<Blob> {
  const canvas = await renderInvoiceCanvas(payload);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const pdfBytes = buildPdfFromImage(dataUrl, canvas.width, canvas.height);
  return new Blob([pdfBytes], { type: "application/pdf" });
}
