import { DependencyGraph } from '../../../services/analysis/utils/dependencyGraph';
describe('DependencyGraph', () => {
    let graph;
    beforeEach(() => {
        graph = new DependencyGraph();
    });
    describe('Basic Operations', () => {
        test('should add dependencies correctly', () => {
            graph.addDependency('A', 'B');
            graph.addDependency('B', 'C');
            const aDeps = graph.getDependencies('A');
            const bDeps = graph.getDependencies('B');
            expect(aDeps).toContain('B');
            expect(bDeps).toContain('C');
        });
        test('should handle non-existent nodes', () => {
            const deps = graph.getDependencies('NonExistent');
            expect(deps).toEqual([]);
        });
    });
    describe('Cycle Detection', () => {
        test('should detect direct cycles', () => {
            graph.addDependency('A', 'B');
            graph.addDependency('B', 'A');
            expect(graph.hasCycle()).toBe(true);
        });
        test('should detect indirect cycles', () => {
            graph.addDependency('A', 'B');
            graph.addDependency('B', 'C');
            graph.addDependency('C', 'A');
            expect(graph.hasCycle()).toBe(true);
        });
        test('should return false for acyclic graphs', () => {
            graph.addDependency('A', 'B');
            graph.addDependency('B', 'C');
            graph.addDependency('C', 'D');
            expect(graph.hasCycle()).toBe(false);
        });
    });
    describe('Topological Sort', () => {
        test('should sort dependencies correctly', () => {
            graph.addDependency('A', 'B');
            graph.addDependency('B', 'C');
            graph.addDependency('C', 'D');
            const sorted = graph.getTopologicalSort();
            // Should maintain dependency order
            expect(sorted.indexOf('A')).toBeLessThan(sorted.indexOf('B'));
            expect(sorted.indexOf('B')).toBeLessThan(sorted.indexOf('C'));
            expect(sorted.indexOf('C')).toBeLessThan(sorted.indexOf('D'));
        });
        test('should handle parallel dependencies', () => {
            graph.addDependency('A', 'C');
            graph.addDependency('B', 'C');
            graph.addDependency('C', 'D');
            const sorted = graph.getTopologicalSort();
            // Both A and B should come before C
            expect(sorted.indexOf('A')).toBeLessThan(sorted.indexOf('C'));
            expect(sorted.indexOf('B')).toBeLessThan(sorted.indexOf('C'));
            expect(sorted.indexOf('C')).toBeLessThan(sorted.indexOf('D'));
        });
    });
    describe('Transitive Dependencies', () => {
        test('should get all transitive dependencies', () => {
            graph.addDependency('A', 'B');
            graph.addDependency('B', 'C');
            graph.addDependency('C', 'D');
            const allDeps = graph.getAllDependencies('A');
            expect(allDeps).toContain('B');
            expect(allDeps).toContain('C');
            expect(allDeps).toContain('D');
        });
        test('should handle diamond dependencies', () => {
            graph.addDependency('A', 'B');
            graph.addDependency('A', 'C');
            graph.addDependency('B', 'D');
            graph.addDependency('C', 'D');
            const allDeps = graph.getAllDependencies('A');
            expect(allDeps.size).toBe(3); // B, C, D (no duplicates)
            expect(allDeps).toContain('B');
            expect(allDeps).toContain('C');
            expect(allDeps).toContain('D');
        });
    });
    describe('Error Handling', () => {
        test('should handle empty graph operations', () => {
            expect(() => graph.getTopologicalSort()).not.toThrow();
            expect(() => graph.hasCycle()).not.toThrow();
            expect(() => graph.getAllDependencies('A')).not.toThrow();
        });
        test('should handle invalid dependencies', () => {
            expect(() => graph.addDependency('', 'B')).not.toThrow();
            expect(() => graph.addDependency('A', '')).not.toThrow();
            expect(() => graph.addDependency('A', 'A')).not.toThrow(); // Self-dependency
        });
    });
});
//# sourceMappingURL=dependencyGraph.test.js.map