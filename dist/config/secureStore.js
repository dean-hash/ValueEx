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
exports.SecureStore = void 0;
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("../utils/logger");
class SecureStore {
    constructor() {
        this.storePath = path.join(process.cwd(), '.secure', 'credentials.enc');
        // In production, this should come from a hardware security module or secure environment variable
        const salt = 'ValueEx_Salt'; // This should be randomly generated and stored securely
        this.masterKey = (0, crypto_1.scryptSync)(process.env.MASTER_KEY || 'default-master-key', salt, 32);
        this.ensureSecureDirectory();
    }
    static getInstance() {
        if (!SecureStore.instance) {
            SecureStore.instance = new SecureStore();
        }
        return SecureStore.instance;
    }
    ensureSecureDirectory() {
        const secureDir = path.dirname(this.storePath);
        if (!fs.existsSync(secureDir)) {
            fs.mkdirSync(secureDir, { mode: 0o700 }); // Restricted permissions
        }
    }
    encrypt(data) {
        const iv = (0, crypto_1.randomBytes)(16);
        const cipher = (0, crypto_1.createCipheriv)('aes-256-gcm', this.masterKey, iv);
        const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return {
            iv: iv.toString('hex'),
            encryptedData: encrypted.toString('hex') + ':' + authTag.toString('hex')
        };
    }
    decrypt(encryptedData, iv) {
        const [data, authTag] = encryptedData.split(':');
        const decipher = (0, crypto_1.createDecipheriv)('aes-256-gcm', this.masterKey, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        return decipher.update(Buffer.from(data, 'hex'), 'hex', 'utf8') +
            decipher.final('utf8');
    }
    async storeCredential(credential) {
        try {
            let credentials = await this.getAllCredentials();
            credentials = credentials.filter(c => c.service !== credential.service);
            credentials.push(credential);
            const encrypted = this.encrypt(JSON.stringify(credentials));
            const data = JSON.stringify(encrypted);
            fs.writeFileSync(this.storePath, data, { mode: 0o600 }); // Restricted permissions
            logger_1.logger.info(`Stored credentials for ${credential.service}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to store credentials:', error);
            throw error;
        }
    }
    async getCredential(service) {
        try {
            const credentials = await this.getAllCredentials();
            return credentials.find(c => c.service === service) || null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get credentials:', error);
            throw error;
        }
    }
    async getAllCredentials() {
        try {
            if (!fs.existsSync(this.storePath)) {
                return [];
            }
            const data = fs.readFileSync(this.storePath, 'utf8');
            const { iv, encryptedData } = JSON.parse(data);
            const decrypted = this.decrypt(encryptedData, iv);
            return JSON.parse(decrypted);
        }
        catch (error) {
            logger_1.logger.error('Failed to get all credentials:', error);
            return [];
        }
    }
    async updateMasterKey(newMasterKey) {
        try {
            // Get all credentials with old key
            const credentials = await this.getAllCredentials();
            // Update master key
            const salt = 'ValueEx_Salt';
            this.masterKey = (0, crypto_1.scryptSync)(newMasterKey, salt, 32);
            // Re-encrypt all credentials with new key
            const encrypted = this.encrypt(JSON.stringify(credentials));
            const data = JSON.stringify(encrypted);
            fs.writeFileSync(this.storePath, data, { mode: 0o600 });
            logger_1.logger.info('Master key updated successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to update master key:', error);
            throw error;
        }
    }
}
exports.SecureStore = SecureStore;
//# sourceMappingURL=secureStore.js.map