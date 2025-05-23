import { FlowClass, FlowEdge, FlowSubGraph, FlowVertex, FlowVertexTypeParam } from '../types';

   const VALID_SHAPES = new Set<FlowVertexTypeParam>([
    'square', 'doublecircle', 'circle', 'ellipse', 'stadium', 'subroutine',
    'rect', 'cylinder', 'round', 'diamond', 'hexagon', 'odd',
    'trapezoid', 'inv_trapezoid', 'lean_right', 'lean_left',
  ]);

   const isValidShape = (shape: any): shape is FlowVertexTypeParam => 
    VALID_SHAPES.has(shape);

   function extractMermaidDiagramType(mermaidCode: string): string {
    const codeWithoutInit = mermaidCode.replace(/%%{init:[\s\S]*?}%%/g, '').trim();
    
    const flowchartRegex = /^(?:flowchart|graph)\s+(TB|TD|BT|RL|LR)\b/i;
    const basicFlowchartRegex = /^(?:flowchart|graph)\b(?!\s+(TB|TD|BT|RL|LR))/i;
    
    const flowchartMatch = codeWithoutInit.match(flowchartRegex);
    if (flowchartMatch) {
      const direction = flowchartMatch[1].toUpperCase();
      return `flowchart ${direction}`;
    }
    
    if (basicFlowchartRegex.test(codeWithoutInit)) {
      return "flowchart TD";
    }
    
    return "Unknown diagram type";
  }
  
   function extractMermaidConfigString(template: string): string | undefined {
      const initRegex = /%%\{init:\s*(.*?)\s*\}%%/;
      const match = template.match(initRegex);
      
      if (match && match[1]) {
        return match[1].trim();
      }
      
      return undefined;
    }

   function isFlowVertex(obj: any): obj is FlowVertex {
    return (
      obj &&
      Array.isArray(obj.classes) &&
      typeof obj.id === 'string' &&
      typeof obj.domId === 'string' &&
      Array.isArray(obj.styles)
    );  
  }
  
   function isFlowSubGraph(obj: any): obj is FlowSubGraph {
    return (
      obj &&
      Array.isArray(obj.classes) &&
      typeof obj.id === 'string' &&
      typeof obj.title === 'string' &&
      Array.isArray(obj.nodes)
    );
  }

 function generateDynamicMermaidFlowchart(data: {
    nodes: Map<string, FlowVertex>,
    edges: FlowEdge[],
    classes: Map<string, FlowClass>,
    subGraphs: Map<string, FlowSubGraph>,
    config?: string
    type: string
  }): string {

    let mermaidString = "";
    if (data.config) {
      mermaidString += `%%{init: ${data.config}}%%\n`;
    }

    mermaidString += `${data.type}\n`;
    
    const nodesInSubgraphs = new Set<string>();
    
    if (data.subGraphs.size > 0) {
      for (const [, subgraph] of data.subGraphs) {
        mermaidString += `  subgraph ${subgraph.id} [${subgraph.title}]\n`;
        
        subgraph.nodes.forEach(nodeId => {
          nodesInSubgraphs.add(nodeId);
          const node = data.nodes.get(nodeId);
          
          if (node) {
            let nodeText = formatNodeText(nodeId, node);
            mermaidString += `    ${nodeText}\n`;
          } else {
            mermaidString += `    ${nodeId}\n`;
          }
        });
        
        mermaidString += "  end\n";
      }
      mermaidString += "\n";
    }
    
    for (const [nodeId, node] of data.nodes) {
      if (!nodesInSubgraphs.has(nodeId)) {
        let nodeText = formatNodeText(nodeId, node);
        mermaidString += `  ${nodeText}\n`;
      }
    }
    mermaidString += "\n";
    
    const edgeNodeIds = new Set<string>();
    data.edges.forEach(edge => {
      edgeNodeIds.add(edge.start);
      edgeNodeIds.add(edge.end);
    });
    
    const missingNodes = Array.from(edgeNodeIds)
      .filter(nodeId => !data.nodes.has(nodeId) && !nodesInSubgraphs.has(nodeId));
    
    if (missingNodes.length > 0) {
      missingNodes.forEach(nodeId => {
        mermaidString += `  ${nodeId}\n`;
      });
      mermaidString += "\n";
    }
    
    if (data.edges.length > 0) {
      const groupedEdges = groupEdges(data.edges);
      
      Object.entries(groupedEdges).forEach(([groupName, edges]) => {
        mermaidString += `  %%%% ${groupName}\n`;
        edges.forEach(edge => {
          const lineStyle = getLineStyle(edge);

          mermaidString += `  ${edge.start} ${lineStyle}${edge.text?`|${edge.text}|`:``} ${edge.end}\n`;
        });
        mermaidString += "\n";
      });
    }
    
    if (data.classes.size > 0) {
      mermaidString += "  %%%% Class Definitions\n";
      for (const [classId, classStyle] of data.classes) {
        mermaidString += `  classDef ${classId} ${classStyle.styles.join(',')}\n`;
      }
      mermaidString += "\n";
    }
    
    const nodeClasses = new Map<string, string[]>();
    const subgraphClasses = new Map<string, string[]>();

    for (const [nodeId, node] of data.nodes) {
      if (node.classes && node.classes.length > 0) {
        nodeClasses.set(nodeId, node.classes);
      }
    }

    for (const [subgraphId, subgraph] of data.subGraphs) {
      if (subgraph.classes && subgraph.classes.length > 0) {
        subgraphClasses.set(subgraphId, subgraph.classes);
      }
    }
    
    if (nodeClasses.size > 0) {
      mermaidString += "  %%%% Apply classes to nodes\n";
      nodeClasses.forEach((classes, nodeId) => {
        classes.forEach(className => {
          mermaidString += `  class ${nodeId} ${className};\n`;
        });
      });
    }

    if (subgraphClasses.size > 0) {
      mermaidString += "  %%%% Apply classes to subgraphs\n";
      subgraphClasses.forEach((classes, subgraphId) => {
        classes.forEach(className => {
          mermaidString += `  class ${subgraphId} ${className};\n`;
        });
      });
    }

    const nodesWithStyles = Array.from(data.nodes.entries())
    .filter(([_, node]) => node.styles && node.styles.length > 0);
  
    if (nodesWithStyles.length > 0) {
    mermaidString += "  %%%% Apply direct styles to nodes\n";
     nodesWithStyles.forEach(([nodeId, node]) => {
        if (node.styles && node.styles.length > 0) {
          mermaidString += `  style ${nodeId} ${node.styles.join(',')};\n`;
        }
      }) ;
    }

    const subgraphsWithStyles = Array.from(data.subGraphs.entries())
    .filter(([_, subgraph]) => subgraph.styles && subgraph.styles.length > 0);

    if (subgraphsWithStyles.length > 0) {
      mermaidString += "  %%%% Apply direct styles to subgraphs\n";
      subgraphsWithStyles.forEach(([subgraphId, subgraph]) => {
        if (subgraph.styles && subgraph.styles.length > 0) {
          mermaidString += `  style ${subgraphId} ${subgraph.styles.join(',')};\n`;
        }
      });
    }
    
    return mermaidString;
  }
  
  function formatNodeText(nodeId: string, node: FlowVertex): string {
    let nodeProp: string[] = []
    let nodeContent = node.text || nodeId;
    if(node.type){
      if(node.type && node.type === 'lean_right'){
        nodeProp.push(`shape: lean-right`)
      }else if(node.type === 'lean_left'){
        nodeProp.push(`shape: lean-left`)
      } else if(node.type === 'round'){
        nodeProp.push(`shape: rounded`)
      } else if(node.type === 'square'){
        nodeProp.push(`shape: rect`)
      }else{
        nodeProp.push(`shape: ${node.type??'round'}`)
      }
    }
    
    if(node.linkTarget){
      nodeProp.push(`linkTarget: ${node.linkTarget}`)
    }
    if(node.link){
      nodeProp.push(`link: ${node.link}`)
    }
    if(node.icon){
      nodeProp.push(`icon: ${node.icon}`)
    }
    if(node.pos){
      nodeProp.push(`pos: ${node.pos}`)
    }
    if(node.assetWidth){
      nodeProp.push(`w: ${node.assetWidth}`)
    }
    if(node.assetHeight){
      nodeProp.push(`h: ${node.assetHeight}`)
    }
    if(node.form){
      nodeProp.push(`form: ${node.form}`)
    }
    if(node.labelType){
      nodeProp.push(`labelType: "${node.labelType}"`)
    }
    if(node.constraint){
      nodeProp.push(`constraint: ${node.constraint}`)
    }
    if(node.labelType === 'text'){
      nodeProp.push(`label: '${nodeContent}'`) 
    }else if(node.labelType === 'string'){
      nodeProp.push(`label: ${nodeContent}`) 
    }else if(node.labelType === 'markdown'){
      nodeProp.push(`label: "\`${nodeContent}\`"`)
    }
    
    if(node.img){
      nodeProp.push(`img: ${node.img}`)
    }


    return `${nodeId}@{ ${nodeProp.join(', ')} }`
  }
  
 
  function groupEdges(edges: FlowEdge[]): Record<string, FlowEdge[]> {
    const groups: Record<string, FlowEdge[]> = {
      'Standard Connections': [],
    'Dotted Connections': [],
    'Thick Connections': [],
    'Invisible Connections': [],
    'Other Connections': []
    };
    
    edges.forEach(edge => {
      if (edge.stroke === 'dotted') {
        groups['Dotted Connections'].push(edge);
      } else if (edge.stroke === 'normal') {
        groups['Standard Connections'].push(edge);
      } else if (edge.stroke === 'thick') {
        groups['Thick Connections'].push(edge);
      } else if (edge.stroke === 'invisible') {
        groups['Invisible Connections'].push(edge);
      } else {
        groups['Other Connections'].push(edge);
      }
    });
    
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });
    
    return groups;
  }
  
  function getLineStyle(edge: FlowEdge): string {
    if (edge.stroke === 'dotted') {
      return '-.->';
    } else if (edge.stroke === 'thick') {
      return '==>';
    } else if (edge.stroke === 'invisible') {
      return '~~~';
    } else if (edge.stroke === 'normal' && edge.type === 'arrow_circle'){
      return '--o'
    }else if (edge.stroke === 'normal' && edge.type === 'arrow_cross'){
      return '--x'
    }else if(edge.stroke === 'normal' && edge.type === 'double_arrow_circle'){
      return 'o--o'
    } else if(edge.stroke === 'normal' && edge.type === 'double_arrow_point'){
      return '<-->'
    } else if(edge.stroke === 'normal' && edge.type === 'double_arrow_cross'){
      return 'x--x'
    }
     else {
      return '-->';
    }
  }

  export {
    generateDynamicMermaidFlowchart, getLineStyle, isValidShape, extractMermaidConfigString, isFlowVertex, isFlowSubGraph, extractMermaidDiagramType
  }
