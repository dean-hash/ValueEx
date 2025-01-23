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
Object.defineProperty(exports, "__esModule", { value: true });
exports.credentials = void 0;
exports.getGraphToken = getGraphToken;
var identity_1 = require("@azure/identity");
var microsoft_graph_client_1 = require("@microsoft/microsoft-graph-client");
var azureTokenCredentials_1 = require("@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials");
// Direct credential management
var credentials = {
    tenantId: process.env.AZURE_TENANT_ID,
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET
};
exports.credentials = credentials;
function getGraphToken() {
    return __awaiter(this, void 0, void 0, function () {
        var credential, scopes, authProvider, client, me, commToken, config, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 4, , 5]);
                    credential = new identity_1.ClientSecretCredential(credentials.tenantId, credentials.clientId, credentials.clientSecret);
                    scopes = [
                        'https://graph.microsoft.com/.default',
                        'Calls.JoinGroupCall.All',
                        'Calls.InitiateGroupCall.All',
                        'OnlineMeetings.ReadWrite.All',
                        'User.Read.All'
                    ];
                    authProvider = new azureTokenCredentials_1.TokenCredentialAuthenticationProvider(credential, {
                        scopes: scopes
                    });
                    client = microsoft_graph_client_1.Client.initWithMiddleware({
                        authProvider: authProvider
                    });
                    return [4 /*yield*/, client.api('/me').get()];
                case 1:
                    me = _b.sent();
                    return [4 /*yield*/, getCommunicationToken(credential)];
                case 2:
                    commToken = _b.sent();
                    _a = {};
                    return [4 /*yield*/, credential.getToken(scopes[0])];
                case 3:
                    config = (_a.token = (_b.sent()).token,
                        _a.userId = me.id,
                        _a.displayName = me.displayName,
                        _a.tenantId = credentials.tenantId,
                        _a.communicationToken = commToken,
                        _a);
                    return [2 /*return*/, config];
                case 4:
                    error_1 = _b.sent();
                    console.error('Teams setup error:', error_1);
                    throw error_1;
                case 5: return [2 /*return*/];
            }
        });
    });
}
function getCommunicationToken(credential) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Implementation will connect to Azure Communication Services
            // This will be used for speech services integration
            return [2 /*return*/, "placeholder-for-comm-token"];
        });
    });
}
// Only run if called directly
if (require.main === module) {
    getGraphToken()
        .then(function (config) {
        console.log('\nTeams configuration ready!');
        console.log("Connected as: ".concat(config.displayName));
        console.log("User ID: ".concat(config.userId));
    })
        .catch(function (error) {
        console.error('Failed to initialize Teams:', error);
        process.exit(1);
    });
}
