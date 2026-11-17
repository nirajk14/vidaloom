import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { CaptionCue } from '../../types/caption';
import { CaptionStyle, CaptionLayer } from '../../types/project';
import { parseSubtitles, formatPlayerTime } from '../../engine/subtitles/srtParser';
import { CaptionDisplay } from './CaptionDisplay';
import { CaptionStyleControls } from './CaptionStyleControls';

interface PreviewPlayerProps {
  onBackToSetup: () => void;
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({ onBackToSetup }) => {
  const project = useProjectStore((s) => s.project);
  const updateLayer = useProjectStore((s) => s.updateLayer);

  // Find media asset (video or audio) and subtitle asset
  const mediaAsset = project.assets.find((a) => a.type === 'video' || a.type === 'audio');
  const subtitleAsset = project.assets.find((a) => a.type === 'subtitle');

  // Find caption layer in composition
  const captionLayer = project.layers.find((l): l is CaptionLayer => l.type === 'caption');

  // Current composition duration
  const duration = Math.max(
    1,
    mediaAsset?.duration ?? project.settings.duration ?? 30
  );

  // Parse subtitle cues from asset
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

  // Player state
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [showCuesDrawer, setShowCuesDrawer] = useState(false);

  // Local caption style state initialized from project caption layer
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

  // Update caption style and sync to store
  const handleStyleChange = (updates: Partial<CaptionStyle>) => {
    setCaptionStyle((prev) => {
      const next = { ...prev, ...updates };
      if (captionLayer) {
        updateLayer(captionLayer.id, { style: next });
      }
      return next;
    });
  };

  // Playback animation frame loop
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const tick = useCallback(
    (now: number) => {
      if (lastTimeRef.current !== null) {
        const deltaSeconds = ((now - lastTimeRef.current) / 1000) * playbackRate;
        setCurrentTime((prev) => {
          const next = prev + deltaSeconds;
          if (next >= duration) {
            if (isLooping) {
              return 0;
            }
            setIsPlaying(false);
            return duration;
          }
          return next;
        });
      }
      lastTimeRef.current = now;
      animFrameRef.current = requestAnimationFrame(tick);
    },
    [duration, playbackRate, isLooping]
  );

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      animFrameRef.current = requestAnimationFrame(tick);
    } else {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimeRef.current = null;
    }

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, tick]);

  const togglePlay = useCallback(() => {
    setCurrentTime((curr) => {
      if (curr >= duration) {
        return 0;
      }
      return curr;
    });
    setIsPlaying((p) => !p);
  }, [duration]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
  };

  const skipSeconds = useCallback((seconds: number) => {
    setCurrentTime((t) => Math.max(0, Math.min(duration, t + seconds)));
  }, [duration]);

  // Keyboard shortcut: spacebar to play/pause
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        skipSeconds(-5);
      } else if (e.code === 'ArrowRight') {
        skipSeconds(5);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [skipSeconds, togglePlay]);

  return (
    <div className="preview-player-container">
      {/* Top Bar Navigation */}
      <div className="preview-topbar">
        <button className="btn-back" onClick={onBackToSetup}>
          ← Back to Setup
        </button>

        <div className="preview-meta-info">
          <span className="meta-pill media-pill">
            {mediaAsset ? `${mediaAsset.type === 'video' ? '🎬' : '🎵'} ${mediaAsset.name}` : 'Empty Composition'}
          </span>
          <span className="meta-pill sub-pill">
            💬 {cues.length} Cues Parsed
          </span>
        </div>

        <button
          className="btn-drawer-toggle"
          onClick={() => setShowCuesDrawer(!showCuesDrawer)}
        >
          {showCuesDrawer ? 'Hide Cues' : 'View Cue List'}
        </button>
      </div>

      {/* Main Video Canvas Screen (Black background per requirement) */}
      <div className="video-player-screen" onClick={togglePlay}>
        <div className="screen-aspect-frame">
          {/* Visual Indicator of black video background */}
          <div className="black-canvas-content">
            <div className="canvas-watermark">
              <span>VidaLoom Player Preview</span>
              <small>Black canvas background (Video/Audio decoding untouched in Milestone 2)</small>
            </div>
          </div>

          {/* Subtitle Display (Positioned at bottom, YouTube style) */}
          <CaptionDisplay
            cues={cues}
            currentTime={currentTime}
            style={captionStyle}
          />

          {/* Play/Pause Overlay indicator */}
          {!isPlaying && (
            <div className="play-overlay-pill">
              <span>▶ Click or Press Space to Play</span>
            </div>
          )}
        </div>
      </div>

      {/* Video Player Scrubber & Controls */}
      <div className="player-controls-bar">
        {/* Scrubber / Seek Bar */}
        <div className="scrubber-row">
          <input
            type="range"
            min="0"
            max={duration}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="seek-slider"
            style={{
              background: `linear-gradient(to right, #6366f1 ${(currentTime / duration) * 100}%, #2d3142 ${(currentTime / duration) * 100}%)`,
            }}
          />
        </div>

        {/* Buttons and Time Row */}
        <div className="controls-button-row">
          <div className="controls-left">
            <button
              className="btn-ctrl btn-play"
              onClick={togglePlay}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            <button
              className="btn-ctrl"
              onClick={() => skipSeconds(-5)}
              title="Rewind 5s (←)"
            >
              ↺ 5s
            </button>

            <button
              className="btn-ctrl"
              onClick={() => skipSeconds(5)}
              title="Fast Forward 5s (→)"
            >
              5s ↻
            </button>

            <div className="time-display">
              <span className="current-time">{formatPlayerTime(currentTime)}</span>
              <span className="time-sep">/</span>
              <span className="total-time">{formatPlayerTime(duration)}</span>
            </div>
          </div>

          <div className="controls-right">
            <button
              className={`btn-ctrl ${isLooping ? 'active' : ''}`}
              onClick={() => setIsLooping(!isLooping)}
              title="Toggle Loop"
            >
              🔁 Loop
            </button>

            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="rate-select"
              title="Playback Speed"
            >
              <option value="0.5">0.5x</option>
              <option value="1">1.0x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>
          </div>
        </div>
      </div>

      {/* Collapsible Cue List Drawer */}
      {showCuesDrawer && (
        <div className="cues-list-drawer">
          <div className="drawer-header">
            <h5>Parsed Subtitle Cues ({cues.length})</h5>
            <small>Click any cue to seek player to that timestamp</small>
          </div>
          <div className="cues-scroll-container">
            {cues.map((cue) => {
              const isActive = currentTime >= cue.start && currentTime <= cue.end;
              return (
                <div
                  key={cue.id}
                  className={`cue-row ${isActive ? 'active-cue' : ''}`}
                  onClick={() => setCurrentTime(cue.start)}
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

      {/* Subtitle Customization Controls (YouTube Style, RGBA, Opacity) */}
      <CaptionStyleControls
        style={captionStyle}
        onChange={handleStyleChange}
      />
    </div>
  );
};
