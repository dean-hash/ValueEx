declare module 'imapflow' {
    export class ImapFlow {
        constructor(config: any);
        connect(): Promise<void>;
        getMailboxLock(mailbox: string): Promise<any>;
        logout(): Promise<void>;
        on(event: string, callback: (message: any) => void): void;
    }
}
