import { colorToHex } from '../utils/GeneralUtils';

describe('colorToHex', () => {
  it('converts rgb color to hex', () => {
    expect(colorToHex('rgb(255, 0, 255)')).toBe('ff00ff');
    expect(colorToHex('rgb(0, 0, 0)')).toBe('000000');
    expect(colorToHex('rgb(255, 255, 255)')).toBe('ffffff');
  });

  it('converts rgba color to hex (ignores alpha)', () => {
    expect(colorToHex('rgba(255, 0, 0, 0.5)')).toBe('ff0000');
    expect(colorToHex('rgba(0, 128, 64, 1)')).toBe('008040');
  });

  it('returns default color for invalid input', () => {
    expect(colorToHex('invalidColor')).toBe('D4D4D4');
    expect(colorToHex('')).toBe('D4D4D4');
    expect(colorToHex('hsl(0, 100%, 50%)')).toBe('D4D4D4');
  });
});
