"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var teamsIntegration_1 = require("./services/teamsIntegration");
var revenueMetricsService_1 = require("./services/revenueMetricsService");
var errorHandler_1 = require("./utils/errorHandler");
var app = (0, express_1.default)();
app.use(express_1.default.json());
// Initialize services
var teamsService = new teamsIntegration_1.TeamsIntegration();
var valueCreation = new revenueMetricsService_1.ValueCreationService(null, // These will be properly initialized in production
null, null, null);
// Error handling
app.use(errorHandler_1.ErrorHandler.handleError);
// Initialize Teams integration
teamsService.initialize().catch(console.error);
// API Routes
app.post('/api/meetings/start', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var subject, meeting, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                subject = req.body.subject;
                return [4 /*yield*/, teamsService.startMeeting(subject)];
            case 1:
                meeting = _a.sent();
                res.json(meeting);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                errorHandler_1.ErrorHandler.handleError(error_1);
                res.status(500).json({ error: 'Failed to start meeting' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/value/measure', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, product, pattern, metrics, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, product = _a.product, pattern = _a.pattern;
                return [4 /*yield*/, valueCreation.measureValueCreation(product, pattern)];
            case 1:
                metrics = _b.sent();
                res.json(metrics);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                errorHandler_1.ErrorHandler.handleError(error_2);
                res.status(500).json({ error: 'Failed to measure value' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("ValueEx MVP running on port ".concat(port));
});
