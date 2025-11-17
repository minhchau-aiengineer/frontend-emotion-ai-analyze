// src/features/vision-sentiment/utils/crop.ts
export const cropFaceFromImage = async (
  imageUrl: string,
  box: { x: number; y: number; w: number; h: number }
): Promise<string> => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("image load fail"));
    img.src = imageUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = box.w;
  canvas.height = box.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no ctx");
  ctx.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
  return canvas.toDataURL("image/jpeg", 0.9);
};

export const cropFacesFromCanvas = (
  canvas: HTMLCanvasElement,
  boxes: Array<{ id: number; x: number; y: number; w: number; h: number }>
): Record<number, string> => {
  const out: Record<number, string> = {};
  const ctx = canvas.getContext("2d");
  if (!ctx) return out;
  boxes.forEach((b) => {
    const c = document.createElement("canvas");
    c.width = b.w;
    c.height = b.h;
    const cctx = c.getContext("2d");
    if (!cctx) return;
    cctx.drawImage(canvas, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);
    out[b.id] = c.toDataURL("image/jpeg", 0.9);
  });
  return out;
};
