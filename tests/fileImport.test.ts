import { describe, it, expect, vi } from 'vitest';
import { detectAssetType, importFile } from '../src/engine/media/fileImport';

describe('File Import & Detection', () => {
  it('correctly detects video, audio, and various subtitle files', () => {
    const mp4File = new File(['fake-data'], 'clip.mp4', { type: 'video/mp4' });
    const wavFile = new File(['fake-data'], 'track.wav', { type: 'audio/wav' });
    const mp3File = new File(['fake-data'], 'music.mp3', { type: 'audio/mpeg' });
    const flacFile = new File(['fake-data'], 'song.flac', { type: 'audio/flac' });
    const srtFile = new File(['fake-data'], 'subs.srt', { type: 'text/plain' });
    const vttFile = new File(['fake-data'], 'caption.vtt', { type: 'text/vtt' });
    const assFile = new File(['fake-data'], 'anime.ass', { type: 'text/plain' });
    const lrcFile = new File(['fake-data'], 'lyrics.lrc', { type: 'text/plain' });

    expect(detectAssetType(mp4File)).toBe('video');
    expect(detectAssetType(wavFile)).toBe('audio');
    expect(detectAssetType(mp3File)).toBe('audio');
    expect(detectAssetType(flacFile)).toBe('audio');
    expect(detectAssetType(srtFile)).toBe('subtitle');
    expect(detectAssetType(vttFile)).toBe('subtitle');
    expect(detectAssetType(assFile)).toBe('subtitle');
    expect(detectAssetType(lrcFile)).toBe('subtitle');
  });

  it('rejects unsupported file formats with an actionable error message', () => {
    const pdfFile = new File(['fake-data'], 'document.pdf', { type: 'application/pdf' });
    const exeFile = new File(['fake-data'], 'malware.exe', { type: 'application/x-msdownload' });

    expect(() => detectAssetType(pdfFile)).toThrowError(/Unsupported file format/);
    expect(() => detectAssetType(exeFile)).toThrowError(/Unsupported file format/);
  });

  it('rejects empty (0 byte) files with useful error', async () => {
    const emptyFile = new File([], 'empty.mp3', { type: 'audio/mpeg' });
    await expect(importFile(emptyFile)).rejects.toThrowError(/empty \(0 bytes\)/);
  });

  it('imports valid SRT subtitle file and stores its content and metadata', async () => {
    const validSrt = `1\n00:00:01,000 --> 00:00:03,500\nHello and welcome to VidaLoom!\n\n2\n00:00:04,000 --> 00:00:07,000\nLocal-first video composition.`;
    const srtFile = new File([validSrt], 'dialogue.srt', { type: 'text/plain' });

    const createUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url-srt');

    const result = await importFile(srtFile);

    expect(result.asset.type).toBe('subtitle');
    expect(result.asset.subtitleFormat).toBe('srt');
    expect(result.asset.name).toBe('dialogue.srt');
    expect(result.asset.subtitleCueCount).toBe(2);
    expect(result.asset.subtitleContent).toContain('Hello and welcome to VidaLoom!');

    createUrlSpy.mockRestore();
  });

  it('imports valid WebVTT (.vtt) file and stores metadata', async () => {
    const validVtt = `WEBVTT\n\n00:00.500 --> 00:03.000\nWebVTT subtitle line\n\n00:03.500 --> 00:06.000\nSecond cue`;
    const vttFile = new File([validVtt], 'subtitles.vtt', { type: 'text/vtt' });

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url-vtt');
    const result = await importFile(vttFile);

    expect(result.asset.type).toBe('subtitle');
    expect(result.asset.subtitleFormat).toBe('vtt');
    expect(result.asset.subtitleCueCount).toBe(2);
  });

  it('imports valid SubStation Alpha (.ass) file', async () => {
    const validAss = `[Script Info]\nTitle: Test\n[Events]\nFormat: Layer, Start, End, Style, Text\nDialogue: 0,0:00:01.00,0:00:04.00,Default,Hello ASS subtitle`;
    const assFile = new File([validAss], 'subtitles.ass', { type: 'text/plain' });

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url-ass');
    const result = await importFile(assFile);

    expect(result.asset.type).toBe('subtitle');
    expect(result.asset.subtitleFormat).toBe('ass');
    expect(result.asset.subtitleCueCount).toBe(1);
  });

  it('imports valid Lyrics (.lrc) file', async () => {
    const validLrc = `[00:12.00]First line of song\n[00:18.50]Second line of song\n[00:25.00]Chorus`;
    const lrcFile = new File([validLrc], 'song.lrc', { type: 'text/plain' });

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url-lrc');
    const result = await importFile(lrcFile);

    expect(result.asset.type).toBe('subtitle');
    expect(result.asset.subtitleFormat).toBe('lrc');
    expect(result.asset.subtitleCueCount).toBe(3);
  });

  it('rejects invalid or malformed subtitle files without timestamps', async () => {
    const invalidSrt = `Just some random text without any timestamps.`;
    const srtFile = new File([invalidSrt], 'broken.srt', { type: 'text/plain' });

    await expect(importFile(srtFile)).rejects.toThrowError(/Invalid subtitle format/);
  });
});
