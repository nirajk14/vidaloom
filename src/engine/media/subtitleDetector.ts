import { Input, ALL_FORMATS, BlobSource } from 'mediabunny';

export interface MediaSubtitleCheckResult {
  hasSubtitles: boolean;
  trackCount: number;
  trackNames: string[];
  mediaType: 'video' | 'audio';
}

/**
 * Checks whether an uploaded media file (video or audio) contains embedded subtitle tracks.
 * Audio files typically do not contain embedded subtitles.
 * For video, uses Mediabunny container track demuxer with browser HTMLVideoElement textTracks fallback.
 */
export async function checkMediaSubtitles(file: File): Promise<MediaSubtitleCheckResult> {
  const name = file.name.toLowerCase();
  const isAudio =
    file.type.startsWith('audio/') ||
    /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(name);

  if (isAudio) {
    // Audio files do not carry embedded video subtitle tracks
    return {
      hasSubtitles: false,
      trackCount: 0,
      trackNames: [],
      mediaType: 'audio',
    };
  }

  // 1. Try demuxing container tracks with Mediabunny (for video)
  try {
    const input = new Input({
      source: new BlobSource(file),
      formats: ALL_FORMATS,
    });

    const tracks = await input.getTracks();
    const subtitleTracks = tracks.filter((t) => !t.isVideoTrack() && !t.isAudioTrack());

    if (subtitleTracks.length > 0) {
      const trackNames: string[] = [];
      for (const t of subtitleTracks) {
        const trackName = (await t.getName()) || `Track #${t.number ?? t.id}`;
        trackNames.push(trackName);
      }

      return {
        hasSubtitles: true,
        trackCount: subtitleTracks.length,
        trackNames,
        mediaType: 'video',
      };
    }
  } catch {
    // If container format parsing fails or has no container header, continue to browser fallback
  }

  // 2. Browser HTMLVideoElement textTracks check
  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const hasTrack = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          cleanup();
          resolve(false);
        }, 3000);

        const cleanup = () => {
          clearTimeout(timeout);
          video.removeAttribute('src');
          video.load();
        };

        video.onloadedmetadata = () => {
          const count = video.textTracks ? video.textTracks.length : 0;
          cleanup();
          resolve(count > 0);
        };

        video.onerror = () => {
          cleanup();
          resolve(false);
        };

        video.src = url;
      });

      URL.revokeObjectURL(url);

      if (hasTrack) {
        return {
          hasSubtitles: true,
          trackCount: 1,
          trackNames: ['Embedded Text Track'],
          mediaType: 'video',
        };
      }
    } catch {
      // Ignore fallback errors
    }
  }

  return {
    hasSubtitles: false,
    trackCount: 0,
    trackNames: [],
    mediaType: 'video',
  };
}

// Keep backwards-compatible alias
export const checkVideoSubtitles = checkMediaSubtitles;
export type VideoSubtitleCheckResult = MediaSubtitleCheckResult;
