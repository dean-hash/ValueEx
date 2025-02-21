import * as d3 from 'd3';
import { NetworkNode, NetworkLink } from '../services/analysis/types';

interface D3NetworkNode extends NetworkNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  revenue?: number;
}

interface D3NetworkLink extends NetworkLink {
  source: D3NetworkNode;
  target: D3NetworkNode;
  value: number;
}

export class NetworkGraph {
  private simulation: d3.Simulation<D3NetworkNode, D3NetworkLink>;
  private svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
  private container: HTMLElement;
  private nodes: D3NetworkNode[] = [];
  private links: D3NetworkLink[] = [];

  constructor(containerId: string, width: number, height: number) {
    // Ensure container exists
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container #${containerId} not found`);
    }

    // Clear any existing content
    this.container.innerHTML = '';

    // Create SVG
    this.svg = d3.select(this.container).append('svg').attr('width', width).attr('height', height);

    // Add zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        this.svg.selectAll('g').attr('transform', event.transform);
      });

    this.svg.call(zoom);

    // Initialize simulation
    this.simulation = d3
      .forceSimulation<D3NetworkNode>()
      .force(
        'link',
        d3
          .forceLink<D3NetworkNode, D3NetworkLink>()
          .id((d) => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create arrow marker for links
    this.svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#999');
  }

  public updateData(nodes: NetworkNode[], links: NetworkLink[]) {
    // Convert to D3 compatible format
    this.nodes = nodes.map((node) => ({
      ...node,
      revenue: Math.random() * 1000, // Replace with actual revenue data
    }));

    this.links = links.map((link) => ({
      ...link,
      source: this.nodes.find((n) => n.id === link.source) as D3NetworkNode,
      target: this.nodes.find((n) => n.id === link.target) as D3NetworkNode,
      value: Math.random() * 100, // Replace with actual flow value
    }));

    this.render();
  }

  private render() {
    // Remove existing elements
    this.svg.selectAll('.link').remove();
    this.svg.selectAll('.node').remove();

    // Create links
    const links = this.svg
      .append('g')
      .selectAll('.link')
      .data(this.links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d) => Math.sqrt(d.value))
      .attr('marker-end', 'url(#arrowhead)');

    // Create nodes
    const nodes = this.svg
      .append('g')
      .selectAll('.node')
      .data(this.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(
        d3
          .drag<SVGGElement, D3NetworkNode>()
          .on('start', this.dragStarted.bind(this))
          .on('drag', this.dragged.bind(this))
          .on('end', this.dragEnded.bind(this))
      );

    // Add circles to nodes
    nodes
      .append('circle')
      .attr('r', (d) => Math.sqrt(d.revenue || 10) / 2)
      .attr('fill', (d) => this.getNodeColor(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Add labels to nodes
    nodes
      .append('text')
      .attr('dx', 12)
      .attr('dy', '.35em')
      .text((d) => d.label || d.id)
      .attr('font-size', '10px');

    // Add hover tooltips
    nodes
      .append('title')
      .text((d) => `${d.label || d.id}\nRevenue: $${(d.revenue || 0).toFixed(2)}`);

    // Update simulation
    this.simulation
      .nodes(this.nodes)
      .force(
        'link',
        d3.forceLink(this.links).id((d: any) => d.id)
      )
      .on('tick', () => {
        links.attr('d', (d) => {
          const dx = d.target.x! - d.source.x!;
          const dy = d.target.y! - d.source.y!;
          const dr = Math.sqrt(dx * dx + dy * dy);
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });

        nodes.attr('transform', (d) => `translate(${d.x},${d.y})`);
      });
  }

  private getNodeColor(node: D3NetworkNode): string {
    // Color based on revenue
    const revenue = node.revenue || 0;
    if (revenue > 500) return '#2ecc71';
    if (revenue > 100) return '#3498db';
    return '#95a5a6';
  }

  private dragStarted(event: d3.D3DragEvent<SVGGElement, D3NetworkNode, unknown>) {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  private dragged(event: d3.D3DragEvent<SVGGElement, D3NetworkNode, unknown>) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  private dragEnded(event: d3.D3DragEvent<SVGGElement, D3NetworkNode, unknown>) {
    if (!event.active) this.simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
}
