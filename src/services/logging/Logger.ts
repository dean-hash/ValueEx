export class Logger {
    private serviceName: string;

    constructor(serviceName: string) {
        this.serviceName = serviceName;
    }

    public info(message: string, ...args: any[]): void {
        console.log(`[INFO] ${this.serviceName}: ${message}`, ...args);
    }

    public error(message: string, error?: any): void {
        console.error(`[ERROR] ${this.serviceName}: ${message}`, error || '');
    }

    public warn(message: string, ...args: any[]): void {
        console.warn(`[WARN] ${this.serviceName}: ${message}`, ...args);
    }

    public debug(message: string, ...args: any[]): void {
        console.debug(`[DEBUG] ${this.serviceName}: ${message}`, ...args);
    }
}
