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
exports.ResonanceField = void 0;
const THREE = __importStar(require("three"));
const logger_1 = require("../utils/logger");
class ResonanceField {
    constructor() {
        this.points = [];
        this.scene = new THREE.Scene();
        this.initializeField();
    }
    initializeField() {
        try {
            const geometry = new THREE.BufferGeometry();
            const material = new THREE.PointsMaterial({ size: 0.1, color: 0xffffff });
            const points = new THREE.Points(geometry, material);
            this.scene.add(points);
        }
        catch (error) {
            logger_1.logger.error('Error initializing resonance field:', error);
            throw error;
        }
    }
    addResonancePoint(position, intensity) {
        try {
            this.points.push({
                position,
                intensity,
                connections: [],
            });
            this.updateField();
        }
        catch (error) {
            logger_1.logger.error('Error adding resonance point:', error);
            throw error;
        }
    }
    updateField() {
        try {
            const positions = new Float32Array(this.points.length * 3);
            this.points.forEach((point, index) => {
                positions[index * 3] = point.position.x;
                positions[index * 3 + 1] = point.position.y;
                positions[index * 3 + 2] = point.position.z;
            });
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const material = new THREE.PointsMaterial({
                size: 0.1,
                color: 0xffffff,
                transparent: true,
                opacity: 0.8,
            });
            const points = new THREE.Points(geometry, material);
            this.scene.clear();
            this.scene.add(points);
        }
        catch (error) {
            logger_1.logger.error('Error updating resonance field:', error);
            throw error;
        }
    }
}
exports.ResonanceField = ResonanceField;
//# sourceMappingURL=resonanceField.js.map