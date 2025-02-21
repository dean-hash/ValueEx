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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextManager = void 0;
const events_1 = require("events");
const chokidar = __importStar(require("chokidar"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const lodash_1 = require("lodash");
const dependencyGraph_1 = require("../utils/dependencyGraph");
class ContextManager extends events_1.EventEmitter {
    constructor(projectRoot) {
        super();
        this.name = 'context_manager';
        this.type = 'context';
        this.confidence = 1.0;
        this.components = new Map();
        this.healthStatus = new Map();
        this.projectRoot = projectRoot;
        this.dependencyGraph = new dependencyGraph_1.DependencyGraph();
        this.context = {
            components: new Map(),
            relationships: new dependencyGraph_1.DependencyGraph(),
            recentChanges: [],
            health: {
                lastCheck: Date.now(),
                status: 'healthy',
                metrics: {
                    componentCount: 0,
                    errorCount: 0,
                    warningCount: 0,
                    avgDependencyDepth: 0,
                },
            },
        };
        this.watcher = chokidar.watch('**/*.{ts,js}', {
            ignored: /(^|[\/\\])\../,
            persistent: true,
        });
        this.initialize();
    }
    async initialize() {
        try {
            // Scan project structure
            await this.scanProject();
            // Setup file watching
            this.setupFileWatcher();
            // Analyze component relationships
            await this.analyzeRelationships();
            // Start health monitoring
            this.startHealthMonitoring();
            // Initial health check
            await this.performHealthCheck();
        }
        catch (error) {
            this.emit('error', error);
            this.updateSystemHealth('error', ['Initialization failed']);
        }
    }
    async scanProject() {
        try {
            const files = await this.findTypeScriptFiles(this.projectRoot);
            for (const file of files) {
                const component = await this.analyzeComponent(file);
                if (component) {
                    this.context.components.set(file, component);
                    this.context.relationships.addNode(file);
                }
            }
            this.updateSystemMetrics();
        }
        catch (error) {
            this.emit('error', error);
            this.updateSystemHealth('error', ['Project scan failed']);
        }
    }
    async findTypeScriptFiles(dir) {
        const files = [];
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                files.push(...(await this.findTypeScriptFiles(fullPath)));
            }
            else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
                files.push(fullPath);
            }
        }
        return files;
    }
    async analyzeComponent(filePath) {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const stats = await fs.promises.stat(filePath);
            const metadata = await this.extractMetadata(content);
            const type = this.determineComponentType(filePath);
            const purpose = this.inferComponentPurpose(content, metadata);
            return {
                id: filePath,
                name: path.basename(filePath),
                type,
                features: [],
                metadata: {
                    id: filePath,
                    name: path.basename(filePath),
                    path: filePath,
                    type,
                    dependencies: [],
                    exports: [],
                    lastModified: stats.mtimeMs,
                    functions: [],
                },
            };
        }
        catch (error) {
            this.emit('error', `Failed to analyze component ${filePath}:`, error);
            return null;
        }
    }
    setupFileWatcher() {
        const watchPaths = Array.from(this.context.components.keys());
        this.watcher
            .add(watchPaths)
            .on('change', (0, lodash_1.debounce)(this.handleFileChange.bind(this), 1000))
            .on('unlink', this.handleFileDelete.bind(this))
            .on('error', (error) => {
            this.emit('error', 'File watcher error:', error);
            this.updateSystemHealth('warning', ['File watching system encountered an error']);
        });
    }
    async handleFileChange(filePath) {
        try {
            const component = await this.analyzeComponent(filePath);
            if (!component)
                return;
            const oldComponent = this.context.components.get(filePath);
            this.context.components.set(filePath, component);
            const impact = await this.analyzeChangeImpact(filePath, oldComponent, component);
            this.context.recentChanges.unshift({
                component: filePath,
                timestamp: Date.now(),
                change: 'modified',
                impact,
            });
            this.context.recentChanges = this.context.recentChanges.slice(0, 50);
            this.emit('componentChanged', { component, impact });
            await this.updateRelationships();
        }
        catch (error) {
            this.emit('error', `Failed to handle file change for ${filePath}:`, error);
        }
    }
    handleFileDelete(filePath) {
        this.context.components.delete(filePath);
        this.context.relationships.removeNode(filePath);
        this.updateSystemMetrics();
        this.emit('componentDeleted', filePath);
    }
    async analyzeRelationships() {
        for (const [filePath, component] of this.context.components) {
            const dependencies = component.metadata.dependencies;
            dependencies.forEach((dep) => {
                const resolvedPath = this.resolveDependencyPath(filePath, dep);
                if (resolvedPath) {
                    this.context.relationships.addEdge(filePath, resolvedPath);
                }
            });
        }
        await this.validateRelationships();
    }
    async validateRelationships() {
        const cycles = this.context.relationships.findCycles();
        if (cycles.length > 0) {
            this.updateSystemHealth('warning', [
                `Circular dependencies detected: ${cycles.map((c) => c.join(' -> ')).join(', ')}`,
            ]);
        }
    }
    async analyzeChangeImpact(filePath, oldComponent, newComponent) {
        const directDependents = this.context.relationships.getDirectDependents(filePath);
        const allDependents = this.context.relationships.getAllDependents(filePath);
        const impact = {
            direct: directDependents,
            indirect: allDependents.filter((d) => !directDependents.includes(d)),
        };
        // Check for breaking changes
        if (oldComponent) {
            const breakingChanges = await this.checkFunctionChanges(oldComponent.metadata, newComponent.metadata);
            if (breakingChanges) {
                this.updateSystemHealth('warning', [
                    `Breaking changes detected in ${filePath}: ${breakingChanges}`,
                ]);
            }
        }
        return impact;
    }
    async checkFunctionChanges(oldMetadata, newMetadata) {
        let hasChanges = false;
        // Check for removed functions
        oldMetadata.functions.forEach((oldFn) => {
            if (!newMetadata.functions.find((fn) => fn.name === oldFn.name)) {
                hasChanges = true;
                this.emit('breaking-change', {
                    type: 'function-removed',
                    details: `Function ${oldFn.name} was removed`,
                });
            }
        });
        // Check for modified functions
        newMetadata.functions.forEach((f) => {
            const oldFn = oldMetadata.functions.find((fn) => fn.name === f.name);
            if (oldFn) {
                if (oldFn.params.length !== f.params.length || oldFn.returnType !== f.returnType) {
                    hasChanges = true;
                    this.emit('breaking-change', {
                        type: 'function-modified',
                        details: `Function ${f.name} signature changed`,
                    });
                }
            }
        });
        return hasChanges ? 'Function changes detected' : null;
    }
    startHealthMonitoring() {
        setInterval(async () => {
            await this.performHealthCheck();
        }, 5 * 60 * 1000); // 5 minutes
    }
    async performHealthCheck() {
        try {
            const componentChecks = await Promise.all(Array.from(this.context.components.entries()).map(async ([path, component]) => {
                const health = await this.checkComponentHealth(component);
                this.healthStatus.set(path, health);
                return health;
            }));
            const errorCount = componentChecks.filter((h) => h.status === 'error').length;
            const warningCount = componentChecks.filter((h) => h.status === 'warning').length;
            this.context.health = {
                lastCheck: Date.now(),
                status: errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'healthy',
                metrics: {
                    ...this.context.health.metrics,
                    errorCount,
                    warningCount,
                },
            };
            this.emit('healthCheckComplete', this.context.health);
        }
        catch (error) {
            this.emit('error', 'Health check failed:', error);
        }
    }
    async checkComponentHealth(component) {
        const issues = [];
        let status = 'healthy';
        // Check file existence
        try {
            await fs.promises.access(component.metadata.path);
        }
        catch {
            issues.push('File not found');
            status = 'error';
        }
        // Check dependencies
        const missingDeps = await this.checkMissingDependencies(component);
        if (missingDeps.length > 0) {
            issues.push(`Missing dependencies: ${missingDeps.join(', ')}`);
            status = 'error';
        }
        // Check for outdated dependencies
        const outdatedDeps = await this.checkOutdatedDependencies(component);
        if (outdatedDeps.length > 0) {
            issues.push(`Outdated dependencies: ${outdatedDeps.join(', ')}`);
            status = 'warning';
        }
        return {
            lastCheck: Date.now(),
            status,
            issues,
        };
    }
    async checkMissingDependencies(component) {
        const missing = [];
        for (const dep of component.metadata.dependencies) {
            try {
                require.resolve(dep, { paths: [this.projectRoot] });
            }
            catch {
                missing.push(dep);
            }
        }
        return missing;
    }
    async checkOutdatedDependencies(component) {
        // In a real implementation, this would check package.json and npm for updates
        return [];
    }
    updateSystemHealth(status, issues) {
        this.context.health.status = status;
        this.emit('healthUpdate', { status, issues });
    }
    updateSystemMetrics() {
        const componentCount = this.context.components.size;
        const avgDependencyDepth = this.context.relationships.calculateAverageDependencyDepth();
        this.context.health.metrics = {
            ...this.context.health.metrics,
            componentCount,
            avgDependencyDepth,
        };
    }
    async extractMetadata(content) {
        // In a real implementation, this would use TypeScript Compiler API
        // to extract detailed metadata. This is a simplified version.
        return {
            id: '',
            name: '',
            path: '',
            type: '',
            dependencies: [],
            exports: [],
            lastModified: 0,
            functions: [],
        };
    }
    determineComponentType(filePath) {
        if (filePath.includes('/providers/'))
            return 'provider';
        if (filePath.includes('/adapters/'))
            return 'adapter';
        if (filePath.includes('/services/'))
            return 'service';
        if (filePath.includes('/visualization/'))
            return 'visualization';
        return 'service';
    }
    inferComponentPurpose(content, metadata) {
        // In a real implementation, this would use NLP to analyze
        // comments and code structure. This is a simplified version.
        return 'Component purpose not yet analyzed';
    }
    resolveDependencyPath(fromPath, importPath) {
        try {
            if (importPath.startsWith('.')) {
                return path.resolve(path.dirname(fromPath), importPath);
            }
            return null;
        }
        catch {
            return null;
        }
    }
    async updateRelationships() {
        await this.analyzeRelationships();
        this.updateSystemMetrics();
        this.emit('relationshipsUpdated', this.context.relationships);
    }
    // Public API methods
    getComponentContext(componentPath) {
        return this.context.components.get(componentPath);
    }
    getSystemHealth() {
        return this.context.health;
    }
    getDependents(componentPath) {
        return {
            direct: this.context.relationships.getDirectDependents(componentPath),
            all: this.context.relationships.getAllDependents(componentPath),
        };
    }
    getRecentChanges(limit = 10) {
        return this.context.recentChanges.slice(0, limit);
    }
    async processSignal(signal) {
        // Enrich the signal with context from our component analysis
        const enrichedSignal = { ...signal };
        if (signal.context && signal.requirements?.features) {
            const relatedComponents = this.findRelatedComponents(signal.requirements.features);
            enrichedSignal.context = {
                ...enrichedSignal.context,
                matches: relatedComponents.map((comp) => ({
                    id: comp.id,
                    name: comp.name,
                    quality: this.calculateMatchConfidence(comp, signal.requirements?.features || []),
                    features: comp.features,
                    opportunities: [],
                    recommendations: [],
                })),
            };
        }
        return enrichedSignal;
    }
    async validateAlignment() {
        // Check if all tracked components are healthy and dependencies are valid
        let isValid = true;
        for (const [id, health] of this.healthStatus) {
            if (health.status === 'error') {
                isValid = false;
                break;
            }
            // Validate dependencies
            const deps = this.dependencyGraph.getDependencies(id);
            for (const dep of deps) {
                const depHealth = this.healthStatus.get(dep)?.status;
                if (depHealth === 'error' || depHealth === undefined) {
                    isValid = false;
                    break;
                }
            }
        }
        return isValid;
    }
    findRelatedComponents(features) {
        // In a real implementation, this would use the component metadata
        // to find related components based on the given features.
        // This is a simplified version.
        return Array.from(this.context.components.values());
    }
    calculateMatchConfidence(component, features) {
        // In a real implementation, this would use a more sophisticated
        // algorithm to calculate the confidence based on the component
        // metadata and the given features. This is a simplified version.
        return 1.0;
    }
}
exports.ContextManager = ContextManager;
//# sourceMappingURL=contextManager.js.map