import { describe, it, expect } from 'vitest';
const { wordCount, charCount } = require('../lib/counts');

describe('wordCount', () => {
  it('returns 0 for empty string', () => {
    expect(wordCount('')).toBe(0);
  });

  it('returns 0 for whitespace-only string', () => {
    expect(wordCount('   \n\t  ')).toBe(0);
  });

  it('counts single word', () => {
    expect(wordCount('hello')).toBe(1);
  });

  it('counts multiple words', () => {
    expect(wordCount('hello world foo')).toBe(3);
  });

  it('handles extra whitespace between words', () => {
    expect(wordCount('  hello   world  ')).toBe(2);
  });

  it('handles newlines and tabs as separators', () => {
    expect(wordCount('one\ntwo\tthree')).toBe(3);
  });
});

describe('charCount', () => {
  it('returns 0 for empty string', () => {
    expect(charCount('')).toBe(0);
  });

  it('counts all characters including spaces', () => {
    expect(charCount('hi there')).toBe(8);
  });

  it('counts newlines', () => {
    expect(charCount('a\nb')).toBe(3);
  });
});
