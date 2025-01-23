"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;
function getEncryptionKey(salt) {
    const key = crypto_1.default.pbkdf2Sync(process.env.ENCRYPTION_KEY || 'default-key-do-not-use-in-production', salt, ITERATIONS, KEY_LENGTH, 'sha512');
    return key;
}
function encrypt(text) {
    // Generate salt and IV
    const salt = crypto_1.default.randomBytes(SALT_LENGTH);
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    // Create key
    const key = getEncryptionKey(salt);
    // Create cipher
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
    // Encrypt
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    // Get auth tag
    const tag = cipher.getAuthTag();
    // Combine everything into a single buffer
    const result = Buffer.concat([salt, iv, tag, encrypted]);
    return result.toString('base64');
}
function decrypt(encryptedText) {
    // Convert from base64
    const buffer = Buffer.from(encryptedText, 'base64');
    // Extract the pieces
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    // Create key
    const key = getEncryptionKey(salt);
    // Create decipher
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    // Decrypt
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
}
// Test the encryption
if (process.env.NODE_ENV === 'development') {
    const testString = 'test-encryption-123';
    const encrypted = encrypt(testString);
    const decrypted = decrypt(encrypted);
    if (testString !== decrypted) {
        throw new Error('Encryption/decryption test failed!');
    }
}
//# sourceMappingURL=encryption.js.map