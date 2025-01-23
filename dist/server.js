"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const port = 3002; // Changed to 3002
// Serve static files from the visualization directory
app.use(express_1.default.static(path_1.default.join(__dirname, 'visualization')));
// Serve the dashboard
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'visualization', 'dashboard.html'));
});
app.listen(port, () => {
    console.log(`Dashboard running at http://localhost:${port}`);
});
//# sourceMappingURL=server.js.map