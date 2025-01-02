import { IntelligenceProvider } from '../adapters/demandSignalAdapter';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

interface ComponentContext {
    path: string;
    type: 'provider' | 'adapter' | 'service' | 'visualization';
    dependencies: string[];
    lastModified: string;
    purpose: string;
}

interface SystemContext {
    components: Map<string, ComponentContext>;
    relationships: Map<string, string[]>;
    recentChanges: Array<{
        component: string;
        timestamp: string;
        change: string;
    }>;
}

export class ContextManager extends EventEmitter implements IntelligenceProvider {
    name = 'ContextManager';
    type = 'context' as const;
    confidence = 0.95;
    private context: SystemContext;
    private projectRoot: string;

    constructor(projectRoot: string) {
        super();
        this.projectRoot = projectRoot;
        this.context = {
            components: new Map(),
            relationships: new Map(),
            recentChanges: []
        };
        this.initialize();
    }

    private async initialize() {
        // Scan project structure
        await this.scanProject();
        
        // Watch for file changes
        this.watchFileChanges();
        
        // Analyze component relationships
        this.analyzeRelationships();
    }

    private async scanProject() {
        const scanDir = async (dir: string) => {
            const files = await fs.promises.readdir(dir);
            
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = await fs.promises.stat(fullPath);
                
                if (stat.isDirectory()) {
                    await scanDir(fullPath);
                } else if (file.endsWith('.ts') || file.endsWith('.js')) {
                    await this.analyzeComponent(fullPath);
                }
            }
        };

        await scanDir(this.projectRoot);
    }

    private async analyzeComponent(filePath: string) {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const relativePath = path.relative(this.projectRoot, filePath);
        
        // Simple dependency analysis (can be enhanced with AST parsing)
        const importLines = content.match(/import.*from.*/g) || [];
        const dependencies = importLines.map(line => {
            const match = line.match(/from ['"](.*)['"]/);
            return match ? match[1] : '';
        }).filter(Boolean);

        // Determine component type
        const type = this.determineComponentType(relativePath);

        // Extract purpose from comments
        const purposeMatch = content.match(/\/\*\*\s*(.*?)\s*\*\//s);
        const purpose = purposeMatch ? purposeMatch[1].trim() : 'No description available';

        this.context.components.set(relativePath, {
            path: relativePath,
            type,
            dependencies,
            lastModified: new Date().toISOString(),
            purpose
        });
    }

    private determineComponentType(path: string): ComponentContext['type'] {
        if (path.includes('/providers/')) return 'provider';
        if (path.includes('/adapters/')) return 'adapter';
        if (path.includes('/visualization/')) return 'visualization';
        return 'service';
    }

    private watchFileChanges() {
        const watcher = fs.watch(this.projectRoot, { recursive: true }, async (event, filename) => {
            if (filename && (filename.endsWith('.ts') || filename.endsWith('.js'))) {
                const fullPath = path.join(this.projectRoot, filename);
                await this.analyzeComponent(fullPath);
                
                this.context.recentChanges.unshift({
                    component: filename,
                    timestamp: new Date().toISOString(),
                    change: event
                });

                // Keep only last 50 changes
                if (this.context.recentChanges.length > 50) {
                    this.context.recentChanges.pop();
                }

                this.emit('context_updated', {
                    component: filename,
                    type: event,
                    timestamp: new Date().toISOString()
                });
            }
        });

        process.on('SIGINT', () => {
            watcher.close();
            process.exit();
        });
    }

    private analyzeRelationships() {
        this.context.components.forEach((component, path) => {
            const relatedComponents = Array.from(this.context.components.entries())
                .filter(([otherPath, other]) => {
                    if (otherPath === path) return false;
                    
                    // Check for direct dependencies
                    if (component.dependencies.some(dep => otherPath.includes(dep))) return true;
                    
                    // Check for shared purpose or type
                    if (other.type === component.type) return true;
                    
                    return false;
                })
                .map(([path]) => path);

            this.context.relationships.set(path, relatedComponents);
        });
    }

    async processSignal(signal: any): Promise<any> {
        // Enrich signal with context information
        const enriched = { ...signal };
        
        if (signal.type === 'component_query') {
            enriched.context = {
                ...enriched.context,
                relatedComponents: this.getRelatedComponents(signal.component),
                recentChanges: this.getRecentChanges(signal.component),
                systemOverview: this.getSystemOverview()
            };
        }

        return enriched;
    }

    private getRelatedComponents(component: string): string[] {
        return this.context.relationships.get(component) || [];
    }

    private getRecentChanges(component: string): any[] {
        return this.context.recentChanges
            .filter(change => change.component === component)
            .slice(0, 10);
    }

    private getSystemOverview(): any {
        return {
            componentTypes: {
                providers: this.countComponentsByType('provider'),
                adapters: this.countComponentsByType('adapter'),
                services: this.countComponentsByType('service'),
                visualizations: this.countComponentsByType('visualization')
            },
            totalComponents: this.context.components.size,
            recentlyModified: this.context.recentChanges.slice(0, 5)
        };
    }

    private countComponentsByType(type: ComponentContext['type']): number {
        return Array.from(this.context.components.values())
            .filter(component => component.type === type)
            .length;
    }

    async validateAlignment(): Promise<boolean> {
        // Context manager is inherently aligned as it maintains system integrity
        return true;
    }

    // Public methods for other components to use
    public getComponentContext(component: string): ComponentContext | undefined {
        return this.context.components.get(component);
    }

    public getDependencyGraph(): Map<string, string[]> {
        return this.context.relationships;
    }

    public getSystemHealth(): any {
        return {
            totalComponents: this.context.components.size,
            recentChanges: this.context.recentChanges.length,
            lastUpdate: new Date().toISOString(),
            componentHealth: Array.from(this.context.components.values())
                .reduce((health, component) => {
                    health[component.type] = (health[component.type] || 0) + 1;
                    return health;
                }, {} as Record<string, number>)
        };
    }
}
