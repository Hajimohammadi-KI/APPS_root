"use client";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = 350_000;

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The selected photo could not be read."));
    image.src = source;
  });
}

function renderSquare(
  image: HTMLImageElement,
  size: number,
  quality: number,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Photo processing is unavailable.");
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = (image.naturalWidth - sourceSize) / 2;
  const sourceY = (image.naturalHeight - sourceSize) / 2;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    size,
    size,
  );
  return canvas.toDataURL("image/jpeg", quality);
}

export async function profilePhotoFromFile(file: File): Promise<string> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP photo.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("The photo must be smaller than 8 MB.");
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error("The selected photo has no readable dimensions.");
    }
    const primary = renderSquare(image, 320, 0.86);
    const result =
      primary.length <= MAX_DATA_URL_LENGTH
        ? primary
        : renderSquare(image, 256, 0.76);
    if (result.length > MAX_DATA_URL_LENGTH) {
      throw new Error("The processed photo is still too large.");
    }
    return result;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
