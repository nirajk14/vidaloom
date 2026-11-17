import { CaptionCue } from '../../types/caption';

/**
 * Parses a timestamp string formatted like "00:01:23,456" or "01:23.456" into seconds.
 */
export function parseTimestamp(timeStr: string): number {
  if (!timeStr) return 0;

  // Replace comma with dot (SRT uses commas, VTT uses dots)
  const cleanStr = timeStr.trim().replace(',', '.');
  const parts = cleanStr.split(':');

  if (parts.length === 3) {
    // HH:MM:SS.mmm
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) {
      return 0;
    }
    return hours * 3600 + minutes * 60 + seconds;
  }

  if (parts.length === 2) {
    // MM:SS.mmm
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    if (Number.isNaN(minutes) || Number.isNaN(seconds)) {
      return 0;
    }
    return minutes * 60 + seconds;
  }

  const seconds = parseFloat(cleanStr);
  return Number.isNaN(seconds) ? 0 : seconds;
}

/**
 * Formats a duration in seconds to "MM:SS" or "HH:MM:SS"
 */
export function formatPlayerTime(seconds: number): string {
  if (Number.isNaN(seconds) || seconds < 0) return '00:00';
  const totalSeconds = Math.floor(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Strips HTML formatting tags like <i>, <b>, <font color="..."> from subtitle text.
 */
function cleanSubtitleText(text: string): string {
  return text
    .replace(/<[^>]+>/g, '') // remove HTML tags
    .replace(/\{[^}]+\}/g, '') // remove ASS style tags like {\an8}
    .trim();
}

/**
 * Parses an SRT subtitle string into an array of CaptionCues.
 */
export function parseSrt(srtContent: string): CaptionCue[] {
  if (!srtContent || typeof srtContent !== 'string') {
    return [];
  }

  // Remove BOM and normalize line endings
  const normalized = srtContent.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into raw blocks by two or more consecutive newlines
  const rawBlocks = normalized.split(/\n\s*\n/);
  const cues: CaptionCue[] = [];

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i].trim();
    if (!block) continue;

    const lines = block.split('\n').map((l) => l.trim());
    if (lines.length < 2) continue;

    // Line 0 is usually the index number, but some SRTs omit it and start directly with timestamp
    let timeLineIndex = -1;
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      if (lines[lineIdx].includes('-->')) {
        timeLineIndex = lineIdx;
        break;
      }
    }

    if (timeLineIndex === -1) continue;

    const timeLine = lines[timeLineIndex];
    const timeParts = timeLine.split('-->');
    if (timeParts.length !== 2) continue;

    const startTime = parseTimestamp(timeParts[0]);
    // The end timestamp can have trailing coordinate metadata in some formats (e.g. X1:0 Y1:0)
    const endRaw = timeParts[1].trim().split(/\s+/)[0];
    const endTime = parseTimestamp(endRaw);

    // Skip cues with invalid or reversed timestamps
    if (endTime <= startTime || Number.isNaN(startTime) || Number.isNaN(endTime)) {
      continue;
    }

    // Text lines are everything after the timeLineIndex
    const textLines = lines.slice(timeLineIndex + 1);
    const rawText = textLines.join('\n');
    const cleanedText = cleanSubtitleText(rawText);

    if (!cleanedText) continue;

    // Use cue index if available, or fall back to auto-generated index
    const cueId = timeLineIndex > 0 && lines[0] ? lines[0] : `cue-${cues.length + 1}`;

    cues.push({
      id: cueId,
      start: Math.round(startTime * 1000) / 1000,
      end: Math.round(endTime * 1000) / 1000,
      text: cleanedText,
    });
  }

  return cues;
}

/**
 * Parses WebVTT content into CaptionCues.
 */
export function parseVtt(vttContent: string): CaptionCue[] {
  // WebVTT uses the same block/timestamp structure with "WEBVTT" header
  const cleaned = vttContent.replace(/^WEBVTT[^\n]*\n+/i, '');
  return parseSrt(cleaned);
}

/**
 * Parses LRC synchronized lyrics into CaptionCues.
 */
export function parseLrc(lrcContent: string): CaptionCue[] {
  if (!lrcContent) return [];
  const lines = lrcContent.split(/\r?\n/);
  const rawItems: { time: number; text: string }[] = [];

  for (const line of lines) {
    const match = line.match(/\[(\d{2}:\d{2}(?:\.\d{2,3})?)\](.*)/);
    if (match) {
      const time = parseTimestamp(match[1]);
      const text = match[2].trim();
      if (text) {
        rawItems.push({ time, text });
      }
    }
  }

  // Sort by time
  rawItems.sort((a, b) => a.time - b.time);

  const cues: CaptionCue[] = [];
  for (let i = 0; i < rawItems.length; i++) {
    const item = rawItems[i];
    const nextItem = rawItems[i + 1];
    // Display each line until the next line starts, or for 4 seconds max
    const endTime = nextItem ? Math.min(nextItem.time, item.time + 5) : item.time + 4;
    cues.push({
      id: `lrc-${i + 1}`,
      start: item.time,
      end: endTime,
      text: item.text,
    });
  }

  return cues;
}

/**
 * Universal subtitle parser that routes to the appropriate parser based on format or content.
 */
export function parseSubtitles(content: string, format?: string): CaptionCue[] {
  if (!content) return [];
  const fmt = format?.toLowerCase();

  if (fmt === 'lrc' || /\[\d{2}:\d{2}\.\d{2,3}\]/.test(content)) {
    return parseLrc(content);
  }
  if (fmt === 'vtt' || content.trim().startsWith('WEBVTT')) {
    return parseVtt(content);
  }
  return parseSrt(content);
}

/**
 * Finds all active cues at a specific playback timestamp.
 */
export function findActiveCues(cues: CaptionCue[], currentTime: number): CaptionCue[] {
  return cues.filter((cue) => currentTime >= cue.start && currentTime <= cue.end);
}
