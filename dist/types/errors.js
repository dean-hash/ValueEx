"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResonanceError = void 0;
class ResonanceError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ResonanceError';
    }
}
exports.ResonanceError = ResonanceError;
//# sourceMappingURL=errors.js.map