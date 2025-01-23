"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path_1.default.dirname(__filename);
const app = (0, express_1.default)();
const port = 3000;
// Serve static files
app.use(express_1.default.static(__dirname));
// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'index.html'));
});
app.listen(port, () => {
    console.log(`Cascade Teams interface running at http://localhost:${port}`);
    console.log('Open this URL in your browser to start voice communication');
});
//# sourceMappingURL=server.js.map