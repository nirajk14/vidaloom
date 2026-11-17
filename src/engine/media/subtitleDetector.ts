import { Input, ALL_FORMATS, BlobSource } from 'mediabunny';

export interface VideoSubtitleCheckResult {
  hasSubtitles: boolean;
  trackCount: number;
  trackNames: string[];
}

/**
 * Checks whether an uploaded video file contains embedded subtitle tracks.
 * Uses Mediabunny's container track demuxer with browser HTMLVideoElement textTracks fallback.
 */
export async function checkVideoSubtitles(file: File): Promise<VideoSubtitleCheckResult> {
  // 1. Try demuxing container tracks with Mediabunny
  try {
    const input = new Input({
      source: new BlobSource(file),
      formats: ALL_FORMATS,
    });

    const tracks = await input.getTracks();
    // Subtitle tracks in containers like MP4/MKV/WebM are neither video nor audio
    const subtitleTracks = tracks.filter((t) => !t.isVideoTrack() && !t.isAudioTrack());

    if (subtitleTracks.length > 0) {
      const trackNames: string[] = [];
      for (const t of subtitleTracks) {
        const name = (await t.getName()) || `Track #${t.number ?? t.id}`;
        trackNames.push(name);
      }

      return {
        hasSubtitles: true,
        trackCount: subtitleTracks.length,
        trackNames,
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
  };
}
