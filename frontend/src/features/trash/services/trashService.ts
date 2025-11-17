// src/features/trash/services/trashService.ts

export interface TrashItem {
    id: string;
    originalId: string;
    type: 'upload' | 'audio' | 'vision';
    name: string;
    content: any; // Original data
    deletedAt: string;
    deletedFrom: string; // Source page/component
    canRestore: boolean;
}

class TrashService {
    private storageKey = 'analytics-trash-items';

    // Add item to trash
    addToTrash(item: {
        originalId: string;
        type: 'upload' | 'audio' | 'vision';
        name: string;
        content: any;
        deletedFrom: string;
    }): void {
        console.log('📦 Adding item to trash:', item);

        const trashItem: TrashItem = {
            id: `trash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            originalId: item.originalId,
            type: item.type,
            name: item.name,
            content: item.content,
            deletedAt: new Date().toISOString(),
            deletedFrom: item.deletedFrom,
            canRestore: true
        };

        const existingItems = this.getTrashItems();
        const updatedItems = [trashItem, ...existingItems];

        // Keep only last 100 items
        const limitedItems = updatedItems.slice(0, 100);

        localStorage.setItem(this.storageKey, JSON.stringify(limitedItems));
        console.log('📦 Item saved to trash, total items:', limitedItems.length);

        // Log the deletion
        this.logDeletion(trashItem);
    }

    // Get all trash items
    getTrashItems(): TrashItem[] {
        try {
            const items = localStorage.getItem(this.storageKey);
            return items ? JSON.parse(items) : [];
        } catch (error) {
            console.error('Failed to load trash items:', error);
            return [];
        }
    }

    // Restore item from trash
    restoreItem(trashId: string): TrashItem | null {
        const items = this.getTrashItems();
        const itemIndex = items.findIndex(item => item.id === trashId);

        if (itemIndex === -1) return null;

        const item = items[itemIndex];
        items.splice(itemIndex, 1);

        localStorage.setItem(this.storageKey, JSON.stringify(items));

        // Log the restoration
        this.logRestoration(item);

        return item;
    }

    // Permanently delete item from trash
    permanentlyDelete(trashId: string): boolean {
        const items = this.getTrashItems();
        const filteredItems = items.filter(item => item.id !== trashId);

        if (filteredItems.length === items.length) return false;

        localStorage.setItem(this.storageKey, JSON.stringify(filteredItems));
        return true;
    }

    // Empty entire trash
    emptyTrash(): void {
        localStorage.removeItem(this.storageKey);
        console.log('Trash emptied at', new Date().toISOString());
    }

    // Get trash statistics
    getTrashStats(): {
        total: number;
        byType: Record<string, number>;
        oldestDate: string | null;
    } {
        const items = this.getTrashItems();
        const stats = {
            total: items.length,
            byType: {} as Record<string, number>,
            oldestDate: null as string | null
        };

        items.forEach(item => {
            stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
        });

        if (items.length > 0) {
            stats.oldestDate = items[items.length - 1].deletedAt;
        }

        return stats;
    }

    // Private helper methods
    private logDeletion(item: TrashItem): void {
        console.log(`[TRASH] Item deleted: ${item.name} (${item.type}) from ${item.deletedFrom}`);
    }

    private logRestoration(item: TrashItem): void {
        console.log(`[TRASH] Item restored: ${item.name} (${item.type})`);
    }
}

export const trashService = new TrashService();