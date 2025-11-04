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
    bankDetails?: string;
  };
  projectName: string;
  clientName: string;
  clientEmail?: string;
  allocationsSummary?: string;
};

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
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

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
  const amountColumnX = tableLeft + tableWidth - 120;

  ctx.fillStyle = "#e2e8f0";
  drawRoundedRect(ctx, tableLeft, tableTop, tableWidth, rowHeight, 18);
  ctx.fill();

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 26px 'Inter', 'Helvetica Neue', Arial";
  ctx.fillText("Descripción", tableLeft + 40, tableTop + 45);
  ctx.textAlign = "right";
  ctx.fillText("Monto", amountColumnX, tableTop + 45);
  ctx.textAlign = "left";

  ctx.font = "24px 'Inter', 'Helvetica Neue', Arial";
  invoice.lineItems.forEach((item, index) => {
    const y = tableTop + rowHeight + index * rowHeight;
    ctx.fillStyle = index % 2 === 0 ? "#f8fafc" : "#ffffff";
    ctx.fillRect(tableLeft, y, tableWidth, rowHeight);
    ctx.fillStyle = "#0f172a";
    ctx.fillText(item.description, tableLeft + 40, y + 45);
    ctx.textAlign = "right";
    ctx.fillText(`${invoice.currency} ${item.amount.toLocaleString()}`, amountColumnX, y + 45);
    ctx.textAlign = "left";
  });

  const totalsTop = tableTop + rowHeight * (invoice.lineItems.length + 1) + 40;
  ctx.font = "26px 'Inter', 'Helvetica Neue', Arial";
  ctx.fillStyle = "#475569";
  const labelColumnX = tableLeft + tableWidth - 320;
  ctx.fillText("Subtotal", labelColumnX, totalsTop);
  ctx.textAlign = "right";
  ctx.fillText(`${invoice.currency} ${invoice.subtotal.toLocaleString()}`, amountColumnX, totalsTop);
  ctx.textAlign = "left";
  ctx.fillText("Impuestos", labelColumnX, totalsTop + 40);
  ctx.textAlign = "right";
  ctx.fillText(`${invoice.currency} ${invoice.taxes.toLocaleString()}`, amountColumnX, totalsTop + 40);
  ctx.textAlign = "left";

  ctx.fillStyle = accent;
  ctx.font = "bold 32px 'Inter', 'Helvetica Neue', Arial";
  ctx.fillText("Total", labelColumnX, totalsTop + 100);
  ctx.textAlign = "right";
  ctx.fillText(`${invoice.currency} ${invoice.total.toLocaleString()}`, amountColumnX, totalsTop + 100);
  ctx.textAlign = "left";

  const qrMatrix = buildQrMatrix(invoice.verificationUrl);
  const qrSize = 340;
  const cellSize = qrSize / qrMatrix.length;
  const qrX = tableLeft;
  const qrY = totalsTop + 60;
  ctx.fillStyle = "#000000";
  qrMatrix.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value) {
        ctx.fillRect(qrX + colIndex * cellSize, qrY + rowIndex * cellSize, cellSize, cellSize);
      }
    });
  });

  const bankDetailsText = invoice.bankDetails?.trim();
  const bankBoxX = qrX + qrSize + 80;
  const bankBoxWidth = tableWidth - qrSize - 120;
  let bankBoxHeight = 0;
  if (bankDetailsText) {
    const bankLines = bankDetailsText.split(/\n+/).filter((line) => line.trim().length > 0);
    const bankLineHeight = 32;
    bankBoxHeight = 120 + bankLines.length * bankLineHeight;
    ctx.fillStyle = "#f1f5f9";
    drawRoundedRect(ctx, bankBoxX, qrY, bankBoxWidth, bankBoxHeight, 24);
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 28px 'Inter', 'Helvetica Neue', Arial";
    ctx.textAlign = "left";
    ctx.fillText("Datos bancarios", bankBoxX + 32, qrY + 56);
    ctx.fillStyle = "#475569";
    ctx.font = "24px 'Inter', 'Helvetica Neue', Arial";
    bankLines.forEach((line, index) => {
      ctx.fillText(line, bankBoxX + 32, qrY + 96 + index * bankLineHeight);
    });
  }

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 24px 'Inter', 'Helvetica Neue', Arial";
  const verificationTitleY = qrY + qrSize + 40;
  ctx.textAlign = "left";
  ctx.fillText("Verificación Monte", qrX, verificationTitleY);
  ctx.fillStyle = "#475569";
  ctx.font = "22px 'Inter', 'Helvetica Neue', Arial";
  const verificationLines = wrapText(
    ctx,
    invoice.verificationUrl,
    qrSize,
    qrX,
    verificationTitleY + 36,
    28,
  );

  const qrBlockHeight = qrSize + 36 + verificationLines * 28;
  const infoBlockHeight = Math.max(qrBlockHeight, bankBoxHeight);

  const notesTop = qrY + infoBlockHeight + 60;
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
  const encoder = new TextEncoder();
  const header = encoder.encode("%PDF-1.7\r\n%âãÏÓ\r\n");

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 36;
  const scale = Math.min(
    (pageWidth - margin * 2) / canvasWidth,
    (pageHeight - margin * 2) / canvasHeight,
  );
  const drawWidth = canvasWidth * scale;
  const drawHeight = canvasHeight * scale;
  const drawX = (pageWidth - drawWidth) / 2;
  const drawY = (pageHeight - drawHeight) / 2;

  const catalog = encoder.encode("1 0 obj\r\n<< /Type /Catalog /Pages 2 0 R >>\r\nendobj\r\n");
  const pages = encoder.encode("2 0 obj\r\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\r\nendobj\r\n");
  const page = encoder.encode(
    `3 0 obj\r\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(
      2,
    )}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>\r\nendobj\r\n`,
  );

  const contentCommands = `q\r\n${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${drawX.toFixed(2)} ${drawY.toFixed(
    2,
  )} cm\r\n/Im0 Do\r\nQ\r\n`;
  const contentStream = encoder.encode(contentCommands);
  const content = mergeUint8([
    encoder.encode(`4 0 obj\r\n<< /Length ${contentStream.length} >>\r\nstream\r\n`),
    contentStream,
    encoder.encode("\r\nendstream\r\nendobj\r\n"),
  ]);

  const image = mergeUint8([
    encoder.encode(
      `5 0 obj\r\n<< /Type /XObject /Subtype /Image /Width ${canvasWidth} /Height ${canvasHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\r\nstream\r\n`,
    ),
    imageBytes,
    encoder.encode("\r\nendstream\r\nendobj\r\n"),
  ]);

  const objects = [catalog, pages, page, content, image];
  const offsets: number[] = [0];
  let offset = header.length;
  const body = objects.map((object) => {
    offsets.push(offset);
    offset += object.length;
    return object;
  });

  const xrefLines = ["xref\r\n", `0 ${objects.length + 1}\r\n`, "0000000000 65535 f \r\n"];
  for (let index = 1; index < offsets.length; index += 1) {
    xrefLines.push(`${offsets[index].toString().padStart(10, "0")} 00000 n \r\n`);
  }

  const xref = encoder.encode(xrefLines.join(""));
  const trailer = encoder.encode(
    `trailer\r\n<< /Size ${objects.length + 1} /Root 1 0 R >>\r\nstartxref\r\n${offset}\r\n%%EOF\r\n`,
  );

  return mergeUint8([header, ...body, xref, trailer]);
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
