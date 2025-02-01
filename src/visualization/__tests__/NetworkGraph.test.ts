import { NetworkGraph } from '../NetworkGraph';
import { NetworkNode, NetworkEdge } from '../../types';

describe('NetworkGraph', () => {
  let networkGraph: NetworkGraph;
  let container: HTMLElement;
  const containerId = 'test-container';

  beforeEach(() => {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
    networkGraph = new NetworkGraph(containerId);
  });

  afterEach(() => {
    networkGraph.destroy();
    document.body.removeChild(container);
  });

  it('should initialize with empty nodes and edges', () => {
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(container.querySelector('.nodes')?.children.length).toBe(0);
    expect(container.querySelector('.edges')?.children.length).toBe(0);
  });

  it('should add nodes and edges', () => {
    const node1: NetworkNode = {
      id: 'test1',
      label: 'Test Node 1',
      size: 10,
      color: '#000000'
    };

    const node2: NetworkNode = {
      id: 'test2',
      label: 'Test Node 2',
      size: 10,
      color: '#000000'
    };

    const edge: NetworkEdge = {
      from: 'test1',
      to: 'test2',
      width: 1,
      color: '#000000'
    };

    networkGraph.addNode(node1);
    networkGraph.addNode(node2);
    networkGraph.addEdge(edge);

    const nodes = container.querySelectorAll('.node');
    const edges = container.querySelectorAll('.edge');

    expect(nodes.length).toBe(2);
    expect(edges.length).toBe(1);

    // Verify node attributes
    nodes.forEach(node => {
      const circle = node.querySelector('circle');
      const text = node.querySelector('text');
      expect(circle).toBeTruthy();
      expect(text).toBeTruthy();
      expect(node.getAttribute('data-id')).toMatch(/^test[12]$/);
    });

    // Verify edge attributes
    const edgeElement = edges[0];
    expect(edgeElement.getAttribute('data-from')).toBe('test1');
    expect(edgeElement.getAttribute('data-to')).toBe('test2');
  });

  it('should update data with multiple nodes and edges', () => {
    const nodes: NetworkNode[] = [
      {
        id: 'test1',
        label: 'Test Node 1',
        size: 10,
        color: '#000000'
      },
      {
        id: 'test2',
        label: 'Test Node 2',
        size: 10,
        color: '#000000'
      }
    ];

    const edges: NetworkEdge[] = [
      {
        from: 'test1',
        to: 'test2',
        width: 1,
        color: '#000000'
      }
    ];

    networkGraph.updateData(nodes, edges);

    const nodeElements = container.querySelectorAll('.node');
    const edgeElements = container.querySelectorAll('.edge');

    expect(nodeElements.length).toBe(2);
    expect(edgeElements.length).toBe(1);
  });

  it('should handle click events', () => {
    const node: NetworkNode = {
      id: 'test1',
      label: 'Test Node 1',
      size: 10,
      color: '#000000'
    };

    const mockNodeHandler = jest.fn();
    networkGraph.onNodeClick(mockNodeHandler);
    networkGraph.addNode(node);

    const nodeElement = container.querySelector('.node');
    nodeElement?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(mockNodeHandler).toHaveBeenCalledWith(expect.objectContaining({
      id: 'test1',
      label: 'Test Node 1'
    }));
  });

  it('should clean up on destroy', () => {
    const node: NetworkNode = {
      id: 'test1',
      label: 'Test Node 1',
      size: 10,
      color: '#000000'
    };

    networkGraph.addNode(node);
    expect(container.innerHTML).not.toBe('');

    networkGraph.destroy();
    expect(container.innerHTML).toBe('');
  });
});
