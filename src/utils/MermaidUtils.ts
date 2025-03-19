import internal from "stream";
import { TemplateObject, ClassStyle, Element } from "types/types";


function extractNodeId(node: string) {
    const match = node.trim().match(/^([\w\d_-]+)/); // Matches the first alphanumeric part (Node ID)
    return match ? match[1] : '';
}

function extractLabel(node: string) {
    // Regex to handle all Mermaid node types
    const match = node.match(/(?:\[\s*(.*?)\s*\])|(?:\(\(\s*(.*?)\s*\)\))|(?:\(\s*(.*?)\s*\))|(?:\{\s*(.*?)\s*\})/);

    // Return the matched label from one of the possible node formats
    return match ? match[1] || match[2] || match[3] || match[4] : '';
}

function getNodeType(node: string) {
    if (node.includes('((')) return 'circle'; 
    if (node.includes('(')) return 'round';
    if (node.includes('[')) return 'square';  // Node type square
    if (node.includes('{')) return 'diamond'; // Node type diamond
    return 'unknown'; // Default type
}

const parseMermaidToMap = (
  input: string,
): {
  object: TemplateObject,
  edges: [string, string, string, string][],
  classDefs: Map<string, ClassStyle>,
  config: string,
} => {
  const object: TemplateObject = {};
  const edges: [string, string, string, string][] = [];
  const classDefs: Map<string, ClassStyle> = new Map();
  let config: string = "";
  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
  const subgraphStack: string[] = [];

  const configMatch = input.match(/%%\{init:\s*([\s\S]*?)\}%%/);
  if (configMatch) {
    config = configMatch[0];
  }

  lines.forEach((line, index) => {
    if (line.startsWith("subgraph")) {
        const subgraphMatch = line.match(/subgraph\s+([\w\d_-]+)(?:\s*\[(.*?)\])?/);
        if (subgraphMatch) {
          const [, id, label] = subgraphMatch;
          const subgraphLabel = label || id;
          object[id] = new Element(index, subgraphLabel, "subgraph");
          subgraphStack.push(id);
        }
      } else if (line.startsWith("end")) {
        if (subgraphStack.length > 0) {
          const lastSubgraph = subgraphStack.pop();
          if (lastSubgraph) {
            object[lastSubgraph].endRow = index;
          }
        }
    } else if (
      line.includes("-->") ||
      line.includes("---") ||
      line.includes("-.->")
    ) {
        const splitLine = line.split(/\s*(-->|\-\-\>|\-\.\-\>|\-\-\-)\s*/).filter(Boolean);
        if(splitLine.length>2){
            for (let i = 0; i < splitLine.length - 2; i += 2) {
                let x = splitLine[i]; 
                let y = splitLine[i+1];
                let z = splitLine[i+2]; 
            
                // Handle the arrow text (if present)
                let textOnArrow = '';
                const arrowTextMatch = z.match(/\|([^|]+)\|/); // Look for any text like |Yes|
                if (arrowTextMatch) {
                    textOnArrow = arrowTextMatch[1]; // Extract the text on the arrow
                    z = z.replace(arrowTextMatch[0], ''); // Remove arrow text from the node
                }

                // Register Node 1 (x) and Node 2 (z)
                let fromNodeId = extractNodeId(x);
                let toNodeId = extractNodeId(z);
                
                // Extract labels from nodes if present
                let fromLabel = extractLabel(x);
                let toLabel = extractLabel(z);
                // Now handle the node types
                let fromNodeType = getNodeType(x); // Square, Round, etc.
                let toNodeType = getNodeType(z);   // Square, Round, etc.
            
                // Create the final edge object
                const edge = {
                    fromNodeId: fromNodeId,
                    fromLabel: fromLabel,
                    fromNodeType: fromNodeType,
                    arrowType: y,
                    toNodeId: toNodeId,
                    toLabel: toLabel,
                    toNodeType: toNodeType,
                    textOnArrow: textOnArrow,
                };
                if(edge.fromNodeId && !object[edge.fromNodeId]){
                    object[edge.fromNodeId] = new Element(index, edge.fromLabel, edge.fromNodeType);
                }
                if(edge.toNodeId && !object[edge.toNodeId]){
                    object[edge.toNodeId] = new Element(index, edge.toLabel, edge.toNodeType);
                }
                edges.push([edge.fromNodeId, edge.toNodeId, textOnArrow??'', edge.arrowType.trim()]);
            }
        }
    } else{
        if (line.startsWith("classDef")) {
            const classDefMatch = line.match(/^classDef\s+([\w\d_-]+)\s+(.*)$/);
            if (classDefMatch) {
              const [, className, classStyle] = classDefMatch;
      
              const style = parseStyleString(classStyle);
              classDefs.set(className, style);
            }
        }
        else{
            console.log('mathing node')
            console.log(line)
            const nodeMatch = line.match(/^([\w\d_-]+)(\(\(|\[\{|\()([^(){}\[\]]+)(\)\)|\}\]|\))$/);
            console.log(nodeMatch)
            if(nodeMatch){
                console.log('Matcherd')
                console.log(nodeMatch)
                addNode(index, nodeMatch, object)
            }
        }
    }
  });
  return { object, edges, classDefs, config };
};

const addNode = (index: number, nodeMatch: RegExpMatchArray, object: TemplateObject)=>{
    const [, id, shape, text, ] = nodeMatch;
    
    let nodeType = "square"; 
    if (shape === "((") nodeType = "circle";
    else if (shape === "{") nodeType = "diamond";
    else if (shape === "(") nodeType = "round"
    object[id] = new Element(index, text, nodeType);
}

const getClassBindings = (input: string)=> {
    const classBindings = new Map<string, string[]>(); 
    const lines = input
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);
  
    lines.forEach((line) => {
      if (line.startsWith("class ")) {
        const classMatch = line.match(/^class\s+([\w\d_-]+(?:,[\w\d_-]+)*)\s+([\w\d_-]+)/);
        if (classMatch) {
            const [, objectIds, className] = classMatch;
    
            const ids = objectIds.split(',');
    
            ids.forEach((objectId) => {
              if (!classBindings.has(objectId)) {
                classBindings.set(objectId, []);
              }
    
              classBindings.get(objectId)?.push(className);
            });
          }
      }
    });
  
    return classBindings;
  };
  

const parseStyleString = (style: string): ClassStyle => {
  const styleObj: ClassStyle = {};
  const regex = /([a-zA-Z-]+)\s*[:=]\s*([^,;]+)/g;
  let match;
  while ((match = regex.exec(style)) !== null) {
    const [, property, value] = match;
    styleObj[property] = value;
  }
  return styleObj;
};

export { parseMermaidToMap, getClassBindings};