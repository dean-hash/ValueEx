"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const zod_1 = require("zod");
const configSchema = zod_1.z.object({
    awin: zod_1.z.object({
        apiToken: zod_1.z.string(),
        publisherId: zod_1.z.string(),
    }),
    environment: zod_1.z.enum(['development', 'production', 'test']).default('development'),
});
// Load configuration from environment variables
const config = {
    awin: {
        apiToken: process.env.AWIN_API_TOKEN || '29f5f656-d632-4cdd-b0c1-e4ad3f1fd0e2',
        publisherId: process.env.AWIN_PUBLISHER_ID || '671175',
    },
    environment: process.env.NODE_ENV || 'development',
};
exports.config = config;
// Validate configuration
configSchema.parse(config);
//# sourceMappingURL=index.js.map