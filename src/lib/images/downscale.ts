/**
 * Réduit une image (typiquement une photo de téléphone, 3–8 Mo) à `maxDim`
 * pixels max sur le côté long, ré-encodée en JPEG. S'exécute dans le
 * navigateur (canvas) — à n'appeler que côté client.
 */
export async function downscaleImage(
  file: File,
  { maxDim = 1600, quality = 0.8 }: { maxDim?: number; quality?: number } = {},
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const longEdge = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, maxDim / longEdge);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas indisponible");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encodage de l'image impossible"))),
      "image/jpeg",
      quality,
    );
  });
}
