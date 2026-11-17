import { describe, it, expect, vi } from 'vitest';
import { detectAssetType, importFile } from '../src/engine/media/fileImport';

describe('File Import & Detection', () => {
  it('correctly detects video, audio, and subtitle files', () => {
    const mp4File = new File(['fake-data'], 'clip.mp4', { type: 'video/mp4' });
    const wavFile = new File(['fake-data'], 'track.wav', { type: 'audio/wav' });
    const mp3File = new File(['fake-data'], 'music.mp3', { type: 'audio/mpeg' });
    const srtFile = new File(['fake-data'], 'subs.srt', { type: 'text/plain' });

    expect(detectAssetType(mp4File)).toBe('video');
    expect(detectAssetType(wavFile)).toBe('audio');
    expect(detectAssetType(mp3File)).toBe('audio');
    expect(detectAssetType(srtFile)).toBe('subtitle');
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
    expect(result.asset.name).toBe('dialogue.srt');
    expect(result.asset.id).toBeDefined();
    expect(result.asset.subtitleContent).toContain('Hello and welcome to VidaLoom!');
    expect(result.asset.size).toBe(srtFile.size);

    createUrlSpy.mockRestore();
  });

  it('rejects invalid or malformed SRT subtitle files without timestamps', async () => {
    const invalidSrt = `Just some random text without any SRT timestamps.`;
    const srtFile = new File([invalidSrt], 'broken.srt', { type: 'text/plain' });

    await expect(importFile(srtFile)).rejects.toThrowError(/Invalid SRT subtitle format/);
  });
});
