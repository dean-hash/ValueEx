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
exports.NetworkGraph = void 0;
const d3 = __importStar(require("d3"));
class NetworkGraph {
    constructor(containerId, width, height) {
        this.nodes = [];
        this.links = [];
        this.svg = d3
            .select(`#${containerId}`)
            .append('svg')
            .attr('width', width)
            .attr('height', height);
        this.simulation = d3
            .forceSimulation()
            .force('link', d3.forceLink().id((d) => d.id))
            .force('charge', d3.forceManyBody().strength(-100))
            .force('center', d3.forceCenter(width / 2, height / 2));
    }
    updateData(nodes, links) {
        // Convert to D3 compatible nodes and links
        this.nodes = nodes.map((node) => ({ ...node }));
        this.links = links.map((link) => ({
            ...link,
            source: this.nodes.find((n) => n.id === link.source),
            target: this.nodes.find((n) => n.id === link.target),
        }));
        this.render();
    }
    render() {
        // Clear existing elements
        this.svg.selectAll('*').remove();
        // Create arrow marker for directed links
        this.svg
            .append('defs')
            .append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 13)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('xoverflow', 'visible')
            .append('svg:path')
            .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
            .attr('fill', '#999')
            .style('stroke', 'none');
        // Draw links
        const link = this.svg
            .append('g')
            .selectAll('line')
            .data(this.links)
            .enter()
            .append('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', (d) => Math.sqrt(d.value))
            .attr('marker-end', 'url(#arrowhead)');
        // Draw nodes
        const node = this.svg
            .append('g')
            .selectAll('circle')
            .data(this.nodes)
            .enter()
            .append('circle')
            .attr('r', 5)
            .attr('fill', this.getNodeColor)
            .call(this.drag(this.simulation));
        // Add labels
        const labels = this.svg
            .append('g')
            .selectAll('text')
            .data(this.nodes)
            .enter()
            .append('text')
            .text((d) => d.id)
            .attr('font-size', '12px')
            .attr('dx', 8)
            .attr('dy', 3);
        // Update simulation
        this.simulation.nodes(this.nodes).on('tick', () => {
            link
                .attr('x1', (d) => d.source.x)
                .attr('y1', (d) => d.source.y)
                .attr('x2', (d) => d.target.x)
                .attr('y2', (d) => d.target.y);
            node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
            labels.attr('x', (d) => d.x).attr('y', (d) => d.y);
        });
        const linkForce = this.simulation.force('link');
        if (linkForce) {
            linkForce.links(this.links);
        }
    }
    getNodeColor(node) {
        switch (node.type) {
            case 'signal':
                return '#1f77b4';
            case 'pattern':
                return '#2ca02c';
            case 'prediction':
                return '#ff7f0e';
            default:
                return '#999';
        }
    }
    drag(simulation) {
        function dragstarted(event, d) {
            if (!event.active)
                simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        function dragended(event, d) {
            if (!event.active)
                simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
        return d3
            .drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }
}
exports.NetworkGraph = NetworkGraph;
//# sourceMappingURL=NetworkGraph.js.map