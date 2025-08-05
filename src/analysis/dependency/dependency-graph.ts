import * as fs from 'fs';
import * as path from 'path';

// key에 해당하는 호출 c, header 파일들
export type DepGraph = Map<string, Set<string>>;
  /*
  * main.d
  * main.o: main.c defs.h utils.h

  * utils.d
  * utils.o: utils.c utils.h defs.h
  
  *   input : utils.o: utils.c utils.h defs.h 
  *  
  *   output: [
  *     utils.o,
  *     SET [ "utils.c" , "utils.h" , "defs.h"]
  *   ] 
  */
export function parseDFile(dFilePath: string): [string, Set<string>] | null {
  const content = fs.readFileSync(dFilePath, "utf-8").replace(/\\\n/g, " ");
  const [target, deps] = content.split(":");
  if (!target || !deps) return null;
  return [target.trim(), new Set(deps.split(/\s+/).filter(Boolean))];
}


export function buildDepGraph(dDir: string): DepGraph {
  const graph: DepGraph = new Map();
  const dFiles = fs.readdirSync(dDir).filter(f => f.endsWith(".d"));
  for (const file of dFiles) {
    const res = parseDFile(path.join(dDir, file));
    if (res) {
      const [target, deps] = res;
      graph.set(target, deps);
    }
  }
  return graph;
}

export function reverseGraph(graph: DepGraph): DepGraph {
  const rev: DepGraph = new Map();
  for (const [src, deps] of graph.entries()) {
    for (const dep of deps) {
      if (!rev.has(dep)) rev.set(dep, new Set());
      rev.get(dep)!.add(src);
    }
  }
  return rev;
}

export function getAffectedFiles(changed: string[], graph: DepGraph): Set<string> {
  const rev = reverseGraph(graph);
  const affected = new Set(changed);
  const queue = [...changed];
  while (queue.length) {
    const node = queue.shift()!;
    for (const dep of rev.get(node) || []) {
      if (!affected.has(dep)) {
        affected.add(dep);
        queue.push(dep);
      }
    }
  }
  return affected;
}