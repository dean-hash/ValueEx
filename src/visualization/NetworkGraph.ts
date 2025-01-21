import * as d3 from 'd3';
import { NetworkNode, NetworkLink } from '../services/analysis/types';

interface D3NetworkNode extends NetworkNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface D3NetworkLink extends NetworkLink {
  source: D3NetworkNode;
  target: D3NetworkNode;
}

export class NetworkGraph {
  private simulation: d3.Simulation<D3NetworkNode, D3NetworkLink>;
  private svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
  private nodes: D3NetworkNode[] = [];
  private links: D3NetworkLink[] = [];

  constructor(containerId: string, width: number, height: number) {
    this.svg = d3
      .select(`#${containerId}`)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    this.simulation = d3
      .forceSimulation<D3NetworkNode>()
      .force(
        'link',
        d3.forceLink<D3NetworkNode, D3NetworkLink>().id((d) => d.id)
      )
      .force('charge', d3.forceManyBody<D3NetworkNode>().strength(-100))
      .force('center', d3.forceCenter<D3NetworkNode>(width / 2, height / 2));
  }

  public updateData(nodes: NetworkNode[], links: NetworkLink[]) {
    // Convert to D3 compatible nodes and links
    this.nodes = nodes.map((node) => ({ ...node })) as D3NetworkNode[];
    this.links = links.map((link) => ({
      ...link,
      source: this.nodes.find((n) => n.id === link.source) as D3NetworkNode,
      target: this.nodes.find((n) => n.id === link.target) as D3NetworkNode,
    }));

    this.render();
  }

  private render() {
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
        .attr('x1', (d) => d.source.x!)
        .attr('y1', (d) => d.source.y!)
        .attr('x2', (d) => d.target.x!)
        .attr('y2', (d) => d.target.y!);

      node.attr('cx', (d) => d.x!).attr('cy', (d) => d.y!);

      labels.attr('x', (d) => d.x!).attr('y', (d) => d.y!);
    });

    const linkForce = this.simulation.force<d3.ForceLink<D3NetworkNode, D3NetworkLink>>('link');
    if (linkForce) {
      linkForce.links(this.links);
    }
  }

  private getNodeColor(node: D3NetworkNode): string {
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

  private drag(simulation: d3.Simulation<D3NetworkNode, D3NetworkLink>) {
    function dragstarted(
      event: d3.D3DragEvent<SVGCircleElement, D3NetworkNode, D3NetworkNode>,
      d: D3NetworkNode
    ) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(
      event: d3.D3DragEvent<SVGCircleElement, D3NetworkNode, D3NetworkNode>,
      d: D3NetworkNode
    ) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(
      event: d3.D3DragEvent<SVGCircleElement, D3NetworkNode, D3NetworkNode>,
      d: D3NetworkNode
    ) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3
      .drag<SVGCircleElement, D3NetworkNode>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }
}
