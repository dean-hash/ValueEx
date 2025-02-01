import * as d3 from 'd3';
import { NetworkNode, NetworkEdge } from '../types';

interface NetworkGraphOptions {
  width?: number;
  height?: number;
  physics?: {
    enabled: boolean;
    stabilization: boolean;
  };
  nodes?: {
    shape?: string;
    size?: number;
    font?: {
      size?: number;
      color?: string;
    };
  };
  edges?: {
    smooth?: boolean;
    arrows?: {
      to?: boolean;
    };
  };
}

export class NetworkGraph {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private simulation: d3.Simulation<NetworkNode, NetworkEdge>;
  private nodes: NetworkNode[] = [];
  private edges: NetworkEdge[] = [];
  private nodeClickHandler: ((node: NetworkNode) => void) | null = null;
  private edgeClickHandler: ((edge: NetworkEdge) => void) | null = null;
  private options: NetworkGraphOptions;

  constructor(container: HTMLElement, options: NetworkGraphOptions = {}) {
    this.options = {
      width: options.width || 800,
      height: options.height || 600,
      physics: {
        enabled: options.physics?.enabled ?? true,
        stabilization: options.physics?.stabilization ?? true
      },
      nodes: {
        shape: options.nodes?.shape || 'circle',
        size: options.nodes?.size || 25,
        font: {
          size: options.nodes?.font?.size || 14,
          color: options.nodes?.font?.color || '#000000'
        }
      },
      edges: {
        smooth: options.edges?.smooth ?? true,
        arrows: {
          to: options.edges?.arrows?.to ?? true
        }
      }
    };

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', this.options.width)
      .attr('height', this.options.height)
      .attr('viewBox', [0, 0, this.options.width, this.options.height]);

    this.simulation = d3.forceSimulation<NetworkNode>()
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(this.options.width / 2, this.options.height / 2))
      .force('link', d3.forceLink<NetworkNode, NetworkEdge>().id(d => d.id));
  }

  public addNode(nodeData: Partial<NetworkNode>): void {
    const node: NetworkNode = {
      id: nodeData.id!,
      label: nodeData.label || nodeData.id!,
      size: nodeData.size || this.options.nodes.size,
      color: nodeData.color || '#1f77b4',
      value: nodeData.value,
      x: nodeData.x || this.options.width / 2,
      y: nodeData.y || this.options.height / 2,
      fx: null,
      fy: null
    };

    if (!this.nodes.find(n => n.id === node.id)) {
      this.nodes.push(node);
      this.updateVisualization();
    }
  }

  public addEdge(edgeData: Partial<NetworkEdge>): void {
    const edge: NetworkEdge = {
      source: edgeData.source!,
      target: edgeData.target!,
      value: edgeData.value || 1,
      label: edgeData.label
    };

    if (!this.edges.find(e => 
      (e.source === edge.source && e.target === edge.target) ||
      (e.source === edge.target && e.target === edge.source)
    )) {
      this.edges.push(edge);
      this.updateVisualization();
    }
  }

  public onNodeClick(handler: (node: NetworkNode) => void): void {
    this.nodeClickHandler = handler;
  }

  public onEdgeClick(handler: (edge: NetworkEdge) => void): void {
    this.edgeClickHandler = handler;
  }

  private updateVisualization(): void {
    // Update links
    const link = this.svg
      .selectAll<SVGLineElement, NetworkEdge>('line')
      .data(this.edges)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.value));

    // Update nodes
    const node = this.svg
      .selectAll<SVGGElement, NetworkNode>('g.node')
      .data(this.nodes)
      .join(
        enter => {
          const nodeEnter = enter.append('g')
            .attr('class', 'node');
          
          // Initialize the drag behavior
          nodeEnter.call(this.drag());
          
          return nodeEnter;
        },
        update => update,
        exit => exit.remove()
      );

    // Add circles to nodes
    node.selectAll('circle')
      .data(d => [d])
      .join('circle')
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Add labels to nodes
    node.selectAll('text')
      .data(d => [d])
      .join('text')
      .attr('dx', 12)
      .attr('dy', '.35em')
      .text(d => d.label)
      .style('font-size', `${this.options.nodes.font.size}px`)
      .style('fill', this.options.nodes.font.color);

    // Add click handlers
    node.on('click', (event, d) => {
      if (this.nodeClickHandler) {
        this.nodeClickHandler(d);
      }
    });

    link.on('click', (event, d) => {
      if (this.edgeClickHandler) {
        this.edgeClickHandler(d);
      }
    });

    // Update simulation
    this.simulation
      .nodes(this.nodes)
      .force('link', d3.forceLink<NetworkNode, NetworkEdge>(this.edges).id(d => d.id));

    this.simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as NetworkNode).x!)
        .attr('y1', d => (d.source as NetworkNode).y!)
        .attr('x2', d => (d.target as NetworkNode).x!)
        .attr('y2', d => (d.target as NetworkNode).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    this.simulation.alpha(1).restart();
  }

  private drag() {
    return d3.drag<SVGGElement, NetworkNode>()
      .on('start', (event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>) => {
        const d = event.subject;
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>) => {
        const d = event.subject;
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>) => {
        const d = event.subject;
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
  }

  public clear(): void {
    this.nodes = [];
    this.edges = [];
    this.updateVisualization();
  }
}
