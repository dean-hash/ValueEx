/**
 * A directed graph implementation for tracking dependencies between components
 */
export declare class DependencyGraph {
    private graph;
    constructor();
    /**
     * Add a dependency from one node to another
     */
    addDependency(from: string, to: string): void;
    /**
     * Get all direct dependencies of a node
     */
    getDependencies(node: string): string[];
    /**
     * Get all dependencies of a node (including indirect dependencies)
     */
    getAllDependencies(node: string, visited?: Set<string>): Set<string>;
    /**
     * Check if the graph has a cycle
     */
    hasCycle(node?: string, visited?: Set<string>, stack?: Set<string>): boolean;
    /**
     * Get a topological sort of the graph
     */
    getTopologicalSort(): string[];
    /**
     * Add a new node to the graph
     */
    addNode(node: string): void;
    /**
     * Remove a node and all its dependencies from the graph
     */
    removeNode(node: string): void;
    /**
     * Add an edge between two nodes
     */
    addEdge(from: string, to: string): void;
    /**
     * Find all cycles in the graph
     */
    findCycles(): string[][];
    /**
     * Get all nodes that directly depend on the given node
     */
    getDirectDependents(node: string): string[];
    /**
     * Get all nodes that depend on the given node (including indirect dependents)
     */
    getAllDependents(node: string, visited?: Set<string>): Set<string>;
    /**
     * Calculate the average dependency depth in the graph
     */
    calculateAverageDependencyDepth(): number;
}
