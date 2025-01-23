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
exports.CredentialsManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("../utils/logger");
class CredentialsManager {
    constructor() {
        this.credentialsPath = path.join(process.cwd(), '.env');
        this.paymentInfoPath = path.join(process.cwd(), '.secure', 'payment.enc');
        this.ensureSecureFiles();
    }
    static getInstance() {
        if (!CredentialsManager.instance) {
            CredentialsManager.instance = new CredentialsManager();
        }
        return CredentialsManager.instance;
    }
    ensureSecureFiles() {
        const secureDir = path.join(process.cwd(), '.secure');
        if (!fs.existsSync(secureDir)) {
            fs.mkdirSync(secureDir, { mode: 0o700 }); // Restricted permissions
        }
        if (!fs.existsSync(this.credentialsPath)) {
            fs.writeFileSync(this.credentialsPath, '', 'utf8');
        }
    }
    ensureEnvFile() {
        if (!fs.existsSync(this.credentialsPath)) {
            fs.writeFileSync(this.credentialsPath, '', 'utf8');
        }
    }
    encryptData(data) {
        // TODO: Implement proper encryption using a hardware security module or KMS
        // For now, using a basic encryption to avoid storing plaintext
        const crypto = require('crypto');
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(process.env.MASTER_KEY || 'default-key', 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return JSON.stringify({
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            data: encrypted.toString('hex')
        });
    }
    decryptData(encryptedData) {
        const crypto = require('crypto');
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(process.env.MASTER_KEY || 'default-key', 'salt', 32);
        const { iv, authTag, data } = JSON.parse(encryptedData);
        const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        return decipher.update(Buffer.from(data, 'hex'), 'hex', 'utf8') + decipher.final('utf8');
    }
    async storeCredentials(credentials) {
        try {
            const envContent = `
${credentials.service.toUpperCase()}_USERNAME=${credentials.username}
${credentials.service.toUpperCase()}_PASSWORD=${credentials.password}
`;
            fs.appendFileSync(this.credentialsPath, envContent);
            logger_1.logger.info(`Stored credentials for ${credentials.service}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to store credentials:', error);
            throw error;
        }
    }
    async getCredentials(service) {
        try {
            const envContent = fs.readFileSync(this.credentialsPath, 'utf8');
            const lines = envContent.split('\n');
            const username = lines
                .find((line) => line.startsWith(`${service.toUpperCase()}_USERNAME=`))
                ?.split('=')[1];
            const password = lines
                .find((line) => line.startsWith(`${service.toUpperCase()}_PASSWORD=`))
                ?.split('=')[1];
            if (username && password) {
                return {
                    username,
                    password,
                    service,
                };
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get credentials:', error);
            throw error;
        }
    }
    async storePaymentInfo(info) {
        try {
            const encryptedData = this.encryptData(JSON.stringify(info));
            fs.writeFileSync(this.paymentInfoPath, encryptedData, { mode: 0o600 }); // Restricted permissions
            logger_1.logger.info('Payment information stored securely');
        }
        catch (error) {
            logger_1.logger.error('Failed to store payment information:', error);
            throw error;
        }
    }
    async getPaymentInfo() {
        try {
            if (!fs.existsSync(this.paymentInfoPath)) {
                return null;
            }
            const encryptedData = fs.readFileSync(this.paymentInfoPath, 'utf8');
            const decryptedData = this.decryptData(encryptedData);
            return JSON.parse(decryptedData);
        }
        catch (error) {
            logger_1.logger.error('Failed to get payment information:', error);
            throw error;
        }
    }
}
exports.CredentialsManager = CredentialsManager;
//# sourceMappingURL=credentialsManager.js.map