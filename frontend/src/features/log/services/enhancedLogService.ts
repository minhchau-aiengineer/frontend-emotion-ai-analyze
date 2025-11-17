// src/features/log/services/enhancedLogService.ts

export interface LogEntry {
    id: string;
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    source: 'frontend' | 'backend' | 'system';
    user_id?: string;
    component?: string;
    action?: string;
    details?: any;
    stack_trace?: string;
}

class EnhancedLogService {
    private logs: LogEntry[] = [];
    private subscribers: ((logs: LogEntry[]) => void)[] = [];
    private storageKey = 'frontend-logs';

    constructor() {
        this.loadStoredLogs();
        this.interceptConsole();
        this.startBackendLogPolling();
    }

    // Add log entry
    addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): void {
        const logEntry: LogEntry = {
            ...entry,
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
        };

        this.logs.unshift(logEntry);

        // Keep only last 1000 logs
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(0, 1000);
        }

        this.saveToStorage();
        this.notifySubscribers();
    }

    // Get all logs with optional filtering
    getLogs(filters?: {
        level?: string;
        source?: string;
        search?: string;
    }): LogEntry[] {
        let filtered = [...this.logs];

        if (filters?.level && filters.level !== 'all') {
            filtered = filtered.filter(log => log.level === filters.level);
        }

        if (filters?.source && filters.source !== 'all') {
            filtered = filtered.filter(log => log.source === filters.source);
        }

        if (filters?.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(log =>
                log.message.toLowerCase().includes(searchLower) ||
                log.component?.toLowerCase().includes(searchLower) ||
                log.action?.toLowerCase().includes(searchLower)
            );
        }

        return filtered.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }

    // Subscribe to log updates
    subscribe(callback: (logs: LogEntry[]) => void): () => void {
        this.subscribers.push(callback);
        return () => {
            const index = this.subscribers.indexOf(callback);
            if (index > -1) {
                this.subscribers.splice(index, 1);
            }
        };
    }

    // Clear all logs
    clearLogs(): void {
        this.logs = [];
        this.saveToStorage();
        this.notifySubscribers();
    }

    // Export logs
    exportLogs(): string {
        const exportData = {
            exported_at: new Date().toISOString(),
            total_logs: this.logs.length,
            logs: this.logs
        };
        return JSON.stringify(exportData, null, 2);
    }

    // Private methods
    private loadStoredLogs(): void {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.logs = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load stored logs:', error);
        }
    }

    private saveToStorage(): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
        } catch (error) {
            console.error('Failed to save logs to storage:', error);
        }
    }

    private notifySubscribers(): void {
        this.subscribers.forEach(callback => callback(this.logs));
    }

    private interceptConsole(): void {
        // Backup original console methods
        const originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info
        };

        // Override console methods
        console.log = (...args) => {
            originalConsole.log.apply(console, args);
            this.addLog({
                level: 'info',
                message: args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' '),
                source: 'frontend',
                component: 'console'
            });
        };

        console.warn = (...args) => {
            originalConsole.warn.apply(console, args);
            this.addLog({
                level: 'warn',
                message: args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' '),
                source: 'frontend',
                component: 'console'
            });
        };

        console.error = (...args) => {
            originalConsole.error.apply(console, args);
            this.addLog({
                level: 'error',
                message: args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' '),
                source: 'frontend',
                component: 'console',
                stack_trace: args.find(arg => arg instanceof Error)?.stack
            });
        };

        console.info = (...args) => {
            originalConsole.info.apply(console, args);
            this.addLog({
                level: 'info',
                message: args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' '),
                source: 'frontend',
                component: 'console'
            });
        };
    }

    private async startBackendLogPolling(): Promise<void> {
        const pollBackendLogs = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/logs/recent?limit=50');
                if (response.ok) {
                    const backendLogs = await response.json();

                    // Add backend logs if not already present
                    backendLogs.forEach((log: any) => {
                        const exists = this.logs.find(existing =>
                            existing.source === 'backend' &&
                            existing.timestamp === log.timestamp &&
                            existing.message === log.message
                        );

                        if (!exists) {
                            this.addLog({
                                level: log.level_name?.toLowerCase() || 'info',
                                message: log.message,
                                source: 'backend',
                                component: log.logger_name || 'uvicorn',
                                action: log.funcName,
                                details: {
                                    pathname: log.pathname,
                                    lineno: log.lineno,
                                    process: log.process,
                                    thread: log.thread
                                }
                            });
                        }
                    });
                }
            } catch (error) {
                // Silently fail - backend might not be available
            }
        };

        // Poll every 5 seconds
        setInterval(pollBackendLogs, 5000);

        // Initial fetch
        pollBackendLogs();
    }

    // Public logging methods for components
    logAction(action: string, component: string, details?: any): void {
        this.addLog({
            level: 'info',
            message: `Action: ${action}`,
            source: 'frontend',
            component,
            action,
            details
        });
    }

    logError(error: Error, component: string, context?: any): void {
        this.addLog({
            level: 'error',
            message: error.message,
            source: 'frontend',
            component,
            details: context,
            stack_trace: error.stack
        });
    }

    logWarning(message: string, component: string, details?: any): void {
        this.addLog({
            level: 'warn',
            message,
            source: 'frontend',
            component,
            details
        });
    }
}

export const enhancedLogService = new EnhancedLogService();