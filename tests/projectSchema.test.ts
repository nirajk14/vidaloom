import { describe, it, expect } from 'vitest';
import {
  createDefaultProject,
  validateProject,
  safeValidateProject,
} from '../src/engine/project/projectSchema';
import { VideoLayer, CaptionLayer, VisualizerLayer } from '../src/types/project';

describe('CompositionProject Zod Schema Validation', () => {
  it('creates and validates a default project successfully', () => {
    const project = createDefaultProject('My Test Project');
    const result = safeValidateProject(project);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('My Test Project');
      expect(result.data.version).toBe(1);
      expect(result.data.settings.duration).toBe(10);
      expect(result.data.settings.fps).toBe(30);
      expect(result.data.assets).toEqual([]);
      expect(result.data.layers).toEqual([]);
    }
  });

  it('validates a complete project with video, audio, caption, and visualizer layers', () => {
    const project = createDefaultProject();

    const videoAsset = {
      id: 'asset-video-1',
      name: 'intro.mp4',
      type: 'video' as const,
      mimeType: 'video/mp4',
      size: 1048576,
      duration: 15.5,
      width: 1920,
      height: 1080,
      createdAt: Date.now(),
    };

    const srtAsset = {
      id: 'asset-srt-1',
      name: 'subtitles.srt',
      type: 'subtitle' as const,
      mimeType: 'application/x-subrip',
      size: 512,
      subtitleContent: '1\n00:00:01,000 --> 00:00:04,000\nHello world',
      createdAt: Date.now(),
    };

    project.assets = [videoAsset, srtAsset];

    const videoLayer: VideoLayer = {
      id: 'layer-1',
      name: 'Main Video',
      type: 'video',
      assetId: videoAsset.id,
      startTime: 0,
      endTime: 15.5,
      sourceStartTime: 0,
      volume: 0.8,
      playbackRate: 1,
      zIndex: 0,
      opacity: 1,
      visible: true,
      transform: { x: 0, y: 0, width: 1, height: 1 },
    };

    const captionLayer: CaptionLayer = {
      id: 'layer-2',
      name: 'Captions',
      type: 'caption',
      subtitleAssetId: srtAsset.id,
      startTime: 0,
      endTime: 15.5,
      zIndex: 1,
      opacity: 1,
      visible: true,
      transform: { x: 0.1, y: 0.8, width: 0.8, height: 0.15 },
      style: {
        fontSize: 32,
        fontFamily: 'sans-serif',
        textColor: '#ffffff',
        textAlign: 'center',
      },
    };

    const visualizerLayer: VisualizerLayer = {
      id: 'layer-3',
      name: 'Audio Visualizer',
      type: 'visualizer',
      targetAudioLayerId: videoLayer.id,
      visualizerStyle: 'bars',
      color: '#38bdf8',
      startTime: 0,
      endTime: 15.5,
      zIndex: 2,
      opacity: 0.9,
      visible: true,
      transform: { x: 0.1, y: 0.7, width: 0.8, height: 0.1 },
    };

    project.layers = [videoLayer, captionLayer, visualizerLayer];

    const validated = validateProject(project);
    expect(validated.layers.length).toBe(3);
    expect(validated.assets.length).toBe(2);
  });

  it('rejects malformed project data with negative duration', () => {
    const invalidProject = {
      id: 'proj-1',
      version: 1,
      name: 'Invalid Project',
      settings: {
        width: 1920,
        height: 1080,
        fps: 30,
        duration: -5, // Invalid negative duration
        backgroundColor: '#000000',
      },
      assets: [],
      layers: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const result = safeValidateProject(invalidProject);
    expect(result.success).toBe(false);
  });

  it('rejects video layer missing assetId', () => {
    const invalidProject = createDefaultProject();
    const badLayer = {
      id: 'bad-layer-1',
      name: 'Missing Asset Video',
      type: 'video',
      // missing assetId
      startTime: 0,
      endTime: 5,
      zIndex: 0,
    };

    // @ts-expect-error intentionally invalid layer
    invalidProject.layers.push(badLayer);

    const result = safeValidateProject(invalidProject);
    expect(result.success).toBe(false);
  });

  it('rejects unknown layer types', () => {
    const invalidProject = createDefaultProject();
    const badLayer = {
      id: 'bad-layer-2',
      name: 'Unknown Type',
      type: 'three-d-model',
      startTime: 0,
      endTime: 5,
      zIndex: 0,
    };

    // @ts-expect-error intentionally invalid layer
    invalidProject.layers.push(badLayer);

    const result = safeValidateProject(invalidProject);
    expect(result.success).toBe(false);
  });
});
