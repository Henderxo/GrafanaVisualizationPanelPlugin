  
  import { TemplateObject } from "types/types";
  
const bindData = (object: TemplateObject, element: string, row: Record<string, any>) => {
    if (object[element]) {
        const node = object[element];

        if (node.value) {
            node.value = node.value.replace(/\$(\w+)/g, (match: any, variable: any) => {
                return row[variable] !== undefined ? row[variable] : match; 
            });
        }
    }
};
export { bindData }