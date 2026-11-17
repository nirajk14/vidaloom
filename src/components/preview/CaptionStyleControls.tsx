import React from 'react';
import { CaptionStyle } from '../../types/project';
import {
  parseColorToRgba,
  formatRgba,
  rgbaToHex,
  alphaToPercentage,
  percentageToAlpha,
  CC_TEXT_PRESETS,
  CC_BACKGROUND_PRESETS,
} from '../../utils/colorUtils';

interface CaptionStyleControlsProps {
  style: CaptionStyle;
  onChange: (updated: Partial<CaptionStyle>) => void;
}

export const CaptionStyleControls: React.FC<CaptionStyleControlsProps> = ({
  style,
  onChange,
}) => {
  // Parsed values for text color & opacity
  const textRgba = parseColorToRgba(style.textColor ?? 'rgba(255, 255, 255, 1)');
  const textOpacity = style.textOpacity ?? textRgba.a;
  const textHex = rgbaToHex(textRgba);
  const textPercent = alphaToPercentage(textOpacity);

  // Parsed values for background color & opacity
  const bgRgba = parseColorToRgba(style.backgroundColor ?? 'rgba(8, 8, 8, 0.75)');
  const bgOpacity = style.backgroundOpacity ?? bgRgba.a;
  const bgHex = rgbaToHex(bgRgba);
  const bgPercent = alphaToPercentage(bgOpacity);

  // Handlers for Text Color
  const handleTextColorChange = (hex: string) => {
    const updated = parseColorToRgba(hex, textOpacity);
    const rgbaStr = formatRgba(updated);
    onChange({ textColor: rgbaStr });
  };

  const handleTextOpacityChange = (percent: number) => {
    const alpha = percentageToAlpha(percent);
    const updated = { ...textRgba, a: alpha };
    onChange({
      textOpacity: alpha,
      textColor: formatRgba(updated),
    });
  };

  const handleTextRgbaManualChange = (rgbaStr: string) => {
    const parsed = parseColorToRgba(rgbaStr);
    onChange({
      textColor: formatRgba(parsed),
      textOpacity: parsed.a,
    });
  };

  // Handlers for Background Color
  const handleBgColorChange = (hex: string) => {
    const updated = parseColorToRgba(hex, bgOpacity);
    const rgbaStr = formatRgba(updated);
    onChange({ backgroundColor: rgbaStr });
  };

  const handleBgOpacityChange = (percent: number) => {
    const alpha = percentageToAlpha(percent);
    const updated = { ...bgRgba, a: alpha };
    onChange({
      backgroundOpacity: alpha,
      backgroundColor: formatRgba(updated),
    });
  };

  const handleBgRgbaManualChange = (rgbaStr: string) => {
    const parsed = parseColorToRgba(rgbaStr);
    onChange({
      backgroundColor: formatRgba(parsed),
      backgroundOpacity: parsed.a,
    });
  };

  return (
    <div className="caption-style-controls">
      <div className="controls-heading">
        <h4>Subtitle & Closed Caption (CC) Styling</h4>
        <span className="controls-hint">Configurable YouTube-style CC with dynamic RGBA & opacity</span>
      </div>

      <div className="styling-grid">
        {/* SECTION 1: CC Text Color & Opacity */}
        <div className="style-card">
          <div className="card-label-row">
            <span className="style-section-title">Caption (CC) Color</span>
            <span className="color-preview-badge" style={{ color: formatRgba({ ...textRgba, a: textOpacity }) }}>
              Sample Text
            </span>
          </div>

          {/* Quick Predefined Presets */}
          <div className="preset-chips">
            {CC_TEXT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`preset-chip ${textHex.toLowerCase() === preset.hex.toLowerCase() ? 'active' : ''}`}
                onClick={() => {
                  onChange({
                    textColor: preset.rgba,
                    textOpacity: 1,
                  });
                }}
              >
                <span className="preset-swatch" style={{ backgroundColor: preset.rgba }} />
                {preset.label}
              </button>
            ))}
          </div>

          {/* Color Picker & Manual RGBA */}
          <div className="color-input-row">
            <input
              type="color"
              value={textHex}
              onChange={(e) => handleTextColorChange(e.target.value)}
              className="native-color-picker"
              title="Pick CC Color"
            />
            <input
              type="text"
              value={formatRgba({ ...textRgba, a: textOpacity })}
              onChange={(e) => handleTextRgbaManualChange(e.target.value)}
              className="rgba-text-input"
              placeholder="rgba(255, 255, 255, 1)"
              title="Manual RGBA string"
            />
          </div>

          {/* Opacity Slider & Percentage Input */}
          <div className="opacity-control-group">
            <div className="opacity-header">
              <span className="opacity-label">Text Opacity</span>
              <div className="percent-input-wrapper">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={textPercent}
                  onChange={(e) => handleTextOpacityChange(parseInt(e.target.value, 10) || 0)}
                  className="percent-input"
                />
                <span className="percent-sign">%</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={textPercent}
              onChange={(e) => handleTextOpacityChange(parseInt(e.target.value, 10))}
              className="opacity-slider"
            />
          </div>
        </div>

        {/* SECTION 2: Background Color & Opacity (YouTube Style) */}
        <div className="style-card">
          <div className="card-label-row">
            <span className="style-section-title">Background Style</span>
            <span
              className="bg-preview-badge"
              style={{
                backgroundColor: formatRgba({ ...bgRgba, a: bgOpacity }),
                color: '#ffffff',
              }}
            >
              Background Preview
            </span>
          </div>

          {/* Quick Predefined Presets */}
          <div className="preset-chips">
            {CC_BACKGROUND_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`preset-chip ${
                  bgHex.toLowerCase() === preset.hex.toLowerCase() &&
                  Math.abs(bgOpacity - preset.opacity) < 0.05
                    ? 'active'
                    : ''
                }`}
                onClick={() => {
                  onChange({
                    backgroundColor: preset.rgba,
                    backgroundOpacity: preset.opacity,
                  });
                }}
              >
                <span className="preset-swatch" style={{ backgroundColor: preset.rgba }} />
                {preset.label}
              </button>
            ))}
          </div>

          {/* Color Picker & Manual RGBA */}
          <div className="color-input-row">
            <input
              type="color"
              value={bgHex}
              onChange={(e) => handleBgColorChange(e.target.value)}
              className="native-color-picker"
              title="Pick Background Color"
            />
            <input
              type="text"
              value={formatRgba({ ...bgRgba, a: bgOpacity })}
              onChange={(e) => handleBgRgbaManualChange(e.target.value)}
              className="rgba-text-input"
              placeholder="rgba(8, 8, 8, 0.75)"
              title="Manual RGBA string"
            />
          </div>

          {/* Opacity Slider & Percentage Input */}
          <div className="opacity-control-group">
            <div className="opacity-header">
              <span className="opacity-label">Background Opacity</span>
              <div className="percent-input-wrapper">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={bgPercent}
                  onChange={(e) => handleBgOpacityChange(parseInt(e.target.value, 10) || 0)}
                  className="percent-input"
                />
                <span className="percent-sign">%</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={bgPercent}
              onChange={(e) => handleBgOpacityChange(parseInt(e.target.value, 10))}
              className="opacity-slider"
            />
          </div>
        </div>
      </div>

      {/* Sizing & Alignment Row */}
      <div className="sizing-row">
        <div className="size-control">
          <label className="size-label">Font Size: {style.fontSize ?? 28}px</label>
          <input
            type="range"
            min="16"
            max="54"
            value={style.fontSize ?? 28}
            onChange={(e) => onChange({ fontSize: parseInt(e.target.value, 10) })}
            className="opacity-slider"
          />
        </div>

        <div className="align-control">
          <label className="size-label">Text Alignment</label>
          <div className="align-buttons">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                type="button"
                className={`align-btn ${(style.textAlign || 'center') === align ? 'active' : ''}`}
                onClick={() => onChange({ textAlign: align })}
              >
                {align.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
