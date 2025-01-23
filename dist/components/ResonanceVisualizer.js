"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResonanceVisualizer = void 0;
const react_1 = __importStar(require("react"));
const THREE = __importStar(require("three"));
const styled_components_1 = __importDefault(require("styled-components"));
const Container = styled_components_1.default.div `
  width: 100%;
  height: 100%;
  position: relative;
`;
const ResonanceVisualizer = ({ resonanceState, width = 800, height = 600, }) => {
    const containerRef = (0, react_1.useRef)(null);
    const rendererRef = (0, react_1.useRef)();
    const sceneRef = (0, react_1.useRef)();
    const cameraRef = (0, react_1.useRef)();
    const animationFrameRef = (0, react_1.useRef)();
    (0, react_1.useEffect)(() => {
        if (!containerRef.current)
            return;
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
    (0, react_1.useEffect)(() => {
        if (!sceneRef.current || !cameraRef.current || !rendererRef.current)
            return;
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
            mesh.position.setFromSphericalCoords(2, // radius
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
            if (!sceneRef.current || !cameraRef.current || !rendererRef.current)
                return;
            vectorGroup.rotation.y += 0.005 * intensity;
            rendererRef.current.render(sceneRef.current, cameraRef.current);
            animationFrameRef.current = requestAnimationFrame(animate);
        };
        animate();
    }, [resonanceState]);
    return react_1.default.createElement(Container, { ref: containerRef });
};
exports.ResonanceVisualizer = ResonanceVisualizer;
function getVectorColor(type) {
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
//# sourceMappingURL=ResonanceVisualizer.js.map