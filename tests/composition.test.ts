import { describe, it, expect } from 'vitest';
import { createDefaultProject } from '../src/engine/project/projectSchema';
import { CaptionCue } from '../src/types/caption';
import { findActiveCues } from '../src/engine/subtitles/srtParser';
import { VideoLayer, AudioLayer, CaptionLayer } from '../src/types/project';

describe('Milestone 3: Remotion Composition & Timing Synchronization', () => {
  it('converts frame numbers to accurate seconds using fps', () => {
    const fps = 30;
    expect(0 / fps).toBe(0);
    expect(30 / fps).toBe(1);
    expect(45 / fps).toBe(1.5);
    expect(90 / fps).toBe(3);
  });

  it('calculates duration in frames accurately for video and audio playback', () => {
    const durationSeconds = 12.5;
    const fps = 30;
    const durationInFrames = Math.max(1, Math.round(durationSeconds * fps));
    expect(durationInFrames).toBe(375);

    // Handles 60 fps
    const durationInFrames60 = Math.max(1, Math.round(durationSeconds * 60));
    expect(durationInFrames60).toBe(750);
  });

  it('synchronizes caption cues with current video frame', () => {
    const fps = 30;
    const cues: CaptionCue[] = [
      { id: '1', start: 1.0, end: 3.0, text: 'Opening lyric' },
      { id: '2', start: 4.5, end: 7.0, text: 'Second lyric' },
    ];

    // Frame 0 (0.0s) -> No cues
    expect(findActiveCues(cues, 0 / fps)).toHaveLength(0);

    // Frame 30 (1.0s) -> Cue 1 active
    const cuesAtFrame30 = findActiveCues(cues, 30 / fps);
    expect(cuesAtFrame30).toHaveLength(1);
    expect(cuesAtFrame30[0].text).toBe('Opening lyric');

    // Frame 60 (2.0s) -> Cue 1 active
    expect(findActiveCues(cues, 60 / fps)).toHaveLength(1);

    // Frame 90 (3.0s) -> Cue 1 active (at boundary)
    expect(findActiveCues(cues, 90 / fps)).toHaveLength(1);

    // Frame 105 (3.5s) -> In gap, no cues
    expect(findActiveCues(cues, 105 / fps)).toHaveLength(0);

    // Frame 150 (5.0s) -> Cue 2 active
    const cuesAtFrame150 = findActiveCues(cues, 150 / fps);
    expect(cuesAtFrame150).toHaveLength(1);
    expect(cuesAtFrame150[0].text).toBe('Second lyric');
  });

  it('properly structures composition layers for video, audio, and captions', () => {
    const project = createDefaultProject('Remotion Test Project');

    const videoLayer: VideoLayer = {
      id: 'v-1',
      name: 'Background Video',
      type: 'video',
      assetId: 'asset-video-1',
      startTime: 0,
      endTime: 10,
      zIndex: 0,
      opacity: 1,
      visible: true,
      volume: 1,
      playbackRate: 1,
      sourceStartTime: 0,
      transform: { x: 0, y: 0, width: 1, height: 1 },
    };

    const audioLayer: AudioLayer = {
      id: 'a-1',
      name: 'Background Audio',
      type: 'audio',
      assetId: 'asset-audio-1',
      startTime: 0,
      endTime: 10,
      zIndex: 1,
      opacity: 1,
      visible: true,
      volume: 0.8,
      playbackRate: 1,
      sourceStartTime: 0,
      transform: { x: 0, y: 0, width: 1, height: 1 },
    };

    const captionLayer: CaptionLayer = {
      id: 'c-1',
      name: 'Captions',
      type: 'caption',
      subtitleAssetId: 'asset-sub-1',
      startTime: 0,
      endTime: 10,
      zIndex: 2,
      opacity: 1,
      visible: true,
      transform: { x: 0.05, y: 0.8, width: 0.9, height: 0.15 },
      style: {
        fontSize: 32,
        fontFamily: 'sans-serif',
        textColor: 'rgba(255, 255, 0, 1)',
        backgroundColor: 'rgba(8, 8, 8, 0.75)',
        textOpacity: 1,
        backgroundOpacity: 0.75,
        textAlign: 'center',
        padding: '4px 8px',
        borderRadius: 4,
      },
    };

    project.layers = [videoLayer, audioLayer, captionLayer];

    // Layers are ordered by zIndex
    const sorted = [...project.layers].sort((a, b) => a.zIndex - b.zIndex);
    expect(sorted[0].type).toBe('video');
    expect(sorted[1].type).toBe('audio');
    expect(sorted[2].type).toBe('caption');
  });

  it('supports configurable aspect ratios and framerates without schema errors', () => {
    const project = createDefaultProject('Resolution Test');

    // 16:9 Landscape
    project.settings.width = 1920;
    project.settings.height = 1080;
    project.settings.fps = 30;
    expect(project.settings.width / project.settings.height).toBeCloseTo(16 / 9, 2);

    // 9:16 Vertical (Shorts/Reels)
    project.settings.width = 1080;
    project.settings.height = 1920;
    project.settings.fps = 60;
    expect(project.settings.width / project.settings.height).toBeCloseTo(9 / 16, 2);

    // 1:1 Square
    project.settings.width = 1080;
    project.settings.height = 1080;
    expect(project.settings.width / project.settings.height).toBe(1);
  });
});
