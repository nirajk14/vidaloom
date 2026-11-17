import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  parseSrt,
  parseTimestamp,
  formatPlayerTime,
  findActiveCues,
  parseSubtitles,
} from '../src/engine/subtitles/srtParser';

describe('SRT Parser & Caption Display', () => {
  it('parses timestamps formatted with commas and periods into accurate seconds', () => {
    // Standard SRT: 00:01:23,456 -> 83.456s
    expect(parseTimestamp('00:01:23,456')).toBeCloseTo(83.456, 3);
    // Period format: 00:00:10.500 -> 10.5s
    expect(parseTimestamp('00:00:10.500')).toBeCloseTo(10.5, 3);
    // Short format: 02:15.200 -> 135.2s
    expect(parseTimestamp('02:15.200')).toBeCloseTo(135.2, 3);
  });

  it('formats player time correctly', () => {
    expect(formatPlayerTime(0)).toBe('00:00');
    expect(formatPlayerTime(65)).toBe('01:05');
    expect(formatPlayerTime(3665)).toBe('01:01:05');
  });

  it('parses a clean standard SRT block into CaptionCues with accurate timing', () => {
    const srt = `1
00:00:01,000 --> 00:00:04,500
Hello World!

2
00:00:05,200 --> 00:00:08,000
Second caption block`;

    const cues = parseSrt(srt);
    expect(cues).toHaveLength(2);

    expect(cues[0]).toEqual({
      id: '1',
      start: 1.0,
      end: 4.5,
      text: 'Hello World!',
    });

    expect(cues[1]).toEqual({
      id: '2',
      start: 5.2,
      end: 8.0,
      text: 'Second caption block',
    });
  });

  it('correctly preserves multiline subtitle text', () => {
    const srt = `1
00:00:10,000 --> 00:00:12,200
The club isn't the best place
to find a lover`;

    const cues = parseSrt(srt);
    expect(cues).toHaveLength(1);
    expect(cues[0].text).toBe("The club isn't the best place\nto find a lover");
  });

  it('cleans HTML tags and formatting from subtitle lines', () => {
    const srt = `1
00:00:01,000 --> 00:00:03,000
<i>Italic text</i> and <b>bold text</b> with <font color="#ff0000">color</font>`;

    const cues = parseSrt(srt);
    expect(cues).toHaveLength(1);
    expect(cues[0].text).toBe('Italic text and bold text with color');
  });

  it('handles irregular blank lines and trailing whitespace without errors', () => {
    const srt = `

1   
00:00:01,000 --> 00:00:03,000   
First line   


2
00:00:04,000 --> 00:00:06,000
Second line


`;

    const cues = parseSrt(srt);
    expect(cues).toHaveLength(2);
    expect(cues[0].text).toBe('First line');
    expect(cues[1].text).toBe('Second line');
  });

  it('discards cues with reversed or invalid timestamps safely', () => {
    const srt = `1
00:00:10,000 --> 00:00:05,000
This cue has end before start!

2
00:00:15,000 --> 00:00:20,000
Valid cue`;

    const cues = parseSrt(srt);
    expect(cues).toHaveLength(1);
    expect(cues[0].text).toBe('Valid cue');
  });

  it('correctly finds active cues at specified playback timestamps', () => {
    const cues = [
      { id: '1', start: 1.0, end: 4.0, text: 'Cue 1' },
      { id: '2', start: 5.0, end: 8.0, text: 'Cue 2' },
      { id: '3', start: 7.0, end: 10.0, text: 'Cue 3 (overlapping)' },
    ];

    // At 0.5s -> no cue
    expect(findActiveCues(cues, 0.5)).toHaveLength(0);

    // At 2.5s -> Cue 1
    const activeAt2 = findActiveCues(cues, 2.5);
    expect(activeAt2).toHaveLength(1);
    expect(activeAt2[0].id).toBe('1');

    // At 4.5s -> gap between Cue 1 and 2
    expect(findActiveCues(cues, 4.5)).toHaveLength(0);

    // At 7.5s -> Cue 2 and Cue 3 overlapping
    const activeAt7 = findActiveCues(cues, 7.5);
    expect(activeAt7).toHaveLength(2);
    expect(activeAt7.map((c) => c.id)).toEqual(['2', '3']);
  });

  it('handles empty input gracefully', () => {
    expect(parseSrt('')).toEqual([]);
    expect(parseSrt('   \n\n  ')).toEqual([]);
    // @ts-expect-error test invalid types
    expect(parseSrt(null)).toEqual([]);
  });

  it('successfully parses real-world test asset Ed Sheeran Shape of You SRT', () => {
    const filePath = path.resolve(__dirname, '../env/test-assets/Ed-Sheeran-Shape-Of-You-(Official-Video).srt');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const cues = parseSubtitles(content, 'srt');

      expect(cues.length).toBeGreaterThan(50);
      expect(cues[0].start).toBe(10);
      expect(cues[0].end).toBe(12.2);
      expect(cues[0].text).toContain("The club isn't the best place");
    }
  });
});
