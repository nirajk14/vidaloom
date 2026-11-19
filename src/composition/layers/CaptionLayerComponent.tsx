import React from 'react';
import { CaptionCue } from '../../types/caption';
import { CaptionStyle, CaptionLayer } from '../../types/project';
import { findActiveCues } from '../../engine/subtitles/srtParser';
import { applyOpacityToColor } from '../../utils/colorUtils';

interface CaptionLayerProps {
  layer: CaptionLayer;
  cues: CaptionCue[];
  currentTimeInSeconds: number;
  compositionWidth: number;
  compositionHeight: number;
  styleOverride?: CaptionStyle;
}

export const CaptionLayerComponent: React.FC<CaptionLayerProps> = ({
  layer,
  cues,
  currentTimeInSeconds,
  compositionWidth,
  compositionHeight,
  styleOverride,
}) => {
  if (!layer.visible) {
    return null;
  }

  const activeCues = findActiveCues(cues, currentTimeInSeconds);
  if (activeCues.length === 0) {
    return null;
  }

  const style = styleOverride ?? layer.style;
  const { transform, opacity } = layer;

  // Normalized coordinates (0-1) to pixel positions
  // Default position: lower 15% of composition
  const left = (transform?.x ?? 0.05) * compositionWidth;
  const top = (transform?.y ?? 0.78) * compositionHeight;
  const width = (transform?.width ?? 0.9) * compositionWidth;

  const textColor = applyOpacityToColor(
    style?.textColor ?? 'rgba(255, 255, 255, 1)',
    style?.textOpacity ?? 1
  );

  const backgroundColor = applyOpacityToColor(
    style?.backgroundColor ?? 'rgba(8, 8, 8, 0.75)',
    style?.backgroundOpacity ?? 0.75
  );

  // Scaled font size relative to 1080p height
  const scaleFactor = compositionHeight / 1080;
  const baseFontSize = style?.fontSize ?? 36;
  const fontSize = Math.max(16, Math.round(baseFontSize * scaleFactor));
  const fontFamily = style?.fontFamily ?? 'system-ui, sans-serif';
  const textAlign = style?.textAlign ?? 'center';
  const borderRadius = Math.round((style?.borderRadius ?? 4) * scaleFactor);

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        opacity: opacity ?? 1,
        textAlign,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: `${Math.round(8 * scaleFactor)}px`,
          alignItems: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
        }}
      >
        {activeCues.map((cue) => (
          <div key={cue.id} style={{ display: 'inline-block', maxWidth: '95%' }}>
            <span
              style={{
                display: 'inline',
                color: textColor,
                backgroundColor,
                fontSize: `${fontSize}px`,
                fontFamily,
                borderRadius: `${borderRadius}px`,
                padding: `${Math.round(4 * scaleFactor)}px ${Math.round(12 * scaleFactor)}px`,
                lineHeight: 1.45,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone',
                textShadow: '0 0 2px rgba(0, 0, 0, 0.9), 0 2px 4px rgba(0, 0, 0, 0.85)',
                fontWeight: 500,
                letterSpacing: '0.01em',
              }}
            >
              {cue.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
