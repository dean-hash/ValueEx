import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styled from 'styled-components';
import { ResonanceState } from '../services/analysis/types';

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

interface Props {
  resonanceState: ResonanceState;
  width?: number;
  height?: number;
}

export const ResonanceVisualizer: React.FC<Props> = ({
  resonanceState,
  width = 800,
  height = 600,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);

    camera.position.z = 5;

    // Store refs
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (containerRef.current?.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
    };
  }, [width, height]);

  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    // Clear existing objects
    while (sceneRef.current.children.length > 0) {
      sceneRef.current.remove(sceneRef.current.children[0]);
    }

    // Create visualization based on resonance state
    const { vectors, coherence, intensity } = resonanceState;

    // Create a group for all vectors
    const vectorGroup = new THREE.Group();

    vectors.forEach((vector, index) => {
      const geometry = new THREE.CylinderGeometry(0.1, 0.1, vector.magnitude, 32);
      const material = new THREE.MeshPhongMaterial({
        color: getVectorColor(vector.type),
        opacity: vector.strength,
        transparent: true,
      });
      const mesh = new THREE.Mesh(geometry, material);

      // Position and rotate vector
      mesh.position.setFromSphericalCoords(
        2, // radius
        (Math.PI * index) / vectors.length, // phi
        (2 * Math.PI * index) / vectors.length // theta
      );
      mesh.lookAt(0, 0, 0);

      vectorGroup.add(mesh);
    });

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.current.add(ambientLight);

    // Add point light
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    sceneRef.current.add(pointLight);

    // Add vector group to scene
    sceneRef.current.add(vectorGroup);

    // Animation
    const animate = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

      vectorGroup.rotation.y += 0.005 * intensity;
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, [resonanceState]);

  return <Container ref={containerRef} />;
};

function getVectorColor(type: string): number {
  switch (type) {
    case 'demand':
      return 0x1f77b4;
    case 'supply':
      return 0x2ca02c;
    case 'market':
      return 0xff7f0e;
    default:
      return 0x999999;
  }
}
