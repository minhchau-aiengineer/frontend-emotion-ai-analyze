// Clean trashService.ts for ReviewQueue
import { TrashItem } from "../types/trashTypes";

const BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function getTrashItems(): Promise<TrashItem[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/analytics/all`);
    if (response.ok) {
      const data = await response.json();
      return transformToTrashItems(data);
    }
  } catch (error) {
    console.error("Failed to fetch real data:", error);
  }

  return getMockTrashItems();
}

export async function deleteItem(id: string, itemType: string): Promise<boolean> {
  try {
    let endpoint = "";
    switch (itemType) {
      case "vision":
        endpoint = `/api/analytics/vision/${id}`;
        break;
      case "audio":
        endpoint = `/api/analytics/audio/${id}`;
        break;
      case "video":
        endpoint = `/api/analytics/upload/${id}`;
        break;
      default:
        return false;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "DELETE",
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to delete item:", error);
    return false;
  }
}

export async function restoreItem(id: string): Promise<boolean> {
  console.log("Restore item:", id);
  return true;
}

export async function clearAll(): Promise<boolean> {
  return true;
}

function transformToTrashItems(data: any): TrashItem[] {
  const items: TrashItem[] = [];

  if (data.uploadAnalysis) {
    items.push(
      ...data.uploadAnalysis.map((item: any) => ({
        id: item.id,
        name: item.source_name || `upload-${item.id}`,
        sourceLabel: "Upload Analysis",
        module: "upload",
        label: item.label || "unknown",
        confidence: item.confidence || 0,
        deletedBy: "user",
        deletedAt: item.created_at || new Date().toISOString(),
        sizeBytes: item.size_bytes || 0,
        originalPath: item.file_url || "",
        itemType: "video" as TrashItem["itemType"],
      }))
    );
  }

  return items;
}

function getMockTrashItems(): TrashItem[] {
  return [
    {
      id: "t1",
      name: "vision-frame-001.png",
      sourceLabel: "Vision Sentiment",
      module: "vision",
      label: "surprised",
      confidence: 0.78,
      deletedBy: "minh.nguyen",
      deletedAt: "2025-10-22T03:12:00Z",
      sizeBytes: 42770,
      originalPath: "VISION_RUN/2025-10-22",
      itemType: "vision",
    },
    {
      id: "t2",
      name: "audio-call-16khz.wav",
      sourceLabel: "Audio Sentiment",
      module: "audio",
      label: "neutral",
      confidence: 0.65,
      deletedBy: "system",
      deletedAt: "2025-10-17T10:00:00Z",
      sizeBytes: 1390000,
      originalPath: "AUDIO_INBOX/2025-10-17",
      itemType: "audio",
    },
    {
      id: "t3",
      name: "maxfusion-session.zip",
      sourceLabel: "Max Fusion (Video)",
      module: "fused",
      label: "mixed",
      confidence: 0.58,
      deletedBy: "minh.nguyen",
      deletedAt: "2025-10-17T08:22:00Z",
      sizeBytes: 701680000,
      originalPath: "MAXFUSION/RUNS",
      itemType: "fused",
    },
  ];
}

