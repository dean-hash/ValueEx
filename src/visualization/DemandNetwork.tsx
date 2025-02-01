import React, { useEffect, useRef } from 'react';
import { NetworkGraph } from './NetworkGraph';
import { DemandNode, DemandLink } from '../types';

interface DemandNetworkProps {
  nodes: DemandNode[];
  links: DemandLink[];
  onNodeClick?: (node: DemandNode) => void;
  onLinkClick?: (link: DemandLink) => void;
  width?: number;
  height?: number;
}

export const DemandNetwork: React.FC<DemandNetworkProps> = ({
  nodes,
  links,
  onNodeClick,
  onLinkClick,
  width = 800,
  height = 600
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<NetworkGraph | null>(null);

  useEffect(() => {
    if (containerRef.current && !networkRef.current) {
      networkRef.current = new NetworkGraph(containerRef.current, width, height);

      if (onNodeClick) {
        networkRef.current.onNodeClick(onNodeClick);
      }

      if (onLinkClick) {
        networkRef.current.onEdgeClick(onLinkClick);
      }
    }

    return () => {
      if (networkRef.current) {
        networkRef.current.clear();
      }
    };
  }, [width, height, onNodeClick, onLinkClick]);

  useEffect(() => {
    if (networkRef.current) {
      // Clear existing nodes and links
      networkRef.current.clear();

      // Add new nodes and links
      nodes.forEach(node => networkRef.current?.addNode(node));
      links.forEach(link => networkRef.current?.addEdge(link));
    }
  }, [nodes, links]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: width, 
        height: height, 
        border: '1px solid #ddd',
        borderRadius: '4px',
        overflow: 'hidden'
      }} 
    />
  );
};
