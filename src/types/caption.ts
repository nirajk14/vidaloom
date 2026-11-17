/**
 * Normalized cue-level subtitle item
 */
export interface CaptionCue {
  id: string;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number; // 0 to 1
}

export interface CaptionStyleOptions {
  fontSize: number;
  fontFamily: string;
  textColor: string;        // e.g. "rgba(255, 255, 255, 1)"
  textOpacity: number;      // 0 to 1 (0% to 100%)
  backgroundColor: string;  // e.g. "rgba(8, 8, 8, 0.75)"
  backgroundOpacity: number;// 0 to 1 (0% to 100%)
  textAlign: 'left' | 'center' | 'right';
  padding: string;
  borderRadius: number;
}
