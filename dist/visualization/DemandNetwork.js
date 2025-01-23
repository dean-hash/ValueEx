"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DemandNetwork;
const react_1 = require("react");
const NetworkGraph_1 = require("./NetworkGraph");
function DemandNetwork() {
    const containerRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (!containerRef.current)
            return;
        const graph = new NetworkGraph_1.NetworkGraph(containerRef.current, {
            width: 800,
            height: 600,
            animate: true,
            theme: 'light',
        });
        // Add some sample data
        graph.addNode({
            id: 'demand1',
            label: 'Cloud Storage',
            size: 30,
            color: '#4CAF50',
        });
        graph.addNode({
            id: 'demand2',
            label: 'Data Analytics',
            size: 25,
            color: '#2196F3',
        });
        graph.addEdge({
            from: 'demand1',
            to: 'demand2',
            width: 2,
            color: '#999',
        });
        return () => {
            // Cleanup if needed
        };
    }, []);
    return React.createElement("div", { ref: containerRef, className: "network-container" });
}
//# sourceMappingURL=DemandNetwork.js.map