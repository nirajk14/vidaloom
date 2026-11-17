import { describe, it, expect } from 'vitest';

describe('VidaLoom environment sanity check', () => {
  it('runs unit tests with Vitest successfully', () => {
    expect(1 + 1).toBe(2);
  });

  it('verifies string formatting utility', () => {
    const title = 'VidaLoom Video Composer';
    expect(title.toLowerCase()).toContain('vidaloom');
  });
});
