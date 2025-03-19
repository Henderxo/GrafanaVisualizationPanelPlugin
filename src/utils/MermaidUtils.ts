import { TemplateObject, ClassStyle, Element } from "types/types";

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
      const subgraphMatch = line.match(/subgraph\s+([\w\d_-]+)\s+\[(.*?)\]/);
      if (subgraphMatch) {
        const [, id, label] = subgraphMatch;
        object[id] = new Element(index, label, "subgraph");
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
      const edgeMatch = line.match(
        /^([\w\d_-]+)\s*([-]+>|\-\.\-\>|\-\-\>|\-\-)\s*(\|([^|]+)\|)?\s*([\w\d_-]+)/,
      );

      if (edgeMatch) {
        const [, from, arrowType, , label = "", to] = edgeMatch;
        // Push the edge with the arrow type included
        edges.push([from, to, label.trim(), arrowType.trim()]);
      }
    } else if (line.startsWith("classDef")) {
      const classDefMatch = line.match(/^classDef\s+([\w\d_-]+)\s+(.*)$/);
      if (classDefMatch) {
        const [, className, classStyle] = classDefMatch;

        const style = parseStyleString(classStyle);
        classDefs.set(className, style);
      }
    } else {
      const nodeMatch = line.match(/^([\w\d_-]+)[(\[{](.*?)[)\]}]$/);
      if (nodeMatch) {
        const [, id, text] = nodeMatch;
        if (subgraphStack.length > 0) {
          object[id] = new Element(index, text, "node");
        } else {
          object[id] = new Element(index, text, "node");
        }
      }
    }
  });
  return { object, edges, classDefs, config };
};

const getClassBindings = (input: string)=> {
    const classBindings = new Map<string, string[]>(); 
    const lines = input
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);
  
    lines.forEach((line) => {
        console.log(line)
      if (line.startsWith("class ")) {
        const classMatch = line.match(/^class\s+([\w\d_-]+(?:,[\w\d_-]+)*)\s+([\w\d_-]+)/);
        console.log(classMatch)
        if (classMatch) {
            const [, objectIds, className] = classMatch;
    
            // Split the objectIds if there are multiple
            const ids = objectIds.split(',');
    
            ids.forEach((objectId) => {
              // Ensure the classBindings Map has the objectId as key
              if (!classBindings.has(objectId)) {
                classBindings.set(objectId, []);
              }
    
              // Add className to the list of classes for the objectId
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