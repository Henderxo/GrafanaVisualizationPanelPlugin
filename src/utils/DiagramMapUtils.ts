import { BaseObject, fullMermaidMap } from "types";
import { isFlowSubGraph, isFlowVertex } from "./MermaidUtils";

  function findElementInMaps(element: string, map: fullMermaidMap) : BaseObject | null{
    if (map.nodes.has(element)) {
        return map.nodes.get(element) as BaseObject;
    }
    if (map.subGraphs.has(element)) {
        return map.subGraphs.get(element) as BaseObject;
    }
    return null;
  }

   function getElementTypeInBaseObject(baseObject: BaseObject): 'node' | 'subgraph' | 'unknown'{
    if (isFlowVertex(baseObject)) {
      return 'node';
    } else if (isFlowSubGraph(baseObject)) {
      return 'subgraph';
    } else {
      return 'unknown';
    }
  }

   function findAllElementsInMaps (map: fullMermaidMap, options?: 'nodes' | 'subgraphs' | 'all'): string[] {
    let elements: string[] = [];
    if (!options || options === 'all') {
        elements = [...Array.from(map.nodes.keys()), ...Array.from(map.subGraphs.keys())];
    } else if (options === 'nodes') {
        elements = Array.from(map.nodes.keys());
    } else if (options === 'subgraphs') {
        elements = Array.from(map.subGraphs.keys());
    }
    return elements;
  }

export {findAllElementsInMaps, getElementTypeInBaseObject, findElementInMaps}


  
