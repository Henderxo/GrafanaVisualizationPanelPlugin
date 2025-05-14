import { ErrorService, ErrorType } from '../services/ErrorService';
import { AppEvents } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';

jest.mock('@grafana/runtime', () => ({
  getAppEvents: jest.fn(),
}));

const mockPublish = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (getAppEvents as jest.Mock).mockReturnValue({
    publish: mockPublish,
  });
});

describe('ErrorService', () => {
  describe('displayError', () => {
    it('logs error and publishes alertError event', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const errorDetails = {
        title: 'Parse Error',
        message: 'Could not parse YAML',
        error: new Error('Test error'),
      };

      ErrorService.displayError(ErrorType.YAML_PARSING, errorDetails);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `[${ErrorType.YAML_PARSING}] ${errorDetails.title}: ${errorDetails.message}`,
        errorDetails.error
      );

      expect(mockPublish).toHaveBeenCalledWith({
        type: AppEvents.alertError.name,
        payload: [errorDetails.title, errorDetails.message],
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('displayWarning', () => {
    it('logs warning and publishes alertWarning event', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      ErrorService.displayWarning('Warn Title', 'Warn Message');

      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARNING] Warn Title: Warn Message');

      expect(mockPublish).toHaveBeenCalledWith({
        type: AppEvents.alertWarning.name,
        payload: ['Warn Title', 'Warn Message'],
      });

      consoleWarnSpy.mockRestore();
    });
  });

  describe('displayInfo', () => {
    it('publishes alertInfo event', () => {
      ErrorService.displayInfo('Info Title', 'Info Message');

      expect(mockPublish).toHaveBeenCalledWith({
        type: AppEvents.alertInfo.name,
        payload: ['Info Title', 'Info Message'],
      });
    });
  });

  describe('displaySuccess', () => {
    it('publishes alertSuccess event', () => {
      ErrorService.displaySuccess('Success Title', 'Success Message');

      expect(mockPublish).toHaveBeenCalledWith({
        type: AppEvents.alertSuccess.name,
        payload: ['Success Title', 'Success Message'],
      });
    });
  });

  describe('getMermaidErrorMessage', () => {
    it.each([
      ['Syntax error in diagram', 'Syntax error in Mermaid diagram. Please check your template syntax.'],
      ['Invalid input format', 'Invalid Mermaid diagram structure. Please verify your template format.'],
      ['Unexpected parse error found', 'Unable to parse Mermaid diagram. Please check for formatting issues.'],
      ['Something else went wrong', 'Something else went wrong'],
    ])('parses mermaid error: %s', (input, expected) => {
      const result = ErrorService.getMermaidErrorMessage(new Error(input));
      expect(result).toBe(expected);
    });
  });
});
