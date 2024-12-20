export class ResonanceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ResonanceError';
    }
}
