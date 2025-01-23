"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
async function testTeamsConnection() {
    const token = process.env.TEAMS_TOKEN;
    if (!token) {
        console.error('No Teams token found in environment');
        return false;
    }
    try {
        // Test connection by getting current user
        const response = await (0, node_fetch_1.default)('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Connected as:', data.displayName);
        return true;
    }
    catch (error) {
        console.error('Teams connection failed:', error);
        return false;
    }
}
testTeamsConnection();
//# sourceMappingURL=teamsGraphTest.js.map