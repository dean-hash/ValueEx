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
exports.configService = exports.ConfigService = void 0;
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
const zod_1 = require("zod");
// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
// Define configuration schema
const configSchema = zod_1.z.object({
    // Affiliate Networks
    awin: zod_1.z.object({
        apiToken: zod_1.z.string().optional(),
        publisherId: zod_1.z.string().optional(),
        apiKey: zod_1.z.string().optional(),
        apiSecret: zod_1.z.string().optional(),
    }),
    fiverr: zod_1.z.object({
        apiKey: zod_1.z.string().optional(),
    }),
    godaddy: zod_1.z.object({
        apiKey: zod_1.z.string(),
        apiSecret: zod_1.z.string(),
    }),
    // OpenAI
    openai: zod_1.z.object({
        apiKey: zod_1.z.string(),
    }),
    // Server
    server: zod_1.z.object({
        port: zod_1.z.number().default(3000),
        environment: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    }),
    // Database
    database: zod_1.z.object({
        url: zod_1.z.string().optional(),
    }),
});
class ConfigService {
    constructor() {
        this.config = this.loadConfig();
    }
    static getInstance() {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }
    loadConfig() {
        const config = {
            awin: {
                apiToken: process.env.AWIN_API_TOKEN,
                publisherId: process.env.AWIN_PUBLISHER_ID,
                apiKey: process.env.AWIN_API_KEY,
                apiSecret: process.env.AWIN_API_SECRET,
            },
            fiverr: {
                apiKey: process.env.FIVERR_API_KEY,
            },
            godaddy: {
                apiKey: process.env.GODADDY_API_KEY || '',
                apiSecret: process.env.GODADDY_API_SECRET || '',
            },
            openai: {
                apiKey: process.env.OPENAI_API_KEY || '',
            },
            server: {
                port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
                environment: (process.env.NODE_ENV || 'development'),
            },
            database: {
                url: process.env.DATABASE_URL,
            },
        };
        try {
            return configSchema.parse(config);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                console.error('Configuration validation failed:', error.errors);
            }
            throw error;
        }
    }
    get(key, subKey) {
        if (subKey) {
            return this.config[key]?.[subKey];
        }
        return this.config[key];
    }
    getAll() {
        return { ...this.config };
    }
}
exports.ConfigService = ConfigService;
exports.configService = ConfigService.getInstance();
//# sourceMappingURL=configService.js.map