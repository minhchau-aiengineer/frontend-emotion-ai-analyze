import React from "react";
import { Info } from "lucide-react";
import { LogEntry } from "../utils/logTypes";

interface LogTableProps {
  logs: LogEntry[];
  loading?: boolean;
  onShowDetail: (log: LogEntry) => void;
}

export const LogTable: React.FC<LogTableProps> = ({
  logs,
  loading,
  onShowDetail,
}) => {
  return (
    <div className="rounded-2xl border border-slate-700/40 bg-slate-800/40 shadow-md overflow-hidden transition-all">
      <table className="w-full text-sm">
        <thead className="bg-slate-700/40 text-slate-100 border-b border-slate-600/40">
          <tr>
            <Th className="w-12">STT</Th>
            <Th>Time</Th>
            <Th>Source</Th>
            <Th>Action</Th>
            <Th>Level</Th>
            <Th>Message</Th>
            <Th className="text-right pr-10">Detail</Th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={7}
                className="py-6 text-center text-slate-400 bg-slate-800/20"
              >
                Loading logs...
              </td>
            </tr>
          ) : logs.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="py-8 text-center text-slate-400 bg-slate-800/20"
              >
                Chưa có log nào.
              </td>
            </tr>
          ) : (
            logs.map((log, index) => {
              const stt = logs.length - index;
              return (
                <tr
                  key={log.id}
                  className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                >
                  <Td>{stt}</Td>
                  <Td>{new Date(log.timestamp).toLocaleTimeString()}</Td>
                  <Td className="capitalize">
                    {log.source.replace("-", " ")}
                  </Td>
                  <Td>{log.action}</Td>
                  <Td>
                    <LevelBadge level={log.level} />
                  </Td>
                  <Td
                    className="max-w-[280px] truncate"
                    title={log.message}
                  >
                    {log.message}
                  </Td>
                  <td className="py-3 px-3 pr-10 text-right">
                    <button
                      onClick={() => onShowDetail(log)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-600/60 text-slate-100 transition"
                      title="View detail"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

function Th({
  children,
  className = "",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={
        "text-left text-[11px] uppercase tracking-wide text-slate-300 py-3 px-3 " +
        className
      }
      {...rest}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
} & React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={"py-3 px-3 text-sm text-slate-100 " + className} {...rest}>
      {children}
    </td>
  );
}

function LevelBadge({ level }: { level: string }) {
  if (level === "error")
    return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-rose-500/20 text-rose-100 border border-rose-500/30">
        Error
      </span>
    );
  if (level === "warning")
    return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-amber-400/20 text-amber-100 border border-amber-400/30">
        Warning
      </span>
    );
  if (level === "audit")
    return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-100 border border-purple-500/30">
        Audit
      </span>
    );
  if (level === "debug")
    return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-cyan-500/20 text-cyan-100 border border-cyan-500/30">
        Debug
      </span>
    );
  return (
    <span className="px-2 py-0.5 text-xs rounded-full bg-sky-500/20 text-sky-100 border border-sky-500/30">
      Info
    </span>
  );
}
