// src/features/log/hooks/useLogs.ts
import { useEffect, useMemo, useState } from "react";
import { fetchLogs, clearLogs, exportLogs } from "../services/logService";
import { LogEntry, LogLevel } from "../utils/logTypes";

export function useLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<LogLevel | "all">("all");
  const [selected, setSelected] = useState<LogEntry | null>(null);

  // load mock log
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchLogs()
      .then((data) => {
        if (mounted) setLogs(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // filter theo search + level
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter((log) => {
      const matchLevel = level === "all" ? true : log.level === level;
      const matchSearch =
        !q ||
        log.message.toLowerCase().includes(q) ||
        log.source.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.user?.toLowerCase().includes(q);
      return matchLevel && matchSearch;
    });
  }, [logs, search, level]);

  const handleClear = async () => {
    await clearLogs();
    setLogs([]);
    setSelected(null);
  };

  // 👇 thêm tham số format
  const handleExport = async (format: "json" | "csv" = "json") => {
    const blob = await exportLogs(format);
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.${format}`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return {
    logs,
    loading,
    filtered,
    search,
    setSearch,
    level,
    setLevel,
    selected,
    setSelected,
    handleClear,
    handleExport, // giờ nhận "json" | "csv"
  };
}
