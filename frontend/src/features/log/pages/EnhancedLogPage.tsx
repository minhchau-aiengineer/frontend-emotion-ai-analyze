// src/features/log/pages/EnhancedLogPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import {
    enhancedLogService,
    LogEntry as EnhancedLogEntry,
} from "../services/enhancedLogService";
import { LogAnimatedHeader } from "../components/LogAnimatedHeader";
import { LogTable } from "../components/LogTable";
import { LogDetailModal } from "../components/LogDetailModal";
import type { LogEntry as UiLogEntry, LogLevel } from "../utils/logTypes";

type LevelFilter = LogLevel | "all";
type SourceFilter = "all" | "frontend" | "backend" | "system";

const levelMap: Record<EnhancedLogEntry["level"], LogLevel> = {
    info: "info",
    warn: "warning",
    error: "error",
    debug: "debug",
};

const sourceMap: Record<EnhancedLogEntry["source"], UiLogEntry["source"]> = {
    frontend: "frontend",
    backend: "backend",
    system: "system",
};

function toUiLog(entry: EnhancedLogEntry): UiLogEntry {
    const meta: Record<string, unknown> = {};
    if (entry.details && Object.keys(entry.details).length > 0) {
        meta.details = entry.details;
    }
    if (entry.stack_trace) {
        meta.stack_trace = entry.stack_trace;
    }
    if (entry.component) {
        meta.component = entry.component;
    }
    if (entry.user_id) {
        meta.user_id = entry.user_id;
    }
    meta.raw = entry;

    const action = entry.action ?? entry.component ?? "";

    return {
        id: entry.id,
        timestamp: entry.timestamp,
        source: sourceMap[entry.source] ?? "system",
        action,
        level: levelMap[entry.level] ?? "info",
        message: entry.message,
        user: entry.user_id,
        relatedId:
            typeof entry.details?.relatedId === "string"
                ? entry.details.relatedId
                : undefined,
        meta,
    };
}

function SelectLevelButton({
    current,
    setLevel,
    level,
    children,
}: {
    current: LevelFilter;
    setLevel: (filter: LevelFilter) => void;
    level: Exclude<LevelFilter, "all">;
    children: React.ReactNode;
}) {
    const active = current === level;
    const color =
        level === "error"
            ? "text-rose-200 bg-rose-500/10"
            : level === "warning"
                ? "text-amber-100 bg-amber-500/10"
                : level === "audit"
                    ? "text-purple-100 bg-purple-500/10"
                    : level === "debug"
                        ? "text-cyan-100 bg-cyan-500/10"
                        : "text-sky-100 bg-sky-500/10";

    return (
        <button
            onClick={() => setLevel(level)}
            className={
                "px-3 py-2 rounded-xl text-sm transition " +
                (active ? color : "bg-slate-900/40 text-gray-200 hover:bg-slate-700/40")
            }
        >
            {children}
        </button>
    );
}

export default function EnhancedLogPage() {
    const [rawLogs, setRawLogs] = useState<EnhancedLogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
    const [selected, setSelected] = useState<UiLogEntry | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const loadOnce = useCallback(() => {
        setLoading(true);
        try {
            const next = enhancedLogService.getLogs();
            setRawLogs(next);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOnce();
        if (!autoRefresh) {
            return;
        }
        const unsubscribe = enhancedLogService.subscribe((logs) => {
            setRawLogs(logs);
        });
        return () => {
            unsubscribe();
        };
    }, [autoRefresh, loadOnce]);

    const uiLogs = useMemo(() => rawLogs.map(toUiLog), [rawLogs]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return uiLogs.filter((log) => {
            const matchLevel = levelFilter === "all" ? true : log.level === levelFilter;
            const matchSource =
                sourceFilter === "all" ? true : log.source === sourceFilter;
            const matchSearch =
                !q ||
                log.message.toLowerCase().includes(q) ||
                log.action.toLowerCase().includes(q) ||
                log.source.toLowerCase().includes(q) ||
                log.user?.toLowerCase().includes(q) ||
                JSON.stringify(log.meta || {}).toLowerCase().includes(q);
            return matchLevel && matchSource && matchSearch;
        });
    }, [uiLogs, levelFilter, sourceFilter, search]);

    const stats = useMemo(() => {
        const total = uiLogs.length;
        const error = uiLogs.filter((log) => log.level === "error").length;
        const warning = uiLogs.filter((log) => log.level === "warning").length;
        const frontend = uiLogs.filter((log) => log.source === "frontend").length;
        const backend = uiLogs.filter((log) => log.source === "backend").length;
        return { total, error, warning, frontend, backend };
    }, [uiLogs]);

    const handleExport = useCallback(
        (format: "json" | "csv") => {
            if (format === "csv") {
                const header = [
                    "timestamp",
                    "level",
                    "source",
                    "component",
                    "action",
                    "message",
                    "user_id",
                ];
                const rows = rawLogs.map((log) => [
                    log.timestamp,
                    log.level,
                    log.source,
                    log.component ?? "",
                    log.action ?? "",
                    log.message.replace(/"/g, '""'),
                    log.user_id ?? "",
                ]);
                const csv = [header, ...rows]
                    .map((row) => row.map((cell) => `"${cell}"`).join(","))
                    .join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `logs-${new Date().toISOString()}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                return;
            }

            const json = enhancedLogService.exportLogs();
            const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `logs-${new Date().toISOString()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        },
        [rawLogs]
    );

    const handleClear = useCallback(() => {
        if (!confirm("Bạn có chắc muốn xóa toàn bộ log?")) {
            return;
        }
        enhancedLogService.clearLogs();
        setRawLogs([]);
        setSelected(null);
    }, []);

    const handleRefresh = useCallback(() => {
        loadOnce();
    }, [loadOnce]);

    return (
        <div className="space-y-6">
            <LogAnimatedHeader onExport={handleExport} onClear={handleClear} />

            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2 text-slate-200 text-sm">
                    <div>Tổng cộng {stats.total} log • Lỗi {stats.error} • Cảnh báo {stats.warning}</div>
                    <div>Frontend {stats.frontend} • Backend {stats.backend}</div>
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-200">
                        <input
                            type="checkbox"
                            className="accent-sky-500"
                            checked={autoRefresh}
                            onChange={(event) => setAutoRefresh(event.target.checked)}
                        />
                        Auto refresh
                    </label>
                    <button
                        onClick={handleRefresh}
                        className="px-3 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-100 text-sm inline-flex items-center gap-2"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-full bg-slate-950/30 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
                            placeholder="Search message, source, user..."
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setLevelFilter("all")}
                            className={
                                "px-3 py-2 rounded-xl text-sm flex items-center gap-1 " +
                                (levelFilter === "all"
                                    ? "bg-slate-700 text-white"
                                    : "bg-slate-900/40 text-gray-300 hover:bg-slate-700/40")
                            }
                        >
                            <Filter className="w-4 h-4" />
                            All
                        </button>
                        <SelectLevelButton current={levelFilter} setLevel={setLevelFilter} level="info">
                            Info
                        </SelectLevelButton>
                        <SelectLevelButton current={levelFilter} setLevel={setLevelFilter} level="warning">
                            Warning
                        </SelectLevelButton>
                        <SelectLevelButton current={levelFilter} setLevel={setLevelFilter} level="error">
                            Error
                        </SelectLevelButton>
                        <SelectLevelButton current={levelFilter} setLevel={setLevelFilter} level="audit">
                            Audit
                        </SelectLevelButton>
                        <SelectLevelButton current={levelFilter} setLevel={setLevelFilter} level="debug">
                            Debug
                        </SelectLevelButton>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 md:text-right">
                    <select
                        value={sourceFilter}
                        onChange={(event) => setSourceFilter(event.target.value as SourceFilter)}
                        className="bg-slate-900/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100"
                    >
                        <option value="all">All Sources</option>
                        <option value="frontend">Frontend</option>
                        <option value="backend">Backend</option>
                        <option value="system">System</option>
                    </select>
                    {filtered.length} / {uiLogs.length} log(s)
                </div>
            </div>

            <LogTable logs={filtered} loading={loading} onShowDetail={setSelected} />

            <LogDetailModal log={selected} onClose={() => setSelected(null)} />
        </div>
    );
}