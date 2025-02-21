"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = exports.ServiceError = void 0;
var ServiceError = /** @class */ (function (_super) {
    __extends(ServiceError, _super);
    function ServiceError(message, code, service, recoverable, originalError) {
        if (recoverable === void 0) { recoverable = true; }
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.service = service;
        _this.recoverable = recoverable;
        _this.originalError = originalError;
        _this.name = 'ServiceError';
        return _this;
    }
    return ServiceError;
}(Error));
exports.ServiceError = ServiceError;
var ErrorHandler = /** @class */ (function () {
    function ErrorHandler() {
    }
    ErrorHandler.handleError = function (error) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(error instanceof ServiceError)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.handleServiceError(error)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        console.error('Unexpected error:', error);
                        throw error;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ErrorHandler.handleServiceError = function (error) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.error("[".concat(error.service, "] Error ").concat(error.code, ": ").concat(error.message));
                        if (!error.recoverable) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.attemptRecovery(error)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2: throw error;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ErrorHandler.attemptRecovery = function (error) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = error.service;
                        switch (_a) {
                            case 'Teams': return [3 /*break*/, 1];
                            case 'Speech': return [3 /*break*/, 3];
                            case 'Communication': return [3 /*break*/, 5];
                            case 'Metrics': return [3 /*break*/, 7];
                        }
                        return [3 /*break*/, 9];
                    case 1: return [4 /*yield*/, this.recoverTeamsService(error)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 10];
                    case 3: return [4 /*yield*/, this.recoverSpeechService(error)];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 10];
                    case 5: return [4 /*yield*/, this.recoverCommunicationService(error)];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 10];
                    case 7: return [4 /*yield*/, this.recoverMetricsService(error)];
                    case 8:
                        _b.sent();
                        return [3 /*break*/, 10];
                    case 9: throw error;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    ErrorHandler.recoverTeamsService = function (error) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = error.code;
                        switch (_a) {
                            case 'AUTH_FAILED': return [3 /*break*/, 1];
                            case 'CALL_DROPPED': return [3 /*break*/, 3];
                        }
                        return [3 /*break*/, 5];
                    case 1: 
                    // Attempt to refresh token
                    return [4 /*yield*/, this.refreshTokens()];
                    case 2:
                        // Attempt to refresh token
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 3: 
                    // Attempt to rejoin call
                    return [4 /*yield*/, this.reconnectCall()];
                    case 4:
                        // Attempt to rejoin call
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 5: throw error;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    ErrorHandler.recoverSpeechService = function (error) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = error.code;
                        switch (_a) {
                            case 'RECOGNITION_FAILED': return [3 /*break*/, 1];
                            case 'SYNTHESIS_FAILED': return [3 /*break*/, 3];
                        }
                        return [3 /*break*/, 5];
                    case 1: 
                    // Restart speech recognition
                    return [4 /*yield*/, this.restartSpeechRecognition()];
                    case 2:
                        // Restart speech recognition
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 3: 
                    // Retry text-to-speech
                    return [4 /*yield*/, this.retrySpeechSynthesis()];
                    case 4:
                        // Retry text-to-speech
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 5: throw error;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    ErrorHandler.recoverCommunicationService = function (error) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = error.code;
                        switch (_a) {
                            case 'TOKEN_EXPIRED': return [3 /*break*/, 1];
                            case 'CONNECTION_LOST': return [3 /*break*/, 3];
                        }
                        return [3 /*break*/, 5];
                    case 1: return [4 /*yield*/, this.refreshTokens()];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 3: return [4 /*yield*/, this.reconnectCommunication()];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 5: throw error;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    ErrorHandler.recoverMetricsService = function (error) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = error.code;
                        switch (_a) {
                            case 'PROCESSING_FAILED': return [3 /*break*/, 1];
                        }
                        return [3 /*break*/, 3];
                    case 1: 
                    // Retry metrics processing
                    return [4 /*yield*/, this.retryMetricsProcessing()];
                    case 2:
                        // Retry metrics processing
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3: throw error;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Recovery implementations
    ErrorHandler.refreshTokens = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    ErrorHandler.reconnectCall = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    ErrorHandler.restartSpeechRecognition = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    ErrorHandler.retrySpeechSynthesis = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    ErrorHandler.reconnectCommunication = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    ErrorHandler.retryMetricsProcessing = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    return ErrorHandler;
}());
exports.ErrorHandler = ErrorHandler;
