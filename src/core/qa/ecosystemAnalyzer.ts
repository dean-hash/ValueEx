import { EventEmitter } from 'events';
import type { ResonanceField } from '../../types/resonanceField';
import { promises as fs } from 'fs';
import path from 'path';
import * as ts from 'typescript';

interface ComponentDependency {
  source: string;
  target: string;
  type: 'import' | 'usage' | 'event' | 'data';
  weight: number;
}

interface ComponentHealth {
  name: string;
  complexity: number;
  cohesion: number;
  coupling: number;
  resonanceScore: number;
  predictedIssues: PredictedIssue[];
}

interface PredictedIssue {
  component: string;
  type: string;
  probability: number;
  impact: number;
  suggestedAction: string;
  timeframe: string;
}

export class EcosystemAnalyzer extends EventEmitter {
  private static instance: EcosystemAnalyzer;
  private resonanceField: ResonanceField;
  private dependencies: ComponentDependency[] = [];
  private componentHealth: Map<string, ComponentHealth> = new Map();
  private analyzing: boolean = false;

  private constructor() {
    super();
    this.resonanceField = ResonanceField.getInstance();
    this.initializeAnalysis();
  }

  public static getInstance(): EcosystemAnalyzer {
    if (!EcosystemAnalyzer.instance) {
      EcosystemAnalyzer.instance = new EcosystemAnalyzer();
    }
    return EcosystemAnalyzer.instance;
  }

  private async initializeAnalysis() {
    // Monitor resonance field for ecosystem patterns
    this.resonanceField.on('pattern', async (pattern) => {
      if (pattern.type === 'ecosystem') {
        await this.analyzePattern(pattern);
      }
    });

    // Start continuous analysis
    setInterval(() => {
      this.runContinuousAnalysis();
    }, 300000); // Every 5 minutes
  }

  private async analyzePattern(pattern: any) {
    const affectedComponents = this.findAffectedComponents(pattern);

    for (const component of affectedComponents) {
      const health = await this.analyzeComponentHealth(component);
      this.componentHealth.set(component, health);

      if (health.predictedIssues.length > 0) {
        this.emit('predicted-issues', {
          component,
          issues: health.predictedIssues,
        });
      }
    }
  }

  private findAffectedComponents(pattern: any): string[] {
    return this.dependencies
      .filter((dep) => dep.weight > 0.7)
      .map((dep) => [dep.source, dep.target])
      .flat()
      .filter((value, index, self) => self.indexOf(value) === index);
  }

  private async analyzeComponentHealth(component: string): Promise<ComponentHealth> {
    const content = await fs.readFile(component, 'utf-8');
    const resonanceScore = await this.resonanceField.analyzeCode(content);

    const metrics = this.calculateMetrics(content);
    const predictedIssues = await this.predictIssues(component, metrics);

    return {
      name: component,
      complexity: metrics.complexity,
      cohesion: metrics.cohesion,
      coupling: metrics.coupling,
      resonanceScore,
      predictedIssues,
    };
  }

  private calculateMetrics(content: string): any {
    const sourceFile = ts.createSourceFile('temp.ts', content, ts.ScriptTarget.Latest, true);

    let complexity = 0;
    let cohesion = 0;
    let coupling = 0;

    function visit(node: ts.Node) {
      // Calculate cyclomatic complexity
      if (
        ts.isIfStatement(node) ||
        ts.isWhileStatement(node) ||
        ts.isForStatement(node) ||
        ts.isForInStatement(node) ||
        ts.isForOfStatement(node) ||
        ts.isCaseClause(node)
      ) {
        complexity++;
      }

      // Calculate cohesion based on method relationships
      if (ts.isMethodDeclaration(node)) {
        const sharedFields = this.countSharedFields(node);
        cohesion += sharedFields / this.totalFields;
      }

      // Calculate coupling based on external dependencies
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        coupling++;
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return { complexity, cohesion, coupling };
  }

  private async predictIssues(component: string, metrics: any): Promise<PredictedIssue[]> {
    const issues: PredictedIssue[] = [];

    // Complexity-based predictions
    if (metrics.complexity > 20) {
      issues.push({
        component,
        type: 'high_complexity',
        probability: 0.8,
        impact: 0.7,
        suggestedAction:
          'Consider breaking down the component into smaller, more manageable pieces',
        timeframe: 'Within 2 weeks',
      });
    }

    // Coupling-based predictions
    if (metrics.coupling > 10) {
      issues.push({
        component,
        type: 'high_coupling',
        probability: 0.75,
        impact: 0.8,
        suggestedAction:
          'Review and reduce external dependencies, consider using dependency injection',
        timeframe: 'Within 1 month',
      });
    }

    // Cohesion-based predictions
    if (metrics.cohesion < 0.3) {
      issues.push({
        component,
        type: 'low_cohesion',
        probability: 0.7,
        impact: 0.6,
        suggestedAction: 'Reorganize methods and properties to improve component cohesion',
        timeframe: 'Within 3 weeks',
      });
    }

    return issues;
  }

  private async runContinuousAnalysis() {
    if (this.analyzing) return;
    this.analyzing = true;

    try {
      // Analyze component interactions
      await this.analyzeComponentInteractions();

      // Update resonance field with new patterns
      await this.updateResonancePatterns();

      // Generate ecosystem health report
      const report = this.generateHealthReport();
      this.emit('ecosystem-health', report);
    } finally {
      this.analyzing = false;
    }
  }

  private async analyzeComponentInteractions() {
    // Clear existing dependencies
    this.dependencies = [];

    // Analyze import dependencies
    await this.analyzeImportDependencies();

    // Analyze event dependencies
    await this.analyzeEventDependencies();

    // Analyze data flow dependencies
    await this.analyzeDataFlowDependencies();
  }

  private async analyzeImportDependencies() {
    const files = await this.findTypeScriptFiles(process.cwd());

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isImportDeclaration(node)) {
          const importPath = (node.moduleSpecifier as ts.StringLiteral).text;
          this.dependencies.push({
            source: file,
            target: this.resolveImportPath(file, importPath),
            type: 'import',
            weight: 1,
          });
        }
      });
    }
  }

  private async analyzeEventDependencies() {
    // Analyze EventEmitter usage and event patterns
    const files = await this.findTypeScriptFiles(process.cwd());

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      if (
        content.includes('EventEmitter') ||
        content.includes('emit(') ||
        content.includes('on(')
      ) {
        const events = this.extractEventPatterns(content);
        for (const event of events) {
          this.dependencies.push({
            source: file,
            target: event.target,
            type: 'event',
            weight: 0.8,
          });
        }
      }
    }
  }

  private async analyzeDataFlowDependencies() {
    // Analyze data flow between components
    const components = Array.from(this.componentHealth.keys());

    for (const source of components) {
      for (const target of components) {
        if (source !== target) {
          const dataFlow = await this.analyzeDataFlow(source, target);
          if (dataFlow.exists) {
            this.dependencies.push({
              source,
              target,
              type: 'data',
              weight: dataFlow.weight,
            });
          }
        }
      }
    }
  }

  private async analyzeDataFlow(
    source: string,
    target: string
  ): Promise<{ exists: boolean; weight: number }> {
    // Analyze shared data structures and API calls
    const sourceContent = await fs.readFile(source, 'utf-8');
    const targetContent = await fs.readFile(target, 'utf-8');

    const sharedTypes = this.findSharedTypes(sourceContent, targetContent);
    const apiCalls = this.findApiCalls(sourceContent, targetContent);

    return {
      exists: sharedTypes.length > 0 || apiCalls.length > 0,
      weight: (sharedTypes.length * 0.3 + apiCalls.length * 0.7) / 10,
    };
  }

  private async updateResonancePatterns() {
    const patterns = this.extractPatterns();
    for (const pattern of patterns) {
      await this.resonanceField.monitorQAMetrics(
        `ecosystem_pattern_${pattern.type}`,
        pattern.strength
      );
    }
  }

  private generateHealthReport() {
    return {
      components: Array.from(this.componentHealth.values()),
      dependencies: this.dependencies,
      overallHealth: this.calculateOverallHealth(),
      recommendations: this.generateRecommendations(),
    };
  }

  private calculateOverallHealth(): number {
    const healths = Array.from(this.componentHealth.values());
    return healths.reduce((acc, health) => acc + health.resonanceScore, 0) / healths.length;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const health = Array.from(this.componentHealth.values());

    // Analyze component distribution
    if (this.dependencies.length > health.length * 2) {
      recommendations.push('Consider reducing component coupling through better abstraction');
    }

    // Analyze complexity distribution
    const complexComponents = health.filter((h) => h.complexity > 20);
    if (complexComponents.length > health.length * 0.2) {
      recommendations.push(
        'Multiple complex components detected. Consider architectural refactoring'
      );
    }

    return recommendations;
  }

  private async findTypeScriptFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    async function walk(directory: string) {
      const entries = await fs.readdir(directory, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await walk(fullPath);
        } else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    }

    await walk(dir);
    return files;
  }

  private resolveImportPath(sourceFile: string, importPath: string): string {
    if (importPath.startsWith('.')) {
      return path.resolve(path.dirname(sourceFile), importPath);
    }
    return importPath;
  }

  private extractEventPatterns(content: string): any[] {
    const events: any[] = [];
    const emitRegex = /emit\(['"]([^'"]+)['"]/g;
    const onRegex = /on\(['"]([^'"]+)['"]/g;

    let match;
    while ((match = emitRegex.exec(content)) !== null) {
      events.push({
        type: 'emit',
        name: match[1],
        target: this.findEventHandler(match[1]),
      });
    }

    return events;
  }

  private findEventHandler(eventName: string): string {
    // Implementation to find event handler file
    return 'unknown';
  }

  private findSharedTypes(source: string, target: string): string[] {
    const sourceTypes = this.extractTypes(source);
    const targetTypes = this.extractTypes(target);
    return sourceTypes.filter((type) => targetTypes.includes(type));
  }

  private extractTypes(content: string): string[] {
    const types: string[] = [];
    const typeRegex = /interface ([A-Za-z]+)|type ([A-Za-z]+)/g;

    let match;
    while ((match = typeRegex.exec(content)) !== null) {
      types.push(match[1] || match[2]);
    }

    return types;
  }

  private findApiCalls(source: string, target: string): string[] {
    const calls: string[] = [];
    const apiRegex = /await.*\.(get|post|put|delete)\(/g;

    let match;
    while ((match = apiRegex.exec(source)) !== null) {
      if (target.includes(match[0])) {
        calls.push(match[0]);
      }
    }

    return calls;
  }

  private extractPatterns(): any[] {
    const patterns: any[] = [];

    // Analyze dependency patterns
    const dependencyGroups = this.groupDependencies();
    for (const group of dependencyGroups) {
      patterns.push({
        type: 'dependency_cluster',
        components: group,
        strength: this.calculatePatternStrength(group),
      });
    }

    // Analyze event patterns
    const eventChains = this.findEventChains();
    for (const chain of eventChains) {
      patterns.push({
        type: 'event_chain',
        components: chain,
        strength: this.calculateChainStrength(chain),
      });
    }

    return patterns;
  }

  private groupDependencies(): string[][] {
    const groups: Set<string>[] = [];

    for (const dep of this.dependencies) {
      let found = false;
      for (const group of groups) {
        if (group.has(dep.source) || group.has(dep.target)) {
          group.add(dep.source);
          group.add(dep.target);
          found = true;
          break;
        }
      }

      if (!found) {
        groups.push(new Set([dep.source, dep.target]));
      }
    }

    return groups.map((group) => Array.from(group));
  }

  private findEventChains(): string[][] {
    const chains: string[][] = [];
    const eventDeps = this.dependencies.filter((dep) => dep.type === 'event');

    for (const dep of eventDeps) {
      const chain = [dep.source];
      let current = dep.target;

      while (current) {
        chain.push(current);
        const next = eventDeps.find((d) => d.source === current);
        current = next?.target;

        if (chain.includes(current)) break; // Prevent cycles
      }

      if (chain.length > 1) {
        chains.push(chain);
      }
    }

    return chains;
  }

  private calculatePatternStrength(components: string[]): number {
    const health = components
      .map((c) => this.componentHealth.get(c))
      .filter((h) => h !== undefined);

    return health.reduce((acc, h) => acc + h.resonanceScore, 0) / health.length;
  }

  private calculateChainStrength(chain: string[]): number {
    let strength = 1;
    for (let i = 0; i < chain.length - 1; i++) {
      const dep = this.dependencies.find((d) => d.source === chain[i] && d.target === chain[i + 1]);
      strength *= dep ? dep.weight : 0.5;
    }
    return strength;
  }
}
