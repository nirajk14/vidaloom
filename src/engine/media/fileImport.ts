import { Asset, AssetType } from '../../types/project';
import { assetRegistry } from './assetRegistry';

export interface FileImportResult {
  asset: Asset;
  objectUrl: string;
}

export type SubtitleFormat = 'srt' | 'vtt' | 'ass' | 'ssa' | 'lrc' | 'sub';

export interface SubtitleMetadata {
  content: string;
  format: SubtitleFormat;
  cueCount: number;
}

/**
 * Validates file extension and mime type to determine AssetType.
 */
export function detectAssetType(file: File): AssetType {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();

  // Subtitles / Lyrics
  if (
    name.endsWith('.srt') ||
    name.endsWith('.vtt') ||
    name.endsWith('.ass') ||
    name.endsWith('.ssa') ||
    name.endsWith('.lrc') ||
    name.endsWith('.sub') ||
    mime === 'application/x-subrip' ||
    mime === 'text/vtt' ||
    mime === 'text/x-ssa' ||
    mime === 'text/x-ass'
  ) {
    return 'subtitle';
  }

  // Video
  if (
    name.endsWith('.mp4') ||
    name.endsWith('.webm') ||
    name.endsWith('.mov') ||
    name.endsWith('.mkv') ||
    name.endsWith('.avi') ||
    mime.startsWith('video/')
  ) {
    return 'video';
  }

  // Audio
  if (
    name.endsWith('.mp3') ||
    name.endsWith('.wav') ||
    name.endsWith('.ogg') ||
    name.endsWith('.m4a') ||
    name.endsWith('.aac') ||
    name.endsWith('.flac') ||
    mime.startsWith('audio/')
  ) {
    return 'audio';
  }

  throw new Error(
    `Unsupported file format for "${file.name}". Supported formats are: Video (MP4, WebM, MOV), Audio (MP3, WAV, OGG, AAC, FLAC), Subtitles/Lyrics (.srt, .vtt, .ass, .lrc, .sub).`
  );
}

/**
 * Extracts metadata (duration, width, height) from a video file.
 */
function extractVideoMetadata(
  objectUrl: string
): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      resolve({ duration: 10, width: 1920, height: 1080 });
      return;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out reading video metadata. File may be corrupted.'));
    }, 10000);

    const cleanup = () => {
      clearTimeout(timeout);
      video.removeAttribute('src');
      video.load();
    };

    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const width = video.videoWidth || 1920;
      const height = video.videoHeight || 1080;
      cleanup();
      resolve({ duration, width, height });
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to decode video file. Format may not be supported by your browser.'));
    };

    video.src = objectUrl;
  });
}

/**
 * Extracts duration from an audio file.
 */
function extractAudioMetadata(objectUrl: string): Promise<{ duration: number }> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      resolve({ duration: 10 });
      return;
    }

    const audio = document.createElement('audio');
    audio.preload = 'metadata';

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out reading audio metadata. File may be corrupted.'));
    }, 10000);

    const cleanup = () => {
      clearTimeout(timeout);
      audio.removeAttribute('src');
      audio.load();
    };

    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      cleanup();
      resolve({ duration });
    };

    audio.onerror = () => {
      cleanup();
      reject(new Error('Failed to decode audio file. Format may not be supported by your browser.'));
    };

    audio.src = objectUrl;
  });
}

/**
 * Validates and reads various subtitle and lyric formats (.srt, .vtt, .ass, .ssa, .lrc, .sub).
 */
export async function extractSubtitleData(file: File): Promise<SubtitleMetadata> {
  const text = await file.text();
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error(`The subtitle file "${file.name}" is empty.`);
  }

  const name = file.name.toLowerCase();

  // 1. WebVTT (.vtt)
  if (name.endsWith('.vtt') || trimmed.startsWith('WEBVTT')) {
    if (!trimmed.includes('-->') && !trimmed.startsWith('WEBVTT')) {
      throw new Error(`Invalid WebVTT format in "${file.name}". Expected "WEBVTT" header or cue timestamps.`);
    }
    const cueCount = Math.max(1, trimmed.split('-->').length - 1);
    return { content: trimmed, format: 'vtt', cueCount };
  }

  // 2. SubStation Alpha (.ass / .ssa)
  if (name.endsWith('.ass') || name.endsWith('.ssa') || trimmed.includes('[Events]') || trimmed.includes('[Script Info]')) {
    const dialogueLines = trimmed.split('\n').filter((l) => l.trim().startsWith('Dialogue:'));
    const cueCount = dialogueLines.length > 0 ? dialogueLines.length : 1;
    return { content: trimmed, format: name.endsWith('.ssa') ? 'ssa' : 'ass', cueCount };
  }

  // 3. LRC Lyrics (.lrc)
  if (name.endsWith('.lrc') || /\[\d{2}:\d{2}/.test(trimmed)) {
    const lyricMatches = trimmed.match(/\[\d{2}:\d{2}/g);
    const cueCount = lyricMatches ? lyricMatches.length : 1;
    return { content: trimmed, format: 'lrc', cueCount };
  }

  // 4. MicroDVD / SubViewer (.sub)
  if (name.endsWith('.sub') || /\{(\d+)\}\{(\d+)\}/.test(trimmed)) {
    const subMatches = trimmed.match(/\{(\d+)\}\{(\d+)\}/g) || trimmed.split('-->');
    const cueCount = Math.max(1, subMatches.length - 1 || 1);
    return { content: trimmed, format: 'sub', cueCount };
  }

  // 5. Default: SubRip (.srt)
  if (!trimmed.includes('-->')) {
    throw new Error(
      `Invalid subtitle format in "${file.name}". Expected timestamp markers (such as "00:00:01,000 --> 00:00:04,000" or "[00:15.00]").`
    );
  }

  const cueCount = Math.max(1, trimmed.split('-->').length - 1);
  return { content: trimmed, format: 'srt', cueCount };
}

/**
 * Imports a local browser File, extracts its metadata, assigns a stable ID,
 * creates an object URL, and registers it in the asset registry.
 */
export async function importFile(file: File): Promise<FileImportResult> {
  if (!file || file.size === 0) {
    throw new Error(`File "${file?.name ?? 'unknown'}" is empty (0 bytes).`);
  }

  const assetType = detectAssetType(file);
  const stableId = crypto.randomUUID();
  const objectUrl = typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(file) : '';

  try {
    let duration: number | undefined;
    let width: number | undefined;
    let height: number | undefined;
    let subtitleContent: string | undefined;
    let subtitleFormat: SubtitleFormat | undefined;
    let subtitleCueCount: number | undefined;

    if (assetType === 'video') {
      const meta = await extractVideoMetadata(objectUrl);
      duration = meta.duration;
      width = meta.width;
      height = meta.height;
    } else if (assetType === 'audio') {
      const meta = await extractAudioMetadata(objectUrl);
      duration = meta.duration;
    } else if (assetType === 'subtitle') {
      const sub = await extractSubtitleData(file);
      subtitleContent = sub.content;
      subtitleFormat = sub.format;
      subtitleCueCount = sub.cueCount;
    }

    const asset: Asset = {
      id: stableId,
      name: file.name,
      type: assetType,
      mimeType: file.type || (assetType === 'subtitle' ? 'text/plain' : 'application/octet-stream'),
      size: file.size,
      duration,
      width,
      height,
      subtitleContent,
      subtitleFormat,
      subtitleCueCount,
      createdAt: Date.now(),
    };

    assetRegistry.register(asset, file, objectUrl);

    return { asset, objectUrl };
  } catch (error) {
    // If metadata extraction fails, revoke the temporary object URL immediately
    if (objectUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
      URL.revokeObjectURL(objectUrl);
    }
    throw error;
  }
}
