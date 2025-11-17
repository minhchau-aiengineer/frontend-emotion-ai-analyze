export type FaceLocation = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type FacePredictResponse = {
  emotion: string;
  confidence: number;
  face_location?: FaceLocation | FaceLocation[];
  all_emotions?: Record<string, number>;
  result_url?: string; // preferred: public URL
  result_image?: string; // fallback: server file path (not directly usable from browser)
};

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

/**
 * Convert server file path to public URL (if backend serves static files)
 * Example: "D:\\Backend_Emotion_Recognition\\app\\static\\results\\result.jpg"
 * -> "http://localhost:8000/static/results/result.jpg"
 */
const convertResultImageToUrl = (resultImage?: string): string | undefined => {
  if (!resultImage) return undefined;
  
  // If already a URL, return as is
  if (resultImage.startsWith("http://") || resultImage.startsWith("https://")) {
    return resultImage;
  }
  
  // Extract filename from path (handles both Windows and Unix paths)
  const filename = resultImage.split(/[/\\]/).pop();
  if (!filename) return undefined;
  
  // Assume backend serves static files at /static/results/
  return `${BASE}/static/results/${filename}`;
};

export const predictFaceFromBlob = async (
  blob: Blob,
  options?: { skipSave?: boolean }
): Promise<FacePredictResponse> => {
  const fd = new FormData();
  fd.append("file", blob, "upload.jpg");

  // Add skip_save parameter for realtime mode (performance optimization)
  const url = new URL(`${BASE}/face/predict`);
  if (options?.skipSave) {
    url.searchParams.set("skip_save", "true");
  }

  const res = await fetch(url.toString(), {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Predict failed: ${res.status} ${res.statusText} ${txt}`);
  }
  const json = await res.json();

  // Convert result_image to result_url if available
  const response: FacePredictResponse = json;
  if (response.result_image && !response.result_url) {
    response.result_url = convertResultImageToUrl(response.result_image);
  }

  return response;
};

export const predictFaceFromDataUrl = async (dataUrl: string) => {
  // convert dataUrl -> blob then call predictFaceFromBlob
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return predictFaceFromBlob(blob);
};

export default { predictFaceFromBlob, predictFaceFromDataUrl };
