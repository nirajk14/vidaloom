import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { useProjectStore } from '../../stores/projectStore';
import { assetRegistry } from '../../engine/media/assetRegistry';
import { CaptionCue } from '../../types/caption';
import { CaptionStyle, CaptionLayer } from '../../types/project';
import { parseSubtitles, formatPlayerTime } from '../../engine/subtitles/srtParser';
import { MainComposition, MainCompositionProps } from '../../composition/MainComposition';
import { CaptionStyleControls } from './CaptionStyleControls';

interface RemotionPlayerPreviewProps {
  onBackToSetup: () => void;
}

const RESOLUTION_PRESETS = [
  { label: '1080p (16:9)', width: 1920, height: 1080 },
  { label: '9:16 (Shorts/Reels)', width: 1080, height: 1920 },
  { label: '720p (16:9)', width: 1280, height: 720 },
  { label: 'Square (1:1)', width: 1080, height: 1080 },
];

export const RemotionPlayerPreview: React.FC<RemotionPlayerPreviewProps> = ({
  onBackToSetup,
}) => {
  const playerRef = useRef<PlayerRef>(null);

  const project = useProjectStore((s) => s.project);
  const updateSettings = useProjectStore((s) => s.updateSettings);
  const updateLayer = useProjectStore((s) => s.updateLayer);

  // Primary media asset and subtitle asset
  const mediaAsset = project.assets.find((a) => a.type === 'video' || a.type === 'audio');
  const subtitleAsset = project.assets.find((a) => a.type === 'subtitle');

  // Find caption layer
  const captionLayer = project.layers.find((l): l is CaptionLayer => l.type === 'caption');

  // Map of asset IDs to ObjectURLs from the asset registry
  const assetUrls = useMemo(() => {
    const urls: Record<string, string> = {};
    for (const asset of project.assets) {
      const url = assetRegistry.getUrl(asset.id);
      if (url) {
        urls[asset.id] = url;
      }
    }
    return urls;
  }, [project.assets]);

  // Parse subtitle cues
  const [cues, setCues] = useState<CaptionCue[]>([]);
  useEffect(() => {
    if (subtitleAsset?.subtitleContent) {
      const parsed = parseSubtitles(
        subtitleAsset.subtitleContent,
        subtitleAsset.subtitleFormat
      );
      setCues(parsed);
    } else {
      setCues([]);
    }
  }, [subtitleAsset?.subtitleContent, subtitleAsset?.subtitleFormat]);

  // Caption styling state
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(() => ({
    fontSize: captionLayer?.style?.fontSize ?? 28,
    fontFamily: captionLayer?.style?.fontFamily ?? 'sans-serif',
    textColor: captionLayer?.style?.textColor ?? 'rgba(255, 255, 255, 1)',
    textOpacity: captionLayer?.style?.textOpacity ?? 1,
    backgroundColor: captionLayer?.style?.backgroundColor ?? 'rgba(8, 8, 8, 0.75)',
    backgroundOpacity: captionLayer?.style?.backgroundOpacity ?? 0.75,
    textAlign: captionLayer?.style?.textAlign ?? 'center',
    padding: captionLayer?.style?.padding ?? '4px 8px',
    borderRadius: captionLayer?.style?.borderRadius ?? 4,
  }));

  const handleStyleChange = (updates: Partial<CaptionStyle>) => {
    setCaptionStyle((prev) => {
      const next = { ...prev, ...updates };
      if (captionLayer) {
        updateLayer(captionLayer.id, { style: next });
      }
      return next;
    });
  };

  // Video config calculations
  const fps = project.settings.fps || 30;
  const durationInSeconds = Math.max(
    1,
    mediaAsset?.duration ?? project.settings.duration ?? 10
  );
  const durationInFrames = Math.max(1, Math.round(durationInSeconds * fps));

  const [showCuesDrawer, setShowCuesDrawer] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);

  // Track player frame updates for cue list highlighting
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onFrameUpdate = () => {
      try {
        const frame = player.getCurrentFrame();
        setCurrentFrame(frame);
      } catch {
        // ignore
      }
    };

    const interval = setInterval(onFrameUpdate, 250);
    return () => clearInterval(interval);
  }, []);

  const seekToCue = (startInSeconds: number) => {
    const targetFrame = Math.round(startInSeconds * fps);
    playerRef.current?.seekTo(targetFrame);
  };

  const currentSeconds = currentFrame / fps;

  // Composition props bundle
  const compositionProps: MainCompositionProps = useMemo(
    () => ({
      project,
      assetUrls,
      cues,
      captionStyleOverride: captionStyle,
    }),
    [project, assetUrls, cues, captionStyle]
  );

  return (
    <div className="preview-player-container">
      {/* Top Bar Navigation & Info */}
      <div className="preview-topbar">
        <button className="btn-back" onClick={onBackToSetup}>
          ← Back to Setup
        </button>

        <div className="preview-meta-info">
          <span className="meta-pill media-pill">
            {mediaAsset ? `${mediaAsset.type === 'video' ? '🎬' : '🎵'} ${mediaAsset.name}` : 'Generated Canvas'}
          </span>
          <span className="meta-pill sub-pill">
            💬 {cues.length} Cues
          </span>
          <span className="meta-pill res-pill">
            {project.settings.width}x{project.settings.height} • {fps} FPS
          </span>
        </div>

        <button
          className="btn-drawer-toggle"
          onClick={() => setShowCuesDrawer(!showCuesDrawer)}
        >
          {showCuesDrawer ? 'Hide Cue List' : 'View Cue List'}
        </button>
      </div>

      {/* Composition Settings Bar (Configurable Resolution & FPS) */}
      <div className="composition-settings-strip">
        <div className="strip-group">
          <span className="strip-label">Format / Aspect Ratio:</span>
          <div className="preset-chips">
            {RESOLUTION_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`preset-chip ${
                  project.settings.width === preset.width &&
                  project.settings.height === preset.height
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  updateSettings({
                    width: preset.width,
                    height: preset.height,
                  })
                }
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="strip-group">
          <span className="strip-label">Framerate:</span>
          <div className="preset-chips">
            {[24, 30, 60].map((rate) => (
              <button
                key={rate}
                type="button"
                className={`preset-chip ${project.settings.fps === rate ? 'active' : ''}`}
                onClick={() => updateSettings({ fps: rate })}
              >
                {rate} FPS
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Remotion Player Container */}
      <div className="remotion-player-wrapper">
        <Player
          ref={playerRef}
          component={MainComposition}
          inputProps={compositionProps}
          durationInFrames={durationInFrames}
          fps={fps}
          compositionWidth={project.settings.width}
          compositionHeight={project.settings.height}
          style={{
            width: '100%',
            aspectRatio: `${project.settings.width} / ${project.settings.height}`,
            maxHeight: '560px',
            borderRadius: '10px',
            overflow: 'hidden',
            backgroundColor: project.settings.backgroundColor || '#000000',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7)',
            border: '1px solid #232535',
          }}
          controls
          autoPlay={false}
          loop
        />
      </div>

      {/* Collapsible Cue List Drawer */}
      {showCuesDrawer && (
        <div className="cues-list-drawer">
          <div className="drawer-header">
            <h5>Parsed Subtitle Cues ({cues.length})</h5>
            <small>Click any cue to seek player</small>
          </div>
          <div className="cues-scroll-container">
            {cues.map((cue) => {
              const isActive = currentSeconds >= cue.start && currentSeconds <= cue.end;
              return (
                <div
                  key={cue.id}
                  className={`cue-row ${isActive ? 'active-cue' : ''}`}
                  onClick={() => seekToCue(cue.start)}
                >
                  <span className="cue-timestamp">
                    {formatPlayerTime(cue.start)} → {formatPlayerTime(cue.end)}
                  </span>
                  <span className="cue-text">{cue.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtitle & CC Styling Controls */}
      <CaptionStyleControls
        style={captionStyle}
        onChange={handleStyleChange}
      />
    </div>
  );
};
