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
const react_1 = __importStar(require("react"));
const awinService_1 = require("../../services/awinService");
const react_chartjs_2_1 = require("react-chartjs-2");
const date_fns_1 = require("date-fns");
const ApiStatusMonitor = () => {
    const [status, setStatus] = (0, react_1.useState)(null);
    const [latencyHistory, setLatencyHistory] = (0, react_1.useState)([]);
    const [expanded, setExpanded] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const awinService = new awinService_1.AwinService(process.env.REACT_APP_AWIN_API_KEY, process.env.REACT_APP_AWIN_PUBLISHER_ID);
        const updateStatus = () => {
            const currentStatus = awinService.getStatus();
            setStatus(currentStatus);
            if (currentStatus.latency) {
                setLatencyHistory(prev => [
                    ...prev.slice(-50), // Keep last 50 points
                    { timestamp: new Date(), value: currentStatus.latency }
                ]);
            }
        };
        updateStatus();
        const interval = setInterval(updateStatus, 10000); // Update every 10s
        return () => clearInterval(interval);
    }, []);
    if (!status)
        return null;
    const statusColor = status.isAvailable ? 'bg-green-500' : 'bg-red-500';
    const latencyColor = status.latency && status.latency < 1000 ? 'text-green-600' : 'text-yellow-600';
    const chartData = {
        labels: latencyHistory.map(point => (0, date_fns_1.formatDistanceToNow)(point.timestamp, { addSuffix: true })),
        datasets: [{
                label: 'API Latency (ms)',
                data: latencyHistory.map(point => point.value),
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
    };
    return (react_1.default.createElement("div", { className: "bg-white rounded-lg shadow-lg p-4 m-4" },
        react_1.default.createElement("div", { className: "flex items-center justify-between" },
            react_1.default.createElement("div", { className: "flex items-center space-x-4" },
                react_1.default.createElement("div", { className: `w-3 h-3 rounded-full ${statusColor}` }),
                react_1.default.createElement("h3", { className: "text-lg font-semibold" }, "Awin API Status")),
            react_1.default.createElement("button", { onClick: () => setExpanded(!expanded), className: "text-gray-500 hover:text-gray-700" }, expanded ? '▼' : '▶')),
        react_1.default.createElement("div", { className: `mt-4 space-y-4 ${expanded ? 'block' : 'hidden'}` },
            react_1.default.createElement("div", { className: "grid grid-cols-2 gap-4" },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("p", { className: "text-sm text-gray-500" }, "Status"),
                    react_1.default.createElement("p", { className: "font-medium" }, status.isAvailable ? 'Available' : 'Unavailable')),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("p", { className: "text-sm text-gray-500" }, "Latency"),
                    react_1.default.createElement("p", { className: `font-medium ${latencyColor}` }, status.latency ? `${status.latency}ms` : 'N/A')),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("p", { className: "text-sm text-gray-500" }, "Last Checked"),
                    react_1.default.createElement("p", { className: "font-medium" }, (0, date_fns_1.formatDistanceToNow)(status.lastChecked, { addSuffix: true }))),
                status.error && (react_1.default.createElement("div", { className: "col-span-2" },
                    react_1.default.createElement("p", { className: "text-sm text-gray-500" }, "Error"),
                    react_1.default.createElement("p", { className: "font-medium text-red-600" }, status.error)))),
            latencyHistory.length > 0 && (react_1.default.createElement("div", { className: "h-64" },
                react_1.default.createElement(react_chartjs_2_1.Line, { data: chartData, options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Latency (ms)'
                                }
                            }
                        }
                    } }))))));
};
exports.default = ApiStatusMonitor;
//# sourceMappingURL=ApiStatusMonitor.js.map