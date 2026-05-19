import { describe, it, expect } from 'vitest';
const { hexToRgb, accentBackground, accentBar } = require('../lib/accent');

describe('hexToRgb', () => {
  it('parses red', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses arbitrary color', () => {
    expect(hexToRgb('#4299e1')).toEqual({ r: 66, g: 153, b: 225 });
  });

  it('parses black', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });
});

describe('accentBackground', () => {
  it('returns darker tint for black', () => {
    // r*0.1+14=14, g*0.1+14=14, b*0.1+20=20
    expect(accentBackground('#000000')).toBe('rgb(14, 14, 20)');
  });

  it('produces different backgrounds for different colors', () => {
    const orange = accentBackground('#ff6b35');
    const blue = accentBackground('#4299e1');
    expect(orange).not.toBe(blue);
  });

  it('stays within dark range for bright colors', () => {
    // Max: 255*0.1+14=39.5 → 40, 255*0.1+20=45.5 → 46
    const result = accentBackground('#ffffff');
    expect(result).toBe('rgb(40, 40, 46)');
  });
});

describe('accentBar', () => {
  it('is slightly darker than accentBackground', () => {
    // For #000000: bar=rgb(12,12,18) vs bg=rgb(14,14,20)
    expect(accentBar('#000000')).toBe('rgb(12, 12, 18)');
  });
});
