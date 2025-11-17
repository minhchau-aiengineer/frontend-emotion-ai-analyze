// src/features/ReviewQueue/services/trashService.ts
import { TrashItem } from "../types/trashTypes";

const BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:8000";

// Transform backend data to TrashItem format
function transformBackendData(backendData: any[]): TrashItem[] {
    return backendData.map(item => ({
        id: item.id,
        name: item.source_name || `${item.kind || 'analysis'}-${item.id}`,
        sourceLabel: getSourceLabel(item.kind || 'upload'),
        module: getModule(item.kind || 'upload'),
        label: item.label || 'unknown',
        confidence: item.confidence || 0,
        deletedBy: 'user', // Backend doesn't track who deleted
        deletedAt: item.created_at || new Date().toISOString(),
        sizeBytes: item.size_bytes || 0,
        originalPath: item.file_url || '',
        itemType: getItemType(item.kind || 'upload') as TrashItem['itemType'],
    }));
}

function getSourceLabel(kind: string): string {
    switch (kind) {
        case 'vision': return 'Vision Sentiment';
        case 'audio': return 'Audio Sentiment';
        case 'upload': return 'Upload Analysis';
        case 'text': return 'Text Sentiment';
        default: return 'Other Analysis';
    }
}

function getModule(kind: string): string {
    switch (kind) {
        case 'vision': return 'vision';
        case 'audio': return 'audio';
        case 'upload': return 'upload';
        case 'text': return 'text';
        default: return 'other';
    }
}

function getItemType(kind: string): TrashItem['itemType'] {
    switch (kind) {
        case 'vision': return 'vision';
        case 'audio': return 'audio';
        case 'upload': return 'video';
        case 'text': return 'text';
        default: return 'other';
    }
}

// Fetch trash items from backend (all deleted items)
export async function fetchTrash(): Promise<TrashItem[]> {
    try {
        // Get deleted items from all analysis tables
        const [uploadRes, audioRes, visionRes] = await Promise.all([
            fetch(`${BASE_URL}/api/analytics/uploads?limit=100`),
            fetch(`${BASE_URL}/api/analytics/audio?limit=100`),
            fetch(`${BASE_URL}/api/analytics/vision?limit=100`)
        ]);

        const [uploads, audios, visions] = await Promise.all([
            uploadRes.ok ? uploadRes.json() : [],
            audioRes.ok ? audioRes.json() : [],
            visionRes.ok ? visionRes.json() : []
        ]);

        // Combine all data and transform
        const allData = [
            ...uploads.map((item: any) => ({ ...item, kind: 'upload' })),
            ...audios.map((item: any) => ({ ...item, kind: 'audio' })),
            ...visions.map((item: any) => ({ ...item, kind: 'vision' }))
        ];

        return transformBackendData(allData);

    } catch (error) {
        console.error('Failed to fetch trash from backend:', error);
        // Fallback to mock data if API fails
        return getMockTrash();
    }
}

// Restore items (move back to active)
export async function restoreTrashItems(ids: string[]): Promise<void> {
    try {
        // For now, just log the action since backend doesn't have restore API
        console.log('Restoring items:', ids);

        // TODO: Implement restore API in backend
        // await Promise.all(ids.map(id => 
        //   fetch(`${BASE_URL}/api/trash/restore/${id}`, { method: 'POST' })
        // ));

    } catch (error) {
        console.error('Failed to restore items:', error);
        throw new Error('Failed to restore items');
    }
}

// Delete items permanently
export async function deleteForever(ids: string[]): Promise<void> {
    try {
        // Call backend delete APIs
        await Promise.all(ids.map(async (id) => {
            // Try all delete endpoints since we don't know which table the item is from
            const deletePromises = [
                fetch(`${BASE_URL}/api/analytics/uploads/${id}`, { method: 'DELETE' }),
                fetch(`${BASE_URL}/api/analytics/audio/${id}`, { method: 'DELETE' }),
                fetch(`${BASE_URL}/api/analytics/vision/${id}`, { method: 'DELETE' })
            ];

            // At least one should succeed
            await Promise.allSettled(deletePromises);
        }));

    } catch (error) {
        console.error('Failed to delete items permanently:', error);
        throw new Error('Failed to delete items permanently');
    }
}

// Empty entire trash
export async function emptyTrash(): Promise<void> {
    try {
        // Get all items first
        const items = await fetchTrash();
        const ids = items.map(item => item.id);

        // Delete all items
        await deleteForever(ids);

    } catch (error) {
        console.error('Failed to empty trash:', error);
        throw new Error('Failed to empty trash');
    }
}

// Mock data fallback
function getMockTrash(): TrashItem[] {
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
            name: "analysis-report.txt",
            sourceLabel: "Text Sentiment",
            module: "text",
            label: "negative",
            confidence: 0.83,
            deletedBy: "admin",
            deletedAt: "2025-10-17T09:55:00Z",
            sizeBytes: 24220,
            originalPath: "TEXT_JOBS",
            itemType: "text",
        },
        {
            id: "t4",
            name: "maxfusion-session-0927.zip",
            sourceLabel: "Max Fusion (Video)",
            module: "fused",
            label: "mixed",
            confidence: 0.58,
            deletedBy: "minh.nguyen",
            deletedAt: "2025-09-27T14:30:00Z",
            sizeBytes: 15780000,
            originalPath: "FUSED_OUTPUT/2025-09-27",
            itemType: "fused",
        },
    ];
}