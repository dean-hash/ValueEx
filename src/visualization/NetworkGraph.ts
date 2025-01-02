import * as d3 from 'd3';

interface NetworkNode {
    id: string;
    label: string;
    size: number;
    color: string;
}

interface NetworkEdge {
    from: string;
    to: string;
    width: number;
    color: string;
}

interface NetworkConfig {
    height: number;
    width: number;
    animate: boolean;
    theme: 'light' | 'dark';
}

export class NetworkGraph {
    private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    private simulation: d3.Simulation<NetworkNode, NetworkEdge>;
    private nodes: NetworkNode[] = [];
    private edges: NetworkEdge[] = [];
    private config: NetworkConfig;

    constructor(container: HTMLElement, config: NetworkConfig) {
        this.config = config;
        
        // Initialize SVG
        this.svg = d3.select(container)
            .append('svg')
            .attr('width', config.width)
            .attr('height', config.height);

        // Initialize force simulation
        this.simulation = d3.forceSimulation<NetworkNode>()
            .force('link', d3.forceLink<NetworkNode, NetworkEdge>().id(d => d.id))
            .force('charge', d3.forceManyBody().strength(-100))
            .force('center', d3.forceCenter(config.width / 2, config.height / 2));
    }

    public addNode(node: NetworkNode): void {
        if (!this.nodes.find(n => n.id === node.id)) {
            this.nodes.push(node);
            this.updateVisualization();
        }
    }

    public addEdge(edge: NetworkEdge): void {
        if (!this.edges.find(e => e.from === edge.from && e.to === edge.to)) {
            this.edges.push(edge);
            this.updateVisualization();
        }
    }

    private updateVisualization(): void {
        // Update links
        const links = this.svg.selectAll('.link')
            .data(this.edges)
            .join('line')
            .attr('class', 'link')
            .attr('stroke-width', d => d.width)
            .attr('stroke', d => d.color);

        // Update nodes
        const nodes = this.svg.selectAll('.node')
            .data(this.nodes)
            .join('g')
            .attr('class', 'node')
            .call(d3.drag<any, NetworkNode>()
                .on('start', this.dragStarted.bind(this))
                .on('drag', this.dragged.bind(this))
                .on('end', this.dragEnded.bind(this)));

        nodes.selectAll('circle')
            .data(d => [d])
            .join('circle')
            .attr('r', d => d.size)
            .attr('fill', d => d.color);

        nodes.selectAll('text')
            .data(d => [d])
            .join('text')
            .text(d => d.label)
            .attr('dx', 12)
            .attr('dy', '.35em');

        // Update simulation
        this.simulation
            .nodes(this.nodes)
            .on('tick', () => {
                links
                    .attr('x1', d => (this.nodes.find(n => n.id === d.from) as any).x)
                    .attr('y1', d => (this.nodes.find(n => n.id === d.from) as any).y)
                    .attr('x2', d => (this.nodes.find(n => n.id === d.to) as any).x)
                    .attr('y2', d => (this.nodes.find(n => n.id === d.to) as any).y);

                nodes
                    .attr('transform', d => `translate(${(d as any).x},${(d as any).y})`);
            });

        (this.simulation.force('link') as d3.ForceLink<NetworkNode, NetworkEdge>)
            .links(this.edges);

        this.simulation.alpha(1).restart();
    }

    private dragStarted(event: any): void {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    private dragged(event: any): void {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    private dragEnded(event: any): void {
        if (!event.active) this.simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }
}
