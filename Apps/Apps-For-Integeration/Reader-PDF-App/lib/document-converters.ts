export type PortableFlashcard = {
  front: string;
  back?: string;
  page?: number;
  tag?: string;
};

type PdfTextPage = { page: number; text: string };

async function openPdf(bytes: ArrayBuffer) {
  const pdfjs = await import("pdfjs-dist");
  return pdfjs.getDocument({ data: new Uint8Array(bytes.slice(0)) }).promise;
}

export async function extractPdfText(bytes: ArrayBuffer): Promise<PdfTextPage[]> {
  const document = await openPdf(bytes);
  const pages: PdfTextPage[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push({ page: pageNumber, text });
  }
  return pages;
}

export async function pdfToWord(bytes: ArrayBuffer, title: string): Promise<Blob> {
  const [{ Document, HeadingLevel, Packer, Paragraph }, pages] = await Promise.all([
    import("docx"),
    extractPdfText(bytes),
  ]);
  const children = [
    new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
    ...pages.flatMap((page) => [
      new Paragraph({ text: `Page ${page.page}`, heading: HeadingLevel.HEADING_1 }),
      new Paragraph(page.text || "[No selectable text on this page]"),
    ]),
  ];
  return Packer.toBlob(new Document({ sections: [{ children }] }));
}

export async function pdfToExcel(bytes: ArrayBuffer): Promise<Blob> {
  const [xlsx, pages] = await Promise.all([import("xlsx"), extractPdfText(bytes)]);
  const rows = pages.map((page) => ({ Page: page.page, Text: page.text }));
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(rows);
  worksheet["!cols"] = [{ wch: 10 }, { wch: 120 }];
  xlsx.utils.book_append_sheet(workbook, worksheet, "PDF text");
  const output = xlsx.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([output], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export async function pdfToImages(bytes: ArrayBuffer): Promise<Blob> {
  const [JSZip, document] = await Promise.all([
    import("jszip").then((module) => module.default),
    openPdf(bytes),
  ]);
  const zip = new JSZip();
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = window.document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable.");
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Image conversion failed.")), "image/png");
    });
    zip.file(`page-${String(pageNumber).padStart(3, "0")}.png`, blob);
  }
  return zip.generateAsync({ type: "blob" });
}

function csvCell(value: string | number | undefined) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function flashcardsToCsv(cards: PortableFlashcard[]): Blob {
  const rows = [
    ["Front", "Back", "Page", "Tag"],
    ...cards.map((card) => [card.front, card.back ?? "", card.page ?? "", card.tag ?? ""]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  return new Blob([csv], { type: "text/csv;charset=utf-8" });
}
