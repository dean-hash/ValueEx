import * as THREE from 'three';

export class ResonanceField {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particles: THREE.Points;
  private animationFrameId: number;

  constructor(container: HTMLDivElement) {
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    container.appendChild(this.renderer.domElement);

    // Create particle system
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 10;
      positions[i + 1] = (Math.random() - 0.5) * 10;
      positions[i + 2] = (Math.random() - 0.5) * 10;

      colors[i] = Math.random();
      colors[i + 1] = Math.random();
      colors[i + 2] = Math.random();
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true
    });

    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(this.particles);

    // Position camera
    this.camera.position.z = 5;

    // Start animation
    this.animate();

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Rotate particle system
    this.particles.rotation.x += 0.001;
    this.particles.rotation.y += 0.002;

    // Update particles based on resonance
    const positions = (this.particles.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    const colors = (this.particles.geometry as THREE.BufferGeometry).attributes.color.array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      // Add subtle movement
      positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.001;
      positions[i + 1] += Math.cos(Date.now() * 0.001 + i) * 0.001;
      
      // Pulse colors
      const time = Date.now() * 0.001;
      colors[i] = Math.sin(time + i) * 0.5 + 0.5;
      colors[i + 1] = Math.cos(time + i) * 0.5 + 0.5;
      colors[i + 2] = Math.sin(time * 0.5 + i) * 0.5 + 0.5;
    }

    (this.particles.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
    (this.particles.geometry as THREE.BufferGeometry).attributes.color.needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
  };

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    
    // Dispose of Three.js resources
    this.particles.geometry.dispose();
    (this.particles.material as THREE.Material).dispose();
    this.renderer.dispose();
  }
}
