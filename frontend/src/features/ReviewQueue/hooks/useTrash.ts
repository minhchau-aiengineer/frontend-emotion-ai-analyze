import { useEffect, useMemo, useState } from "react";
import {
  getTrashItems,
  restoreItem as restoreTrashItem,
  deleteItem as deleteTrashItem,
  clearAll,
} from "../services/trashService";
import { TrashItem } from "../types/trashTypes";

export type TrashFilters = {
  type: "all" | "audio" | "vision" | "text" | "video" | "fused" | "other";
  order: "recent" | "oldest" | "size";
  q: string;
};

export function useTrash() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [filters, setFilters] = useState<TrashFilters>({
    type: "all",
    order: "recent",
    q: "",
  });

  useEffect(() => {
    getTrashItems().then(setItems);
  }, []);

  const filtered = useMemo(() => {
    let out = [...items];

    if (filters.q) {
      const ql = filters.q.toLowerCase();
      out = out.filter(
        (it) =>
          it.name.toLowerCase().includes(ql) ||
          it.sourceLabel?.toLowerCase().includes(ql) ||
          it.module?.toLowerCase().includes(ql) ||
          it.deletedBy?.toLowerCase().includes(ql)
      );
    }

    if (filters.type !== "all") {
      out = out.filter((it) => it.itemType === filters.type);
    }

    if (filters.order === "recent") {
      out.sort(
        (a, b) =>
          new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
      );
    } else if (filters.order === "oldest") {
      out.sort(
        (a, b) =>
          new Date(a.deletedAt).getTime() - new Date(b.deletedAt).getTime()
      );
    } else if (filters.order === "size") {
      out.sort((a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0));
    }

    return out;
  }, [items, filters]);

  const restore = async (ids: string[]) => {
    await Promise.all(ids.map((id) => restoreTrashItem(id)));
    setItems((prev) => prev.filter((x) => !ids.includes(x.id)));
    setSelected([]);
  };

  const deleteForever = async (ids: string[]) => {
    await Promise.all(
      ids.map((id) => {
        const item = items.find((x) => x.id === id);
        if (!item) {
          return Promise.resolve(false);
        }

        // Only attempt delete when we know the backend endpoint
        if (!item.itemType || item.itemType === "other" || item.itemType === "all") {
          return Promise.resolve(false);
        }

        return deleteTrashItem(id, item.itemType);
      })
    );
    setItems((prev) => prev.filter((x) => !ids.includes(x.id)));
    setSelected([]);
  };

  const empty = async () => {
    await clearAll();
    setItems([]);
    setSelected([]);
  };

  return {
    filtered,
    selected,
    setSelected,
    filters,
    setFilters,
    restore,
    deleteForever,
    empty,
  };
}
