import { describe, it, expect } from 'vitest';
import {
  parseColorToRgba,
  formatRgba,
  applyOpacityToColor,
  alphaToPercentage,
  percentageToAlpha,
  rgbaToHex,
  CC_BACKGROUND_PRESETS,
  CC_TEXT_PRESETS,
} from '../src/utils/colorUtils';

describe('Color Utilities', () => {
  it('parses hex colors correctly', () => {
    const white = parseColorToRgba('#ffffff');
    expect(white).toEqual({ r: 255, g: 255, b: 255, a: 1 });

    const black = parseColorToRgba('#000');
    expect(black).toEqual({ r: 0, g: 0, b: 0, a: 1 });
  });

  it('parses rgba colors with explicit alpha', () => {
    const youtube = parseColorToRgba('rgba(8, 8, 8, 0.75)');
    expect(youtube).toEqual({ r: 8, g: 8, b: 8, a: 0.75 });
  });

  it('formats rgba color object to string', () => {
    const str = formatRgba({ r: 255, g: 255, b: 0, a: 0.8 });
    expect(str).toBe('rgba(255, 255, 0, 0.8)');
  });

  it('converts rgba to 6-digit hex code', () => {
    const hex = rgbaToHex({ r: 255, g: 0, b: 0, a: 0.5 });
    expect(hex).toBe('#ff0000');
  });

  it('applies opacity overrides to existing color strings', () => {
    const modified = applyOpacityToColor('#ffffff', 0.5);
    expect(modified).toBe('rgba(255, 255, 255, 0.5)');

    const ytModified = applyOpacityToColor('rgba(8, 8, 8, 0.75)', 0.9);
    expect(ytModified).toBe('rgba(8, 8, 8, 0.9)');
  });

  it('converts between alpha float and percentage integer', () => {
    expect(alphaToPercentage(0.75)).toBe(75);
    expect(alphaToPercentage(1)).toBe(100);
    expect(alphaToPercentage(0)).toBe(0);

    expect(percentageToAlpha(75)).toBe(0.75);
    expect(percentageToAlpha(100)).toBe(1);
    expect(percentageToAlpha(0)).toBe(0);
  });

  it('provides YouTube default CC background preset', () => {
    const ytPreset = CC_BACKGROUND_PRESETS.find((p) => p.label.includes('YouTube'));
    expect(ytPreset).toBeDefined();
    expect(ytPreset?.rgba).toBe('rgba(8, 8, 8, 0.75)');
  });

  it('provides CC yellow text preset', () => {
    const yellow = CC_TEXT_PRESETS.find((p) => p.label === 'Yellow');
    expect(yellow).toBeDefined();
    expect(yellow?.rgba).toBe('rgba(255, 255, 0, 1)');
  });
});
