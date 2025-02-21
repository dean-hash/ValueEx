/**
 * A directed graph implementation for tracking dependencies between components
 */
export class DependencyGraph {
  private graph: Map<string, Set<string>>;

  constructor() {
    this.graph = new Map();
  }

  /**
   * Add a dependency from one node to another
   */
  public addDependency(from: string, to: string): void {
    if (!this.graph.has(from)) {
      this.graph.set(from, new Set());
    }
    if (!this.graph.has(to)) {
      this.graph.set(to, new Set());
    }
    this.graph.get(from)!.add(to);
  }

  /**
   * Get all direct dependencies of a node
   */
  public getDependencies(node: string): string[] {
    return Array.from(this.graph.get(node) || new Set());
  }

  /**
   * Get all dependencies of a node (including indirect dependencies)
   */
  public getAllDependencies(node: string, visited = new Set<string>()): Set<string> {
    const deps = new Set<string>();
    const directDeps = this.getDependencies(node);

    for (const dep of directDeps) {
      if (!visited.has(dep)) {
        deps.add(dep);
        visited.add(dep);
        const subDeps = this.getAllDependencies(dep, visited);
        subDeps.forEach((d) => deps.add(d));
      }
    }

    return deps;
  }

  /**
   * Check if the graph has a cycle
   */
  public hasCycle(node?: string, visited = new Set<string>(), stack = new Set<string>()): boolean {
    if (!node) {
      // Check all nodes if no starting node is specified
      for (const n of this.graph.keys()) {
        if (this.hasCycle(n, new Set(), new Set())) {
          return true;
        }
      }
      return false;
    }

    visited.add(node);
    stack.add(node);

    const deps = this.getDependencies(node);
    for (const dep of deps) {
      if (!visited.has(dep)) {
        if (this.hasCycle(dep, visited, stack)) {
          return true;
        }
      } else if (stack.has(dep)) {
        return true;
      }
    }

    stack.delete(node);
    return false;
  }

  /**
   * Get a topological sort of the graph
   */
  public getTopologicalSort(): string[] {
    if (this.hasCycle()) {
      throw new Error('Cannot perform topological sort on a cyclic graph');
    }

    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (node: string) => {
      if (visited.has(node)) return;
      visited.add(node);

      const deps = this.getDependencies(node);
      for (const dep of deps) {
        visit(dep);
      }

      result.unshift(node);
    };

    for (const node of this.graph.keys()) {
      visit(node);
    }

    return result;
  }

  /**
   * Add a new node to the graph
   */
  public addNode(node: string): void {
    if (!this.graph.has(node)) {
      this.graph.set(node, new Set());
    }
  }

  /**
   * Remove a node and all its dependencies from the graph
   */
  public removeNode(node: string): void {
    this.graph.delete(node);
    // Remove any dependencies to this node
    for (const [_, deps] of this.graph.entries()) {
      deps.delete(node);
    }
  }

  /**
   * Add an edge between two nodes
   */
  public addEdge(from: string, to: string): void {
    this.addNode(from);
    this.addNode(to);
    this.graph.get(from)!.add(to);
  }

  /**
   * Find all cycles in the graph
   */
  public findCycles(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string, path: string[] = []): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = this.getDependencies(node);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recursionStack.has(neighbor)) {
          const cycleStart = path.indexOf(neighbor);
          cycles.push(path.slice(cycleStart));
        }
      }

      recursionStack.delete(node);
      path.pop();
    };

    for (const node of this.graph.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return cycles;
  }

  /**
   * Get all nodes that directly depend on the given node
   */
  public getDirectDependents(node: string): string[] {
    const dependents: string[] = [];
    for (const [from, deps] of this.graph.entries()) {
      if (deps.has(node)) {
        dependents.push(from);
      }
    }
    return dependents;
  }

  /**
   * Get all nodes that depend on the given node (including indirect dependents)
   */
  public getAllDependents(node: string, visited = new Set<string>()): Set<string> {
    const dependents = new Set<string>();
    const directDependents = this.getDirectDependents(node);

    for (const dep of directDependents) {
      if (!visited.has(dep)) {
        dependents.add(dep);
        visited.add(dep);
        const subDependents = this.getAllDependents(dep, visited);
        subDependents.forEach((d) => dependents.add(d));
      }
    }

    return dependents;
  }

  /**
   * Calculate the average dependency depth in the graph
   */
  public calculateAverageDependencyDepth(): number {
    let totalDepth = 0;
    let nodeCount = 0;

    for (const node of this.graph.keys()) {
      const deps = this.getAllDependencies(node);
      totalDepth += deps.size;
      nodeCount++;
    }

    return nodeCount > 0 ? totalDepth / nodeCount : 0;
  }
}
