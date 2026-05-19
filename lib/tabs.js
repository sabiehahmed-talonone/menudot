const TAB_COLORS = [
  '#ff6b35', '#f7c948', '#48bb78', '#38b2ac',
  '#4299e1', '#9f7aea', '#ed64a6', '#e53e3e',
  '#dd6b20', '#d69e2e', '#319795', '#3182ce',
  '#805ad5', '#d53f8c', '#718096'
];

const DEFAULT_TABS = [
  { id: '1', color: '#ff6b35', content: '' },
  { id: '2', color: '#f7c948', content: '' },
  { id: '3', color: '#48bb78', content: '' },
  { id: '4', color: '#38b2ac', content: '' },
  { id: '5', color: '#4299e1', content: '' },
  { id: '6', color: '#9f7aea', content: '' },
  { id: '7', color: '#ed64a6', content: '' }
];

function getNextColor(tabs) {
  const usedColors = new Set(tabs.map(t => t.color));
  return TAB_COLORS.find(c => !usedColors.has(c)) || TAB_COLORS[tabs.length % TAB_COLORS.length];
}

function addTab(tabs) {
  const color = getNextColor(tabs);
  const newTab = {
    id: Date.now().toString(),
    color,
    content: ''
  };
  return { tabs: [...tabs, newTab], newTab };
}

function removeTab(tabs, tabId) {
  if (tabs.length <= 1) return null;
  const idx = tabs.findIndex(t => t.id === tabId);
  if (idx === -1) return null;
  const newTabs = tabs.filter(t => t.id !== tabId);
  const newActiveIdx = Math.min(idx, newTabs.length - 1);
  return { tabs: newTabs, activeTabId: newTabs[newActiveIdx].id };
}

function saveTabContent(tabs, tabId, content) {
  return tabs.map(t => t.id === tabId ? { ...t, content } : t);
}

module.exports = { TAB_COLORS, DEFAULT_TABS, getNextColor, addTab, removeTab, saveTabContent };
