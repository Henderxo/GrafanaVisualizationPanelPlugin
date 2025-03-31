  
import { BaseObject, FlowSubGraph, FlowVertex, fullMermaidMap } from "types/types";
import { findAllElementsInMaps, findElementInMaps } from "./TransformationUtils";
  
const bindData = (fullMap: fullMermaidMap) => {
    const elementsFromMap = findAllElementsInMaps(fullMap);
    if(elementsFromMap){
      elementsFromMap.forEach((element)=>{
        let mapElement = findElementInMaps(element, fullMap) as FlowSubGraph | FlowVertex
        let elementData = mapElement.data??null
        if(elementData && Object.keys(elementData).length > 0){
            if ('title' in mapElement) {
                if (mapElement.title) {
                    mapElement.title = mapElement.title.replace(/\$(\w+)/g, (match: any, variable: any) => {
                        return elementData[variable] !== undefined ?elementData[variable] : match;
                    });
                }
            } else if ('text' in mapElement) {
                if (mapElement.text) {
                    mapElement.text = mapElement.text.replace(/\$(\w+)/g, (match: any, variable: any) => {
                        return elementData[variable] !== undefined ? elementData[variable] : match;
                    });
                }
            }
        }
      })
    }
};

const bindDataToString = (inputString: string, element: BaseObject): string => {
    if (!inputString) return inputString;
    
    const elementData = element.data || null;
    
    if (!elementData || Object.keys(elementData).length === 0) {
      return inputString;
    }
    
    return inputString.replace(/\$(\w+)/g, (match: string, variable: string) => {
      return elementData[variable] !== undefined ? String(elementData[variable]) : match;
    });
  };
export { bindData, bindDataToString }