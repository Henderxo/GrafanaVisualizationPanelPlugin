  
  import { TemplateObject } from "types/types";
  
const bindData = (object: TemplateObject, element: string, row: Record<string, any>, dataBinding: string[]) => {
    if (object[element]) {
        const node = object[element];

        const bindingMap: Record<string, any> = Object.fromEntries(
            dataBinding
                .filter(binding => binding.includes("=")) 
                .map(binding => binding.split("=").map(part => part.replace(/['"]/g, '').trim())) 
        );
        const isDefaultBinding = dataBinding.includes("default");
        if (node.value) {
            node.value = node.value.replace(/\$(\w+)/g, (match: any, variable: any) => {
                if (isDefaultBinding) {
                    return row[variable] !== undefined ? row[variable] : match; 
                } else if(bindingMap) {
                    return (bindingMap[variable] !== undefined ? bindingMap[variable] : row[variable] !== undefined ? row[variable] : match); // Else use explicit binding
                } else {
                return row[variable] !== undefined ? row[variable] : match;
                }
            });
        }
    }
};
export{bindData}