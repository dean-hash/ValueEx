import { EventEmitter } from 'events';
import * as chokidar from 'chokidar';
import { FSWatcher } from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';
import { debounce } from 'lodash';
import { DependencyGraph } from '../utils/dependencyGraph';
import type {
  DemandSignal,
  IntelligenceProvider,
  DemandContext,
  DemandRequirements,
} from '../types';

interface ComponentMetadata {
  id: string;
  name: string;
  path: string;
  type: string;
  dependencies: string[];
  exports: string[];
  lastModified: number;
  functions: Array<{
    name: string;
    params: string[];
    returnType: string;
  }>;
}

interface ComponentHealth {
  status: 'healthy' | 'warning' | 'error';
  lastCheck: number;
  issues?: string[];
}

interface ComponentContext {
  id: string;
  name: string;
  type: string;
  features: string[];
  metadata: ComponentMetadata;
}

interface SystemContext {
  components: Map<string, ComponentContext>;
  relationships: DependencyGraph;
  recentChanges: Array<{
    component: string;
    timestamp: number;
    change: string;
    impact: {
      direct: string[];
      indirect: string[];
    };
  }>;
  health: {
    lastCheck: number;
    status: 'healthy' | 'warning' | 'error';
    metrics: {
      componentCount: number;
      errorCount: number;
      warningCount: number;
      avgDependencyDepth: number;
    };
  };
}

export class ContextManager extends EventEmitter implements IntelligenceProvider {
  name = 'context_manager';
  type = 'context' as const;
  confidence = 1.0;

  private readonly watcher: FSWatcher;
  private readonly components: Map<string, ComponentMetadata> = new Map();
  private readonly dependencyGraph: DependencyGraph;
  private readonly healthStatus: Map<string, ComponentHealth> = new Map();
  private projectRoot: string;
  private context: SystemContext;

  constructor(projectRoot: string) {
    super();
    this.projectRoot = projectRoot;
    this.dependencyGraph = new DependencyGraph();
    this.context = {
      components: new Map(),
      relationships: new DependencyGraph(),
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

  private async initialize() {
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
    } catch (error) {
      this.emit('error', error);
      this.updateSystemHealth('error', ['Initialization failed']);
    }
  }

  private async scanProject() {
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
    } catch (error) {
      this.emit('error', error);
      this.updateSystemHealth('error', ['Project scan failed']);
    }
  }

  private async findTypeScriptFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...(await this.findTypeScriptFiles(fullPath)));
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private async analyzeComponent(filePath: string): Promise<ComponentContext | null> {
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
    } catch (error) {
      this.emit('error', `Failed to analyze component ${filePath}:`, error);
      return null;
    }
  }

  private setupFileWatcher() {
    const watchPaths = Array.from(this.context.components.keys());

    this.watcher
      .add(watchPaths)
      .on('change', debounce(this.handleFileChange.bind(this), 1000))
      .on('unlink', this.handleFileDelete.bind(this))
      .on('error', (error) => {
        this.emit('error', 'File watcher error:', error);
        this.updateSystemHealth('warning', ['File watching system encountered an error']);
      });
  }

  private async handleFileChange(filePath: string) {
    try {
      const component = await this.analyzeComponent(filePath);
      if (!component) return;

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
    } catch (error) {
      this.emit('error', `Failed to handle file change for ${filePath}:`, error);
    }
  }

  private handleFileDelete(filePath: string) {
    this.context.components.delete(filePath);
    this.context.relationships.removeNode(filePath);
    this.updateSystemMetrics();
    this.emit('componentDeleted', filePath);
  }

  private async analyzeRelationships() {
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

  private async validateRelationships() {
    const cycles = this.context.relationships.findCycles();
    if (cycles.length > 0) {
      this.updateSystemHealth('warning', [
        `Circular dependencies detected: ${cycles.map((c) => c.join(' -> ')).join(', ')}`,
      ]);
    }
  }

  private async analyzeChangeImpact(
    filePath: string,
    oldComponent: ComponentContext | undefined,
    newComponent: ComponentContext
  ) {
    const directDependents = this.context.relationships.getDirectDependents(filePath);
    const allDependents = this.context.relationships.getAllDependents(filePath);

    const impact = {
      direct: Array.from(directDependents),
      indirect: Array.from(allDependents).filter((d) => !Array.from(directDependents).includes(d)),
    };

    // Check for breaking changes
    if (oldComponent) {
      const breakingChanges = await this.checkFunctionChanges(
        oldComponent.metadata,
        newComponent.metadata
      );
      if (breakingChanges) {
        this.updateSystemHealth('warning', [
          `Breaking changes detected in ${filePath}: ${breakingChanges}`,
        ]);
      }
    }

    return impact;
  }

  private async checkFunctionChanges(
    oldMetadata: ComponentMetadata,
    newMetadata: ComponentMetadata
  ): Promise<string | null> {
    let hasChanges = false;

    // Check for removed functions
    oldMetadata.functions.forEach(
      (oldFn: { name: string; params: string[]; returnType: string }) => {
        if (!newMetadata.functions.find((fn: { name: string }) => fn.name === oldFn.name)) {
          hasChanges = true;
          this.emit('breaking-change', {
            type: 'function-removed',
            details: `Function ${oldFn.name} was removed`,
          });
        }
      }
    );

    // Check for modified functions
    newMetadata.functions.forEach((f: { name: string; params: string[]; returnType: string }) => {
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

  private startHealthMonitoring() {
    setInterval(
      async () => {
        await this.performHealthCheck();
      },
      5 * 60 * 1000
    ); // 5 minutes
  }

  private async performHealthCheck() {
    try {
      const componentChecks = await Promise.all(
        Array.from(this.context.components.entries()).map(async ([path, component]) => {
          const health = await this.checkComponentHealth(component);
          this.healthStatus.set(path, health);
          return health;
        })
      );

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
    } catch (error) {
      this.emit('error', 'Health check failed:', error);
    }
  }

  private async checkComponentHealth(component: ComponentContext) {
    const issues: string[] = [];
    let status: ComponentHealth['status'] = 'healthy';

    // Check file existence
    try {
      await fs.promises.access(component.metadata.path);
    } catch {
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

  private async checkMissingDependencies(component: ComponentContext): Promise<string[]> {
    const missing: string[] = [];

    for (const dep of component.metadata.dependencies) {
      try {
        require.resolve(dep, { paths: [this.projectRoot] });
      } catch {
        missing.push(dep);
      }
    }

    return missing;
  }

  private async checkOutdatedDependencies(component: ComponentContext): Promise<string[]> {
    // In a real implementation, this would check package.json and npm for updates
    return [];
  }

  private updateSystemHealth(status: SystemContext['health']['status'], issues: string[]) {
    this.context.health.status = status;
    this.emit('healthUpdate', { status, issues });
  }

  private updateSystemMetrics() {
    const componentCount = this.context.components.size;
    const avgDependencyDepth = this.context.relationships.calculateAverageDependencyDepth();

    this.context.health.metrics = {
      ...this.context.health.metrics,
      componentCount,
      avgDependencyDepth,
    };
  }

  private async extractMetadata(content: string): Promise<ComponentMetadata> {
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

  private determineComponentType(filePath: string): string {
    if (filePath.includes('/providers/')) return 'provider';
    if (filePath.includes('/adapters/')) return 'adapter';
    if (filePath.includes('/services/')) return 'service';
    if (filePath.includes('/visualization/')) return 'visualization';
    return 'service';
  }

  private inferComponentPurpose(content: string, metadata: ComponentMetadata): string {
    // In a real implementation, this would use NLP to analyze
    // comments and code structure. This is a simplified version.
    return 'Component purpose not yet analyzed';
  }

  private resolveDependencyPath(fromPath: string, importPath: string): string | null {
    try {
      if (importPath.startsWith('.')) {
        return path.resolve(path.dirname(fromPath), importPath);
      }
      return null;
    } catch {
      return null;
    }
  }

  private async updateRelationships() {
    await this.analyzeRelationships();
    this.updateSystemMetrics();
    this.emit('relationshipsUpdated', this.context.relationships);
  }

  // Public API methods
  public getComponentContext(componentPath: string): ComponentContext | undefined {
    return this.context.components.get(componentPath);
  }

  public getSystemHealth(): SystemContext['health'] {
    return this.context.health;
  }

  public getDependents(componentPath: string) {
    return {
      direct: this.context.relationships.getDirectDependents(componentPath),
      all: this.context.relationships.getAllDependents(componentPath),
    };
  }

  public getRecentChanges(limit = 10) {
    return this.context.recentChanges.slice(0, limit);
  }

  async processSignal(signal: DemandSignal): Promise<DemandSignal> {
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

  async validateAlignment(): Promise<boolean> {
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

  private findRelatedComponents(features: string[]): ComponentContext[] {
    // In a real implementation, this would use the component metadata
    // to find related components based on the given features.
    // This is a simplified version.
    return Array.from(this.context.components.values());
  }

  private calculateMatchConfidence(component: ComponentContext, features: string[]): number {
    // In a real implementation, this would use a more sophisticated
    // algorithm to calculate the confidence based on the component
    // metadata and the given features. This is a simplified version.
    return 1.0;
  }
}
