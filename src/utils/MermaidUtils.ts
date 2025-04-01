import { MermaidConfig } from "mermaid";
import { FlowClass, FlowEdge, FlowSubGraph, FlowVertex } from "types/types";


export function generateDynamicMermaidFlowchart(data: {
    nodes: Map<string, FlowVertex>,
    edges: FlowEdge[],
    classes: Map<string, FlowClass>,
    subGraphs: Map<string, FlowSubGraph>,
    config?: string
  }): string {

    let mermaidString = "";
    if (data.config) {
      mermaidString += `%%{init: ${data.config}}%%\n`;
    }
    // Start building the Mermaid flowchart string
    mermaidString += "graph TB\n";
    
    // Track nodes that are part of subgraphs
    const nodesInSubgraphs = new Set<string>();
    
    // Process subgraphs first if they exist
    if (data.subGraphs.size > 0) {
      for (const [subgraphId, subgraph] of data.subGraphs) {
        mermaidString += `  subgraph ${subgraph.id} [${subgraph.title}]\n`;
        
        // Add nodes to subgraph
        subgraph.nodes.forEach(nodeId => {
          nodesInSubgraphs.add(nodeId);
          const node = data.nodes.get(nodeId);
          
          if (node) {
            // Format node with shape and properties based on node type
            let nodeText = formatNodeText(nodeId, node);
            mermaidString += `    ${nodeText}\n`;
          } else {
            // If node details aren't available, just add the node ID
            mermaidString += `    ${nodeId}\n`;
          }
        });
        
        mermaidString += "  end\n";
      }
      mermaidString += "\n";
    }
    
    // Process any remaining nodes that aren't in subgraphs
    for (const [nodeId, node] of data.nodes) {
      if (!nodesInSubgraphs.has(nodeId)) {
        let nodeText = formatNodeText(nodeId, node);
        mermaidString += `  ${nodeText}\n`;
      }
    }
    mermaidString += "\n";
    
    // Add all nodes that appear in edges but aren't defined in nodes
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
    
    // Process all edges
    if (data.edges.length > 0) {
      // Group edges by type for better organization
      const groupedEdges = groupEdges(data.edges);
      
      // Add edges by group
      Object.entries(groupedEdges).forEach(([groupName, edges]) => {
        mermaidString += `  %%%% ${groupName}\n`;
        edges.forEach(edge => {
          const lineStyle = getLineStyle(edge);

          mermaidString += `  ${edge.start} ${lineStyle}${edge.text?`|${edge.text}|`:``} ${edge.end}\n`;
        });
        mermaidString += "\n";
      });
    }
    
    // Process class definitions
    if (data.classes.size > 0) {
      mermaidString += "  %%%% Class Definitions\n";
      for (const [classId, classStyle] of data.classes) {
        mermaidString += `  classDef ${classId} ${classStyle.styles.join(',')}\n`;
      }
      mermaidString += "\n";
    }
    
    // Apply classes to nodes
    const nodeClasses = new Map<string, string[]>();
    const subgraphClasses = new Map<string, string[]>();

    // Collect classes from nodes
    for (const [nodeId, node] of data.nodes) {
      if (node.classes && node.classes.length > 0) {
        nodeClasses.set(nodeId, node.classes);
      }
    }

     // Collect classes from subgraphs
    for (const [subgraphId, subgraph] of data.subGraphs) {
      if (subgraph.classes && subgraph.classes.length > 0) {
        subgraphClasses.set(subgraphId, subgraph.classes);
      }
    }
    
    // Apply classes
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
  
  /**
   * Formats a node's text representation based on its properties
   */
  function formatNodeText(nodeId: string, node: FlowVertex): string {
    // Determine node shape based on type
    let nodeShape = '';
    if (node.type) {
      switch (node.type) {
        case 'circle':
          nodeShape = '((default))';
          break;
        case 'doublecircle':
          nodeShape = '(((default)))';
          break;
        case 'square': 
          nodeShape = '[default]';
          break;
        case 'rect':
          nodeShape = '[/default\\]';
          break;
        case 'diamond':
          nodeShape = '{default}';
          break;
        case 'hexagon':
          nodeShape = '{{default}}';
          break;
        case 'cylinder':
          nodeShape = '[(default)]';
          break;
        case 'stadium':
          nodeShape = '([default])';
          break;
        case 'round':
          nodeShape = '(default)';
          break;
        case 'ellipse':
          nodeShape = '((default))';
          break;
        case 'subroutine':
          nodeShape = '[[default]]';
          break;
        case 'odd':
          nodeShape = '>default]';
          break;
        case 'trapezoid':
          nodeShape = '[/default/]';
          break;
        case 'inv_trapezoid':
          nodeShape = '[\\default\\]';
          break;
        case 'lean_right':
          nodeShape = '[/default/]';
          break;
        case 'lean_left':
          nodeShape = '[\\default]';
          break;
        default:
          nodeShape = '(default)';
      }
    } else {
      // Default shape if none specified
      nodeShape = '(default)';
    }
    
    // Format node content with any properties
    let nodeContent = node.text || nodeId;
    
    // Return the formatted node representation
    return `${nodeId}${nodeShape.replace('default', nodeContent)}`;
  }


  // function formatNodeText(nodeId: string, node: FlowVertex): string {
  //   let nodeContent = node.text || nodeId;
    
  //   // Using the new tag syntax
  //   let tagAttributes = [];
    
  //   // Add shape attribute if node type is specified
  //   if (node.type) {
  //     tagAttributes.push(`shape: ${node.type}`);
  //   } else {
  //     // Default shape if none specified
  //     tagAttributes.push('shape: round');
  //   }
    
  //   // Add label attribute for the text (escape any quotes in the content)
  //   const escapedContent = nodeContent.replace(/"/g, '\\"');
  //   tagAttributes.push(`label: "${escapedContent}"`);
    
  //   // If there are direct styles, add them as a style attribute
  //   if (node.styles && node.styles.length > 0) {
  //     tagAttributes.push(`style: "${node.styles.join(',')}"`);
  //   }
    
  //   // Format using the new @{} tag syntax
  //   return `${nodeId}@{${tagAttributes.join(', ')}}`;
  // }
  
  /**
   * Groups edges by connection type for better organization in the chart
   */
  function groupEdges(edges: FlowEdge[]): Record<string, FlowEdge[]> {
    // Group edges by some property
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
    
    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });
    
    return groups;
  }
  
  /**
   * Determines the line style based on edge properties
   */
  function getLineStyle(edge: FlowEdge): string {
    if (edge.stroke === 'dotted') {
      return '-.->';
    } else if (edge.stroke === 'thick') {
      return '==>';
    } else if (edge.stroke === 'invisible') {
      return '~~~';
    } else {
      // Default to normal
      return '-->';
    }
  }
