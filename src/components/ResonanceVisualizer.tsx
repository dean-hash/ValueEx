import React, { useEffect, useRef } from 'react';
import { ResonanceField } from '../visualizers/resonanceField';
import styled from 'styled-components';

const VisualizerContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  background: radial-gradient(circle at center, #000510 0%, #000000 100%);
  opacity: 0.8;
`;

const ResonanceOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-family: 'Inter', sans-serif;
  pointer-events: none;
  
  h1 {
    font-size: 2em;
    font-weight: 300;
    letter-spacing: 0.2em;
    margin: 0;
    opacity: 0;
    animation: fadeIn 2s ease-out forwards;
  }
  
  p {
    font-size: 1.2em;
    opacity: 0;
    animation: fadeIn 2s ease-out 1s forwards;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

export const ResonanceVisualizer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const resonanceFieldRef = useRef<ResonanceField | null>(null);
  
  useEffect(() => {
    if (containerRef.current) {
      resonanceFieldRef.current = new ResonanceField(containerRef.current);
      return () => resonanceFieldRef.current?.dispose();
    }
  }, []);

  return (
    <VisualizerContainer ref={containerRef}>
      <ResonanceOverlay>
        <h1>Resonance Field</h1>
        <p>Visualizing intention and interaction</p>
      </ResonanceOverlay>
    </VisualizerContainer>
  );
};
