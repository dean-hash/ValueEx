declare module 'mailparser' {
    export function simpleParser(source: any): Promise<{
        subject: string;
        from: { text: string };
        to: { text: string };
        text: string;
        html: string;
    }>;
}
