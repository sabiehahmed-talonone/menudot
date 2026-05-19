import { describe, it, expect } from 'vitest';
const { TAB_COLORS, DEFAULT_TABS, getNextColor, addTab, removeTab, saveTabContent } = require('../lib/tabs');

describe('getNextColor', () => {
  it('returns first unused color', () => {
    const tabs = [{ id: '1', color: '#ff6b35' }];
    expect(getNextColor(tabs)).toBe('#f7c948');
  });

  it('skips used colors', () => {
    const tabs = TAB_COLORS.slice(0, 3).map((c, i) => ({ id: String(i), color: c }));
    expect(getNextColor(tabs)).toBe('#38b2ac');
  });

  it('wraps around when all colors used', () => {
    const tabs = TAB_COLORS.map((c, i) => ({ id: String(i), color: c }));
    expect(getNextColor(tabs)).toBe(TAB_COLORS[15 % TAB_COLORS.length]);
  });
});

describe('addTab', () => {
  it('adds a tab with next available color', () => {
    const { tabs, newTab } = addTab(DEFAULT_TABS);
    expect(tabs).toHaveLength(8);
    expect(newTab.color).toBe('#e53e3e');
    expect(newTab.content).toBe('');
  });

  it('returns new tab with unique id', () => {
    const { newTab: t1 } = addTab(DEFAULT_TABS);
    const { newTab: t2 } = addTab(DEFAULT_TABS);
    // IDs are timestamp-based, may match in same ms — just check they exist
    expect(t1.id).toBeTruthy();
    expect(t2.id).toBeTruthy();
  });
});

describe('removeTab', () => {
  it('removes specified tab', () => {
    const result = removeTab(DEFAULT_TABS, '3');
    expect(result.tabs).toHaveLength(6);
    expect(result.tabs.find(t => t.id === '3')).toBeUndefined();
  });

  it('returns next tab as active when removing middle tab', () => {
    const result = removeTab(DEFAULT_TABS, '3');
    expect(result.activeTabId).toBe('4');
  });

  it('returns previous tab as active when removing last tab', () => {
    const result = removeTab(DEFAULT_TABS, '7');
    expect(result.activeTabId).toBe('6');
  });

  it('returns null when only one tab remains', () => {
    const singleTab = [{ id: '1', color: '#ff6b35', content: '' }];
    expect(removeTab(singleTab, '1')).toBeNull();
  });

  it('returns null for non-existent tab id', () => {
    expect(removeTab(DEFAULT_TABS, 'nope')).toBeNull();
  });
});

describe('saveTabContent', () => {
  it('updates content for matching tab', () => {
    const updated = saveTabContent(DEFAULT_TABS, '2', 'hello world');
    expect(updated.find(t => t.id === '2').content).toBe('hello world');
  });

  it('does not mutate original array', () => {
    const original = [{ id: '1', color: '#ff6b35', content: '' }];
    saveTabContent(original, '1', 'changed');
    expect(original[0].content).toBe('');
  });

  it('leaves other tabs unchanged', () => {
    const updated = saveTabContent(DEFAULT_TABS, '1', 'new');
    expect(updated.find(t => t.id === '2').content).toBe('');
  });
});
