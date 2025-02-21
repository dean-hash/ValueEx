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
exports.EcosystemAnalyzer = void 0;
const events_1 = require("events");
const intelligenceField_1 = require("../unified/intelligenceField");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const ts = __importStar(require("typescript"));
class EcosystemAnalyzer extends events_1.EventEmitter {
    constructor() {
        super();
        this.dependencies = [];
        this.componentHealth = new Map();
        this.analyzing = false;
        this.resonanceField = intelligenceField_1.ResonanceField.getInstance();
        this.initializeAnalysis();
    }
    static getInstance() {
        if (!EcosystemAnalyzer.instance) {
            EcosystemAnalyzer.instance = new EcosystemAnalyzer();
        }
        return EcosystemAnalyzer.instance;
    }
    async initializeAnalysis() {
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
    async analyzePattern(pattern) {
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
    findAffectedComponents(pattern) {
        return this.dependencies
            .filter((dep) => dep.weight > 0.7)
            .map((dep) => [dep.source, dep.target])
            .flat()
            .filter((value, index, self) => self.indexOf(value) === index);
    }
    async analyzeComponentHealth(component) {
        const content = await fs_1.promises.readFile(component, 'utf-8');
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
    calculateMetrics(content) {
        const sourceFile = ts.createSourceFile('temp.ts', content, ts.ScriptTarget.Latest, true);
        let complexity = 0;
        let cohesion = 0;
        let coupling = 0;
        function visit(node) {
            // Calculate cyclomatic complexity
            if (ts.isIfStatement(node) ||
                ts.isWhileStatement(node) ||
                ts.isForStatement(node) ||
                ts.isForInStatement(node) ||
                ts.isForOfStatement(node) ||
                ts.isCaseClause(node)) {
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
    async predictIssues(component, metrics) {
        const issues = [];
        // Complexity-based predictions
        if (metrics.complexity > 20) {
            issues.push({
                component,
                type: 'high_complexity',
                probability: 0.8,
                impact: 0.7,
                suggestedAction: 'Consider breaking down the component into smaller, more manageable pieces',
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
                suggestedAction: 'Review and reduce external dependencies, consider using dependency injection',
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
    async runContinuousAnalysis() {
        if (this.analyzing)
            return;
        this.analyzing = true;
        try {
            // Analyze component interactions
            await this.analyzeComponentInteractions();
            // Update resonance field with new patterns
            await this.updateResonancePatterns();
            // Generate ecosystem health report
            const report = this.generateHealthReport();
            this.emit('ecosystem-health', report);
        }
        finally {
            this.analyzing = false;
        }
    }
    async analyzeComponentInteractions() {
        // Clear existing dependencies
        this.dependencies = [];
        // Analyze import dependencies
        await this.analyzeImportDependencies();
        // Analyze event dependencies
        await this.analyzeEventDependencies();
        // Analyze data flow dependencies
        await this.analyzeDataFlowDependencies();
    }
    async analyzeImportDependencies() {
        const files = await this.findTypeScriptFiles(process.cwd());
        for (const file of files) {
            const content = await fs_1.promises.readFile(file, 'utf-8');
            const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
            ts.forEachChild(sourceFile, (node) => {
                if (ts.isImportDeclaration(node)) {
                    const importPath = node.moduleSpecifier.text;
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
    async analyzeEventDependencies() {
        // Analyze EventEmitter usage and event patterns
        const files = await this.findTypeScriptFiles(process.cwd());
        for (const file of files) {
            const content = await fs_1.promises.readFile(file, 'utf-8');
            if (content.includes('EventEmitter') ||
                content.includes('emit(') ||
                content.includes('on(')) {
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
    async analyzeDataFlowDependencies() {
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
    async analyzeDataFlow(source, target) {
        // Analyze shared data structures and API calls
        const sourceContent = await fs_1.promises.readFile(source, 'utf-8');
        const targetContent = await fs_1.promises.readFile(target, 'utf-8');
        const sharedTypes = this.findSharedTypes(sourceContent, targetContent);
        const apiCalls = this.findApiCalls(sourceContent, targetContent);
        return {
            exists: sharedTypes.length > 0 || apiCalls.length > 0,
            weight: (sharedTypes.length * 0.3 + apiCalls.length * 0.7) / 10,
        };
    }
    async updateResonancePatterns() {
        const patterns = this.extractPatterns();
        for (const pattern of patterns) {
            await this.resonanceField.monitorQAMetrics(`ecosystem_pattern_${pattern.type}`, pattern.strength);
        }
    }
    generateHealthReport() {
        return {
            components: Array.from(this.componentHealth.values()),
            dependencies: this.dependencies,
            overallHealth: this.calculateOverallHealth(),
            recommendations: this.generateRecommendations(),
        };
    }
    calculateOverallHealth() {
        const healths = Array.from(this.componentHealth.values());
        return healths.reduce((acc, health) => acc + health.resonanceScore, 0) / healths.length;
    }
    generateRecommendations() {
        const recommendations = [];
        const health = Array.from(this.componentHealth.values());
        // Analyze component distribution
        if (this.dependencies.length > health.length * 2) {
            recommendations.push('Consider reducing component coupling through better abstraction');
        }
        // Analyze complexity distribution
        const complexComponents = health.filter((h) => h.complexity > 20);
        if (complexComponents.length > health.length * 0.2) {
            recommendations.push('Multiple complex components detected. Consider architectural refactoring');
        }
        return recommendations;
    }
    async findTypeScriptFiles(dir) {
        const files = [];
        async function walk(directory) {
            const entries = await fs_1.promises.readdir(directory, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path_1.default.join(directory, entry.name);
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    await walk(fullPath);
                }
                else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
                    files.push(fullPath);
                }
            }
        }
        await walk(dir);
        return files;
    }
    resolveImportPath(sourceFile, importPath) {
        if (importPath.startsWith('.')) {
            return path_1.default.resolve(path_1.default.dirname(sourceFile), importPath);
        }
        return importPath;
    }
    extractEventPatterns(content) {
        const events = [];
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
    findEventHandler(eventName) {
        // Implementation to find event handler file
        return 'unknown';
    }
    findSharedTypes(source, target) {
        const sourceTypes = this.extractTypes(source);
        const targetTypes = this.extractTypes(target);
        return sourceTypes.filter((type) => targetTypes.includes(type));
    }
    extractTypes(content) {
        const types = [];
        const typeRegex = /interface ([A-Za-z]+)|type ([A-Za-z]+)/g;
        let match;
        while ((match = typeRegex.exec(content)) !== null) {
            types.push(match[1] || match[2]);
        }
        return types;
    }
    findApiCalls(source, target) {
        const calls = [];
        const apiRegex = /await.*\.(get|post|put|delete)\(/g;
        let match;
        while ((match = apiRegex.exec(source)) !== null) {
            if (target.includes(match[0])) {
                calls.push(match[0]);
            }
        }
        return calls;
    }
    extractPatterns() {
        const patterns = [];
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
    groupDependencies() {
        const groups = [];
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
    findEventChains() {
        const chains = [];
        const eventDeps = this.dependencies.filter((dep) => dep.type === 'event');
        for (const dep of eventDeps) {
            const chain = [dep.source];
            let current = dep.target;
            while (current) {
                chain.push(current);
                const next = eventDeps.find((d) => d.source === current);
                current = next?.target;
                if (chain.includes(current))
                    break; // Prevent cycles
            }
            if (chain.length > 1) {
                chains.push(chain);
            }
        }
        return chains;
    }
    calculatePatternStrength(components) {
        const health = components
            .map((c) => this.componentHealth.get(c))
            .filter((h) => h !== undefined);
        return health.reduce((acc, h) => acc + h.resonanceScore, 0) / health.length;
    }
    calculateChainStrength(chain) {
        let strength = 1;
        for (let i = 0; i < chain.length - 1; i++) {
            const dep = this.dependencies.find((d) => d.source === chain[i] && d.target === chain[i + 1]);
            strength *= dep ? dep.weight : 0.5;
        }
        return strength;
    }
}
exports.EcosystemAnalyzer = EcosystemAnalyzer;
//# sourceMappingURL=ecosystemAnalyzer.js.map