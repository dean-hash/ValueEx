import { useEffect, useRef } from 'react';
import { NetworkGraph } from './NetworkGraph';

export default function DemandNetwork() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const graph = new NetworkGraph(containerRef.current, {
      width: 800,
      height: 600,
      animate: true,
      theme: 'light'
    });

    // Add some sample data
    graph.addNode({
      id: 'demand1',
      label: 'Cloud Storage',
      size: 30,
      color: '#4CAF50'
    });

    graph.addNode({
      id: 'demand2',
      label: 'Data Analytics',
      size: 25,
      color: '#2196F3'
    });

    graph.addEdge({
      from: 'demand1',
      to: 'demand2',
      width: 2,
      color: '#999'
    });

    return () => {
      // Cleanup if needed
    };
  }, []);

  return <div ref={containerRef} className="network-container" />;
}
