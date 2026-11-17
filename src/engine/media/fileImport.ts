import { Asset, AssetType } from '../../types/project';
import { assetRegistry } from './assetRegistry';

export interface FileImportResult {
  asset: Asset;
  objectUrl: string;
}

/**
 * Validates file extension and mime type to determine AssetType.
 */
export function detectAssetType(file: File): AssetType {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();

  // Subtitles
  if (name.endsWith('.srt') || mime === 'application/x-subrip') {
    return 'subtitle';
  }

  // Video
  if (
    name.endsWith('.mp4') ||
    name.endsWith('.webm') ||
    name.endsWith('.mov') ||
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
    mime.startsWith('audio/')
  ) {
    return 'audio';
  }

  throw new Error(
    `Unsupported file format for "${file.name}". Supported formats are: Video (MP4, WebM), Audio (MP3, WAV, OGG), Subtitles (.srt).`
  );
}

/**
 * Extracts metadata (duration, width, height) from a video file.
 */
function extractVideoMetadata(
  objectUrl: string
): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    // If not in a browser environment (e.g. Node tests without DOM)
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
 * Validates and reads an SRT subtitle file.
 */
async function extractSubtitleContent(file: File): Promise<string> {
  const text = await file.text();
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error(`The subtitle file "${file.name}" is empty.`);
  }

  // Basic sanity check for SRT format: contains timestamp arrow "-->"
  if (!trimmed.includes('-->')) {
    throw new Error(
      `Invalid SRT subtitle format in "${file.name}". Expected timestamps formatted like "00:00:01,000 --> 00:00:04,000".`
    );
  }

  return trimmed;
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

    if (assetType === 'video') {
      const meta = await extractVideoMetadata(objectUrl);
      duration = meta.duration;
      width = meta.width;
      height = meta.height;
    } else if (assetType === 'audio') {
      const meta = await extractAudioMetadata(objectUrl);
      duration = meta.duration;
    } else if (assetType === 'subtitle') {
      subtitleContent = await extractSubtitleContent(file);
    }

    const asset: Asset = {
      id: stableId,
      name: file.name,
      type: assetType,
      mimeType: file.type || (assetType === 'subtitle' ? 'application/x-subrip' : 'application/octet-stream'),
      size: file.size,
      duration,
      width,
      height,
      subtitleContent,
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
