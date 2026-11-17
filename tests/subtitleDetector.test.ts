import { describe, it, expect } from 'vitest';
import { checkVideoSubtitles } from '../src/engine/media/subtitleDetector';

describe('Subtitle Detector', () => {
  it('returns hasSubtitles: false for video without subtitle tracks', async () => {
    // Synthetic video file without tracks
    const videoFile = new File(['fake-video-payload'], 'sample.mp4', { type: 'video/mp4' });
    const result = await checkVideoSubtitles(videoFile);

    expect(result.hasSubtitles).toBe(false);
    expect(result.trackCount).toBe(0);
    expect(result.trackNames).toEqual([]);
  });
});
