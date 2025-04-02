// ErrorService.ts
import { AppEvents } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';

export enum ErrorType {
  MERMAID_PARSING = 'MERMAID_PARSING',
  YAML_PARSING = 'YAML_PARSING',
  DATA_BINDING = 'DATA_BINDING',
  TEMPLATE_EMPTY = 'TEMPLATE_EMPTY',
  GENERAL = 'GENERAL'
}

export interface ErrorDetails {
  title: string;
  message: string;
  error?: Error | string;
}

export class ErrorService {
  static displayError(errorType: ErrorType, details: ErrorDetails): void {
    console.error(`[${errorType}] ${details.title}: ${details.message}`, details.error);
    
    getAppEvents().publish({
      type: AppEvents.alertError.name,
      payload: [details.title, details.message],
    });
  }
  
  static displayWarning(title: string, message: string): void {
    console.warn(`[WARNING] ${title}: ${message}`);
    
    getAppEvents().publish({
      type: AppEvents.alertWarning.name,
      payload: [title, message],
    });
  }
  
  static displayInfo(title: string, message: string): void {
    getAppEvents().publish({
      type: AppEvents.alertInfo.name,
      payload: [title, message],
    });
  }
  
  static displaySuccess(title: string, message: string): void {
    getAppEvents().publish({
      type: AppEvents.alertSuccess.name,
      payload: [title, message],
    });
  }
  
  static getMermaidErrorMessage(error: Error): string {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('syntax error')) {
      return 'Syntax error in Mermaid diagram. Please check your template syntax.';
    } else if (errorMessage.includes('invalid')) {
      return 'Invalid Mermaid diagram structure. Please verify your template format.';
    } else if (errorMessage.includes('parse error')) {
      return 'Unable to parse Mermaid diagram. Please check for formatting issues.';
    }
    
    return error.message;
  }
}