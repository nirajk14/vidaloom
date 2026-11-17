import { describe, it, expect } from 'vitest';
import { checkMediaSubtitles } from '../src/engine/media/subtitleDetector';

describe('Subtitle Detector', () => {
  it('returns hasSubtitles: false and mediaType: video for video without subtitle tracks', async () => {
    const videoFile = new File(['fake-video-payload'], 'sample.mp4', { type: 'video/mp4' });
    const result = await checkMediaSubtitles(videoFile);

    expect(result.hasSubtitles).toBe(false);
    expect(result.mediaType).toBe('video');
    expect(result.trackCount).toBe(0);
    expect(result.trackNames).toEqual([]);
  });

  it('returns hasSubtitles: false and mediaType: audio for audio files', async () => {
    const mp3File = new File(['fake-audio-payload'], 'song.mp3', { type: 'audio/mpeg' });
    const wavFile = new File(['fake-audio-payload'], 'podcast.wav', { type: 'audio/wav' });

    const mp3Result = await checkMediaSubtitles(mp3File);
    expect(mp3Result.hasSubtitles).toBe(false);
    expect(mp3Result.mediaType).toBe('audio');
    expect(mp3Result.trackCount).toBe(0);

    const wavResult = await checkMediaSubtitles(wavFile);
    expect(wavResult.hasSubtitles).toBe(false);
    expect(wavResult.mediaType).toBe('audio');
  });
});
