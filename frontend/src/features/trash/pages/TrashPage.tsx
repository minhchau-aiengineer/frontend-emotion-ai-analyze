import { useCallback, useEffect, useMemo, useState, type SetStateAction } from "react";
import { Wifi, WifiOff, Database, RefreshCcw } from "lucide-react";
import { TrashHeader } from "../../ReviewQueue/components/TrashHeader";
import { TrashToolbar } from "../../ReviewQueue/components/TrashToolbar";
import { TrashTable } from "../../ReviewQueue/components/TrashTable";
import { ConfirmDialog } from "../../ReviewQueue/components/ConfirmDialog";
import type { TrashFilters } from "../../ReviewQueue/hooks/useTrash";
import type { TrashItem as ViewTrashItem } from "../../ReviewQueue/types/trashTypes";
import {
    trashService,
    TrashItem as LocalTrashItem,
} from "../services/trashService";
import {
    trashApiService,
    BackendTrashItem,
} from "../services/trashApiService";

type CombinedItem = {
    view: ViewTrashItem;
    source: "backend" | "local";
    backend?: BackendTrashItem;
    local?: LocalTrashItem;
};

type DataSource = "backend" | "local" | "local-fallback" | "hybrid";

const MODULE_MAP: Record<string, { module: string; itemType: ViewTrashItem["itemType"] }> = {
    upload: { module: "upload", itemType: "video" },
    audio: { module: "audio", itemType: "audio" },
    vision: { module: "vision", itemType: "vision" },
};

function toBackendCombined(item: BackendTrashItem): CombinedItem {
    const rawType = item.type.replace("_analysis", "");
    const mapping = MODULE_MAP[rawType] ?? { module: rawType, itemType: "other" };
    const confidence = typeof item.confidence === "number" ? item.confidence : undefined;
    const sourceName = (item.source_name ?? "Backend").toString().replace(/\s+/g, " ");

    return {
        view: {
            id: item.id,
            name: `${item.label ?? "Unknown"} • ${sourceName}`,
            sourceLabel: sourceName,
            module: mapping.module,
            label: item.label ?? "unknown",
            confidence,
            deletedBy: "system",
            deletedAt: item.deleted_at ?? new Date().toISOString(),
            sizeBytes:
                typeof item.original_data?.file_size === "number"
                    ? item.original_data.file_size
                    : null,
            originalPath: item.original_data?.file_url ?? sourceName,
            itemType: mapping.itemType,
        },
        source: "backend",
        backend: item,
    };
}

function toLocalCombined(item: LocalTrashItem): CombinedItem {
    const mapping = MODULE_MAP[item.type] ?? { module: item.type, itemType: "other" };
    const label = typeof item.content?.label === "string" ? item.content.label : undefined;
    const confidence =
        typeof item.content?.confidence === "number" ? item.content.confidence : undefined;
    const sizeBytes =
        typeof item.content?.sizeBytes === "number" ? item.content.sizeBytes : null;

    return {
        view: {
            id: item.id,
            name: item.name,
            sourceLabel: item.deletedFrom,
            module: mapping.module,
            label: label ?? "unknown",
            confidence,
            deletedBy: "user",
            deletedAt: item.deletedAt,
            sizeBytes,
            originalPath:
                typeof item.content?.sourcePath === "string"
                    ? item.content.sourcePath
                    : typeof item.content?.path === "string"
                        ? item.content.path
                        : "",
            itemType: mapping.itemType,
        },
        source: "local",
        local: item,
    };
}

export default function TrashPage() {
    const [items, setItems] = useState<CombinedItem[]>([]);
    const [filters, setFilters] = useState<TrashFilters>({
        type: "all",
        order: "recent",
        q: "",
    });
    const [selectedState, setSelectedState] = useState<string[]>([]);
    const [confirm, setConfirm] = useState<null | {
        type: "restore" | "delete" | "empty";
    }>(null);
    const [loading, setLoading] = useState(false);
    const [useRealApi, setUseRealApi] = useState(true);
    const [dataSource, setDataSource] = useState<DataSource>("backend");

    const setSelected = useCallback(
        (value: SetStateAction<string[]>) => {
            setSelectedState((prev) => {
                const next = typeof value === "function" ? value(prev) : value;
                return Array.from(new Set(next));
            });
        },
        []
    );

    const combinedMap = useMemo(() => {
        const map = new Map<string, CombinedItem>();
        for (const item of items) {
            map.set(item.view.id, item);
        }
        return map;
    }, [items]);

    const loadTrashItems = useCallback(async () => {
        setLoading(true);
        try {
            const localData = trashService.getTrashItems();
            const localCombined = localData.map(toLocalCombined);

            if (useRealApi) {
                try {
                    const backendData = await trashApiService.getDeletedItems();
                    const backendCombined = backendData.map(toBackendCombined);
                    const merged = [...backendCombined, ...localCombined];
                    setItems(merged);
                    if (backendCombined.length > 0 && localCombined.length > 0) {
                        setDataSource("hybrid");
                    } else if (backendCombined.length > 0) {
                        setDataSource("backend");
                    } else if (localCombined.length > 0) {
                        setDataSource("local");
                    } else {
                        setDataSource("backend");
                    }
                    setSelectedState([]);
                    return;
                } catch (err) {
                    console.error("Failed to load backend trash items:", err);
                    if (localCombined.length > 0) {
                        setItems(localCombined);
                        setDataSource("local-fallback");
                    } else {
                        setItems([]);
                        setDataSource("local-fallback");
                    }
                    setSelectedState([]);
                    return;
                }
            }

            setItems(localCombined);
            setDataSource(localCombined.length > 0 ? "local" : "local-fallback");
            setSelectedState([]);
        } catch (error) {
            console.error("Failed to load trash items:", error);
            setItems([]);
            setDataSource("local-fallback");
            setSelectedState([]);
        } finally {
            setLoading(false);
        }
    }, [useRealApi]);

    useEffect(() => {
        loadTrashItems();
        if (!useRealApi) {
            return;
        }
        const id = window.setInterval(loadTrashItems, 10_000);
        return () => window.clearInterval(id);
    }, [loadTrashItems, useRealApi]);

    const filteredItems = useMemo(() => {
        let list = items.map((item) => item.view);

        if (filters.q.trim()) {
            const query = filters.q.trim().toLowerCase();
            list = list.filter((entry) => {
                const haystack = `${entry.name} ${entry.sourceLabel ?? ""} ${entry.module ?? ""
                    } ${entry.deletedBy ?? ""}`.toLowerCase();
                return haystack.includes(query);
            });
        }

        if (filters.type !== "all") {
            list = list.filter((entry) => entry.itemType === filters.type);
        }

        list = [...list];

        if (filters.order === "recent") {
            list.sort(
                (a, b) =>
                    new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
            );
        } else if (filters.order === "oldest") {
            list.sort(
                (a, b) =>
                    new Date(a.deletedAt).getTime() - new Date(b.deletedAt).getTime()
            );
        } else if (filters.order === "size") {
            list.sort(
                (a, b) => (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0)
            );
        }

        return list;
    }, [items, filters]);

    const stats = useMemo(() => {
        const totals = { video: 0, audio: 0, vision: 0, other: 0 };
        for (const item of items) {
            const key = item.view.itemType;
            if (key === "video" || key === "audio" || key === "vision") {
                totals[key] += 1;
            } else {
                totals.other += 1;
            }
        }
        return {
            total: items.length,
            ...totals,
        };
    }, [items]);

    const handleRestore = useCallback(
        async (ids: string[]) => {
            if (ids.length === 0) return;
            setLoading(true);
            try {
                await Promise.all(
                    ids.map(async (id) => {
                        const item = combinedMap.get(id);
                        if (!item) return;
                        if (item.source === "backend") {
                            await trashApiService.restoreItem(id);
                        } else {
                            trashService.restoreItem(id);
                        }
                    })
                );
                await loadTrashItems();
            } catch (error) {
                console.error("Failed to restore items:", error);
            } finally {
                setLoading(false);
            }
        },
        [combinedMap, loadTrashItems]
    );

    const handleDelete = useCallback(
        async (ids: string[]) => {
            if (ids.length === 0) return;
            setLoading(true);
            try {
                await Promise.all(
                    ids.map(async (id) => {
                        const item = combinedMap.get(id);
                        if (!item) return;
                        if (item.source === "backend") {
                            await trashApiService.permanentlyDeleteItem(id);
                        } else {
                            trashService.permanentlyDelete(id);
                        }
                    })
                );
                await loadTrashItems();
            } catch (error) {
                console.error("Failed to delete items:", error);
            } finally {
                setLoading(false);
            }
        },
        [combinedMap, loadTrashItems]
    );

    const handleEmpty = useCallback(async () => {
        setLoading(true);
        try {
            if (useRealApi) {
                await trashApiService.clearAllDeleted();
            } else {
                trashService.emptyTrash();
            }
            await loadTrashItems();
        } catch (error) {
            console.error("Failed to empty trash:", error);
        } finally {
            setLoading(false);
        }
    }, [loadTrashItems, useRealApi]);

    const debugRefresh = useCallback(() => {
        console.log(
            "🔍 Debug - localStorage:",
            window.localStorage.getItem("analytics-trash-items")
        );
        console.log("🔍 Debug - combined state:", items);
        loadTrashItems();
    }, [items, loadTrashItems]);

    const renderDataSourceBadge = () => {
        if (dataSource === "backend") {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs">
                    <Wifi className="w-3.5 h-3.5" /> API trực tiếp
                </span>
            );
        }
        if (dataSource === "hybrid") {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-200 border border-indigo-500/30 text-xs">
                    <Wifi className="w-3.5 h-3.5" /> API + Local
                </span>
            );
        }
        if (dataSource === "local") {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-xs">
                    <Database className="w-3.5 h-3.5" /> Local storage
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/15 text-amber-200 border border-amber-500/30 text-xs">
                <WifiOff className="w-3.5 h-3.5" /> API lỗi • Đang dùng local
            </span>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-5">
            <TrashHeader />

            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        {renderDataSourceBadge()}
                        {loading && (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                                <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> Đang tải…
                            </span>
                        )}
                    </div>
                    <div className="text-slate-200 text-sm">
                        Tổng {stats.total} mục • Video {stats.video} • Audio {stats.audio} • Vision {stats.vision}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-200">
                        <input
                            type="checkbox"
                            className="accent-sky-500"
                            checked={useRealApi}
                            onChange={(event) => setUseRealApi(event.target.checked)}
                        />
                        Dùng API backend realtime
                    </label>
                    <button
                        onClick={debugRefresh}
                        className="px-3 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-100 text-sm inline-flex items-center gap-2"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Làm mới
                    </button>
                </div>
            </div>

            <TrashToolbar
                selectedCount={selectedState.length}
                filters={filters}
                setFilters={setFilters}
                onRestore={() => setConfirm({ type: "restore" })}
                onDelete={() => setConfirm({ type: "delete" })}
                onEmpty={() => setConfirm({ type: "empty" })}
            />

            <TrashTable items={filteredItems} selected={selectedState} setSelected={setSelected} />

            <ConfirmDialog
                open={confirm !== null}
                title={
                    confirm?.type === "restore"
                        ? "Khôi phục mục đã chọn?"
                        : confirm?.type === "delete"
                            ? "Xóa vĩnh viễn mục đã chọn?"
                            : "Dọn sạch toàn bộ thùng rác?"
                }
                msg={
                    confirm?.type === "restore"
                        ? "Các mục sẽ được khôi phục về nguồn ban đầu."
                        : confirm?.type === "delete"
                            ? "Sau khi xóa vĩnh viễn bạn sẽ không thể hoàn tác."
                            : "Tất cả mục hiện có sẽ bị xóa vĩnh viễn."
                }
                confirmLabel={
                    confirm?.type === "restore"
                        ? "Khôi phục"
                        : confirm?.type === "delete"
                            ? "Xóa vĩnh viễn"
                            : "Dọn sạch"
                }
                tone={confirm?.type === "restore" ? "primary" : "danger"}
                onClose={() => setConfirm(null)}
                onConfirm={() => {
                    if (!confirm) return;
                    if (confirm.type === "restore") {
                        handleRestore(selectedState).finally(() => setSelectedState([]));
                    } else if (confirm.type === "delete") {
                        handleDelete(selectedState).finally(() => setSelectedState([]));
                    } else {
                        handleEmpty().finally(() => setSelectedState([]));
                    }
                }}
            />
        </div>
    );
}