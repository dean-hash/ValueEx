import * as d3 from 'd3';
import { TimelineEvent } from '../types';

interface SystemMetrics {
  cpu: number;
  memory: number;
  network: number;
  health: 'healthy' | 'warning' | 'critical';
  processed: number;
  confidence: number;
  load: number;
  activeSignals: number;
  patterns: string[];
  insights: string[];
}

interface IntelligenceVizOptions {
  width?: number;
  height?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  colors?: {
    cpu: string;
    memory: string;
    network: string;
    event: string;
  };
}

export class IntelligenceViz {
  private readonly svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private readonly container: d3.Selection<SVGGElement, unknown, null, undefined>;
  private readonly width: number;
  private readonly height: number;
  private readonly margin: { top: number; right: number; bottom: number; left: number };
  private readonly colors: { cpu: string; memory: string; network: string; event: string };
  
  private cpuLine: d3.Selection<SVGPathElement, TimelineEvent[], SVGGElement, unknown>;
  private memoryLine: d3.Selection<SVGPathElement, TimelineEvent[], SVGGElement, unknown>;
  private networkLine: d3.Selection<SVGPathElement, TimelineEvent[], SVGGElement, unknown>;
  private eventPoints: d3.Selection<SVGCircleElement, TimelineEvent, SVGGElement, unknown>;
  
  private readonly xScale: d3.ScaleTime<number, number>;
  private readonly yScale: d3.ScaleLinear<number, number>;
  private events: TimelineEvent[] = [];
  private metrics: SystemMetrics[] = [];

  constructor(containerId: string, options: IntelligenceVizOptions = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id '${containerId}' not found`);
    }

    this.width = options.width || 800;
    this.height = options.height || 400;
    this.margin = options.margin || {
      top: 20,
      right: 20,
      bottom: 30,
      left: 50
    };

    this.colors = options.colors || {
      cpu: '#ff7f0e',
      memory: '#2ca02c',
      network: '#1f77b4',
      event: '#9467bd'
    };

    // Initialize SVG
    this.svg = d3.select(container)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom);

    this.container = this.svg
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Initialize scales
    this.xScale = d3.scaleTime()
      .range([0, this.width]);

    this.yScale = d3.scaleLinear()
      .range([this.height, 0]);

    // Initialize visualization elements
    this.cpuLine = this.initializeLine(this.colors.cpu);
    this.memoryLine = this.initializeLine(this.colors.memory);
    this.networkLine = this.initializeLine(this.colors.network);
    this.eventPoints = this.initializeEventPoints();

    // Initialize axes
    this.initializeAxes();
  }

  private initializeLine(color: string): d3.Selection<SVGPathElement, TimelineEvent[], SVGGElement, unknown> {
    return this.container
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 1.5);
  }

  private initializeEventPoints(): d3.Selection<SVGCircleElement, TimelineEvent, SVGGElement, unknown> {
    return this.container
      .append('g')
      .attr('class', 'events')
      .selectAll('circle');
  }

  private initializeAxes(): void {
    // Add X axis
    this.container
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${this.height})`)
      .call(d3.axisBottom(this.xScale));

    // Add Y axis
    this.container
      .append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(this.yScale));
  }

  public updateData(metrics: SystemMetrics[], events: TimelineEvent[]): void {
    this.metrics = metrics;
    this.events = events;

    // Update scales
    this.xScale.domain(d3.extent(events, d => d.timestamp) as [Date, Date]);
    this.yScale.domain([0, 100]);

    // Update lines
    const lineGenerator = d3.line<TimelineEvent>()
      .x(d => this.xScale(d.timestamp))
      .y(d => this.yScale(d.value));

    this.cpuLine
      .datum(events.filter(e => e.type === 'cpu'))
      .attr('d', lineGenerator);

    this.memoryLine
      .datum(events.filter(e => e.type === 'memory'))
      .attr('d', lineGenerator);

    this.networkLine
      .datum(events.filter(e => e.type === 'network'))
      .attr('d', lineGenerator);

    // Update event points
    const eventPoints = this.container
      .select('.events')
      .selectAll<SVGCircleElement, TimelineEvent>('circle')
      .data(events.filter(e => e.type === 'event'));

    eventPoints.exit().remove();

    eventPoints
      .enter()
      .append('circle')
      .merge(eventPoints)
      .attr('cx', d => this.xScale(d.timestamp))
      .attr('cy', d => this.yScale(d.value))
      .attr('r', 5)
      .attr('fill', this.colors.event)
      .on('mouseover', this.handleEventMouseOver.bind(this))
      .on('mouseout', this.handleEventMouseOut.bind(this));

    // Update axes
    this.container
      .select('.x-axis')
      .call(d3.axisBottom(this.xScale));

    this.container
      .select('.y-axis')
      .call(d3.axisLeft(this.yScale));
  }

  private handleEventMouseOver(event: MouseEvent, d: TimelineEvent): void {
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background', 'white')
      .style('padding', '5px')
      .style('border', '1px solid #ccc')
      .style('border-radius', '3px')
      .style('pointer-events', 'none');

    tooltip
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`)
      .html(`
        <strong>${d.type}</strong><br/>
        Time: ${d.timestamp.toLocaleString()}<br/>
        Value: ${d.value.toFixed(2)}
      `);
  }

  private handleEventMouseOut(): void {
    d3.select('.tooltip').remove();
  }

  public destroy(): void {
    if (this.svg) {
      this.svg.remove();
    }
  }
}
