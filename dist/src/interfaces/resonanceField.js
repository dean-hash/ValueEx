"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResonanceEvents = void 0;
// Event names for EventEmitter-based implementations
var ResonanceEvents;
(function (ResonanceEvents) {
    ResonanceEvents["PATTERN_DETECTED"] = "pattern";
    ResonanceEvents["STATE_CHANGED"] = "stateChanged";
    ResonanceEvents["METRIC_UPDATED"] = "metricUpdated";
})(ResonanceEvents || (exports.ResonanceEvents = ResonanceEvents = {}));
