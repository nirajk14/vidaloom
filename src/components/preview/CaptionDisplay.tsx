import React from 'react';
import { CaptionCue } from '../../types/caption';
import { CaptionStyle } from '../../types/project';
import { applyOpacityToColor } from '../../utils/colorUtils';
import { findActiveCues } from '../../engine/subtitles/srtParser';

interface CaptionDisplayProps {
  cues: CaptionCue[];
  currentTime: number;
  style?: CaptionStyle;
}

export const CaptionDisplay: React.FC<CaptionDisplayProps> = ({
  cues,
  currentTime,
  style,
}) => {
  const activeCues = findActiveCues(cues, currentTime);

  if (activeCues.length === 0) {
    return null;
  }

  // Derive active colors with their configured opacities
  const textColor = applyOpacityToColor(
    style?.textColor ?? 'rgba(255, 255, 255, 1)',
    style?.textOpacity ?? 1
  );

  const backgroundColor = applyOpacityToColor(
    style?.backgroundColor ?? 'rgba(8, 8, 8, 0.75)',
    style?.backgroundOpacity ?? 0.75
  );

  const fontSize = style?.fontSize ?? 28;
  const fontFamily = style?.fontFamily ?? 'system-ui, sans-serif';
  const textAlign = style?.textAlign ?? 'center';

  return (
    <div
      className="caption-overlay-container"
      style={{
        textAlign,
      }}
    >
      <div className="caption-cues-wrapper">
        {activeCues.map((cue) => (
          <div key={cue.id} className="caption-cue-line">
            <span
              className="youtube-caption-box"
              style={{
                color: textColor,
                backgroundColor,
                fontSize: `${fontSize}px`,
                fontFamily,
                borderRadius: `${style?.borderRadius ?? 4}px`,
                padding: style?.padding ?? '4px 8px',
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
