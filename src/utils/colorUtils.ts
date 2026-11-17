import { RgbaColor } from '../types/caption';

/**
 * Parses any CSS color string (hex, rgb, rgba) into normalized { r, g, b, a } components.
 */
export function parseColorToRgba(colorStr: string, defaultAlpha = 1): RgbaColor {
  if (!colorStr) {
    return { r: 255, g: 255, b: 255, a: defaultAlpha };
  }

  const str = colorStr.trim().toLowerCase();

  // Match rgba(r, g, b, a)
  const rgbaMatch = str.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/);
  if (rgbaMatch) {
    return {
      r: clampByte(parseInt(rgbaMatch[1], 10)),
      g: clampByte(parseInt(rgbaMatch[2], 10)),
      b: clampByte(parseInt(rgbaMatch[3], 10)),
      a: clampAlpha(parseFloat(rgbaMatch[4])),
    };
  }

  // Match rgb(r, g, b)
  const rgbMatch = str.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (rgbMatch) {
    return {
      r: clampByte(parseInt(rgbMatch[1], 10)),
      g: clampByte(parseInt(rgbMatch[2], 10)),
      b: clampByte(parseInt(rgbMatch[3], 10)),
      a: clampAlpha(defaultAlpha),
    };
  }

  // Match hex (#fff or #ffffff or #ffffffff)
  if (str.startsWith('#')) {
    let hex = str.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b, a: clampAlpha(defaultAlpha) };
    }
    if (hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = parseInt(hex.slice(6, 8), 16) / 255;
      return { r, g, b, a: clampAlpha(a) };
    }
  }

  // Named color fallbacks
  if (str === 'transparent') {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  if (str === 'black') {
    return { r: 0, g: 0, b: 0, a: defaultAlpha };
  }
  if (str === 'white') {
    return { r: 255, g: 255, b: 255, a: defaultAlpha };
  }
  if (str === 'yellow') {
    return { r: 255, g: 255, b: 0, a: defaultAlpha };
  }

  return { r: 255, g: 255, b: 255, a: defaultAlpha };
}

/**
 * Converts { r, g, b, a } into an rgba() string.
 */
export function formatRgba({ r, g, b, a }: RgbaColor): string {
  const cleanAlpha = Math.round(clampAlpha(a) * 100) / 100;
  return `rgba(${clampByte(r)}, ${clampByte(g)}, ${clampByte(b)}, ${cleanAlpha})`;
}

/**
 * Returns a 6-digit hex string (#rrggbb) from an RGBA color, ignoring alpha.
 */
export function rgbaToHex({ r, g, b }: RgbaColor): string {
  const toHex = (n: number) => clampByte(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Applies a new alpha opacity (0 to 1) to any color string and returns rgba string.
 */
export function applyOpacityToColor(colorStr: string, opacity: number): string {
  const parsed = parseColorToRgba(colorStr);
  parsed.a = clampAlpha(opacity);
  return formatRgba(parsed);
}

/**
 * Converts a 0..1 alpha value to an integer percentage (0..100).
 */
export function alphaToPercentage(alpha: number): number {
  return Math.round(clampAlpha(alpha) * 100);
}

/**
 * Converts an integer percentage (0..100) to a 0..1 alpha value.
 */
export function percentageToAlpha(percent: number): number {
  if (Number.isNaN(percent)) return 1;
  return clampAlpha(percent / 100);
}

function clampByte(val: number): number {
  if (Number.isNaN(val)) return 0;
  return Math.max(0, Math.min(255, Math.round(val)));
}

function clampAlpha(val: number): number {
  if (Number.isNaN(val)) return 1;
  return Math.max(0, Math.min(1, val));
}

// Predefined Text (CC) Color Presets
export const CC_TEXT_PRESETS = [
  { label: 'White', rgba: 'rgba(255, 255, 255, 1)', hex: '#ffffff' },
  { label: 'Yellow', rgba: 'rgba(255, 255, 0, 1)', hex: '#ffff00' },
  { label: 'Cyan', rgba: 'rgba(56, 189, 248, 1)', hex: '#38bdf8' },
  { label: 'Green', rgba: 'rgba(74, 222, 128, 1)', hex: '#4ade80' },
  { label: 'Pink', rgba: 'rgba(244, 114, 182, 1)', hex: '#f472b6' },
];

// Predefined Background Color Presets
export const CC_BACKGROUND_PRESETS = [
  { label: 'YouTube (75%)', rgba: 'rgba(8, 8, 8, 0.75)', hex: '#080808', opacity: 0.75 },
  { label: 'Solid Black (100%)', rgba: 'rgba(0, 0, 0, 1)', hex: '#000000', opacity: 1 },
  { label: 'Semi-Dark (50%)', rgba: 'rgba(0, 0, 0, 0.5)', hex: '#000000', opacity: 0.5 },
  { label: 'Deep Navy (85%)', rgba: 'rgba(15, 23, 42, 0.85)', hex: '#0f172a', opacity: 0.85 },
  { label: 'Transparent', rgba: 'rgba(0, 0, 0, 0)', hex: '#000000', opacity: 0 },
];
