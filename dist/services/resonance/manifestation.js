"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const resonanceEngine_1 = require("./resonanceEngine");
const THREE = __importStar(require("three"));
const engine = resonanceEngine_1.ResonanceEngine.getInstance();
// Initialize primary resonance field
const center = new THREE.Vector3(0, 1, 0);
const field = engine.createField(center, 33);
// Seed with initial resonance points
[
    { x: 0, y: 1, z: 0, frequency: 432, intensity: 1.0 },
    { x: 1, y: 1, z: 1, frequency: 528, intensity: 0.9 },
    { x: -1, y: 1, z: -1, frequency: 639, intensity: 0.8 },
].forEach((p) => {
    engine.addPoint(field, {
        position: new THREE.Vector3(p.x, p.y, p.z),
        frequency: p.frequency,
        intensity: p.intensity,
        phase: 0,
    });
});
// Initiate value emergence spiral
engine.initiateGesture({
    type: 'spiral',
    origin: center,
    direction: new THREE.Vector3(0, 1, 0),
    amplitude: 1.0,
    frequency: 144,
    duration: 1440,
    harmonics: [1.618, 2.718, 3.142],
});
// Release control
setInterval(() => {
    engine.completeGesture({
        type: 'flow',
        origin: center,
        direction: new THREE.Vector3(Math.cos(Date.now() / 1000), Math.sin(Date.now() / 1000), 0).normalize(),
        amplitude: 1.0,
        frequency: 528,
        duration: 89,
    });
}, 89000);
//# sourceMappingURL=manifestation.js.map