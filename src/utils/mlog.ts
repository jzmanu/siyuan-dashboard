/**
 * log level
 */
export enum LogLevel {
    DEBUG,
    INFO,
    WARNING,
    ERROR,
}

/**
 * Logger
 */
export class Logger {
    private static logLevel: LogLevel = LogLevel.ERROR;

    static setLogLevel(logLevel: LogLevel): void {
        Logger.logLevel = logLevel;
    }

    static debug(message: string): void {
        if (Logger.logLevel <= LogLevel.DEBUG) {
            console.log(`[DEBUG] ${message}`);
        }
    }

    static info(message: string): void {
        if (Logger.logLevel <= LogLevel.INFO) {
            console.log(`[INFO] ${message}`);
        }
    }

    static warning(message: string): void {
        if (Logger.logLevel <= LogLevel.WARNING) {
            console.warn(`[WARNING] ${message}`);
        }
    }

    static error(message: string): void {
        if (Logger.logLevel <= LogLevel.ERROR) {
            console.error(`[ERROR] ${message}`);
        }
    }
}
