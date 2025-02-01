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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = void 0;
var events_1 = require("events");
var MetricsCollector = /** @class */ (function (_super) {
    __extends(MetricsCollector, _super);
    function MetricsCollector() {
        var _this = _super.call(this) || this;
        _this.metricValues = new Map();
        return _this;
    }
    MetricsCollector.getInstance = function () {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector();
        }
        return MetricsCollector.instance;
    };
    MetricsCollector.prototype.getMetricValues = function (metric) {
        return this.metricValues.get(metric) || [];
    };
    MetricsCollector.prototype.getLatestMetricValues = function () {
        var latest = {};
        this.metricValues.forEach(function (values, metric) {
            latest[metric] = values[values.length - 1] || 0;
        });
        return latest;
    };
    return MetricsCollector;
}(events_1.EventEmitter));
exports.MetricsCollector = MetricsCollector;
