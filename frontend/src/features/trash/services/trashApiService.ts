// src/features/trash/services/trashApiService.ts

export interface BackendTrashItem {
    id: string;
    source_name: string;
    type: 'upload_analysis' | 'audio_analysis' | 'vision_analysis';
    label: string;
    confidence: number;
    deleted_at: string;
    original_data: any;
}

class TrashApiService {
    private baseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

    // Lấy tất cả items đã xóa từ backend
    async getDeletedItems(): Promise<BackendTrashItem[]> {
        try {
            // Gọi API để lấy các records đã bị đánh dấu xóa
            const [uploadResponse, audioResponse, visionResponse] = await Promise.allSettled([
                fetch(`${this.baseUrl}/api/analytics/upload-analysis?deleted=true`),
                fetch(`${this.baseUrl}/api/analytics/audio-analysis?deleted=true`),
                fetch(`${this.baseUrl}/api/analytics/vision-analysis?deleted=true`)
            ]);

            const items: BackendTrashItem[] = [];

            // Process upload analysis
            if (uploadResponse.status === 'fulfilled' && uploadResponse.value.ok) {
                const uploadData = await uploadResponse.value.json();
                items.push(...uploadData.map((item: any) => ({
                    id: `upload_${item.id}`,
                    source_name: item.source_name || 'Unknown Source',
                    type: 'upload_analysis' as const,
                    label: item.label,
                    confidence: item.confidence,
                    deleted_at: item.updated_at,
                    original_data: item
                })));
            }

            // Process audio analysis
            if (audioResponse.status === 'fulfilled' && audioResponse.value.ok) {
                const audioData = await audioResponse.value.json();
                items.push(...audioData.map((item: any) => ({
                    id: `audio_${item.id}`,
                    source_name: item.source_name || 'Unknown Audio',
                    type: 'audio_analysis' as const,
                    label: item.label,
                    confidence: item.confidence,
                    deleted_at: item.updated_at,
                    original_data: item
                })));
            }

            // Process vision analysis
            if (visionResponse.status === 'fulfilled' && visionResponse.value.ok) {
                const visionData = await visionResponse.value.json();
                items.push(...visionData.map((item: any) => ({
                    id: `vision_${item.id}`,
                    source_name: item.source_name || 'Unknown Image',
                    type: 'vision_analysis' as const,
                    label: item.label,
                    confidence: item.confidence,
                    deleted_at: item.updated_at,
                    original_data: item
                })));
            }

            // Sort by deleted_at desc
            return items.sort((a, b) =>
                new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime()
            );

        } catch (error) {
            console.error('Failed to fetch deleted items:', error);
            return [];
        }
    }

    // Khôi phục item (đánh dấu là không xóa)
    async restoreItem(itemId: string): Promise<boolean> {
        try {
            const [type, originalId] = itemId.split('_');
            let endpoint = '';

            switch (type) {
                case 'upload':
                    endpoint = `/api/analytics/upload-analysis/${originalId}/restore`;
                    break;
                case 'audio':
                    endpoint = `/api/analytics/audio-analysis/${originalId}/restore`;
                    break;
                case 'vision':
                    endpoint = `/api/analytics/vision-analysis/${originalId}/restore`;
                    break;
                default:
                    throw new Error(`Unknown item type: ${type}`);
            }

            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Failed to restore item:', error);
            return false;
        }
    }

    // Xóa vĩnh viễn item
    async permanentlyDeleteItem(itemId: string): Promise<boolean> {
        try {
            const [type, originalId] = itemId.split('_');
            let endpoint = '';

            switch (type) {
                case 'upload':
                    endpoint = `/api/analytics/upload-analysis/${originalId}`;
                    break;
                case 'audio':
                    endpoint = `/api/analytics/audio-analysis/${originalId}`;
                    break;
                case 'vision':
                    endpoint = `/api/analytics/vision-analysis/${originalId}`;
                    break;
                default:
                    throw new Error(`Unknown item type: ${type}`);
            }

            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Failed to permanently delete item:', error);
            return false;
        }
    }

    // Clear all deleted items (xóa vĩnh viễn tất cả)
    async clearAllDeleted(): Promise<boolean> {
        try {
            const items = await this.getDeletedItems();
            const deletePromises = items.map(item => this.permanentlyDeleteItem(item.id));

            const results = await Promise.allSettled(deletePromises);

            // Return true if at least 80% succeeded
            const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
            return successCount / results.length >= 0.8;
        } catch (error) {
            console.error('Failed to clear all deleted items:', error);
            return false;
        }
    }
}

export const trashApiService = new TrashApiService();