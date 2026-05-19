const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const wordCountEl = document.getElementById('word-count');
const charCountEl = document.getElementById('char-count');
const modeIndicator = document.getElementById('mode-indicator');
const dotsContainer = document.getElementById('dots-container');
const addTabBtn = document.getElementById('add-tab-btn');
const removeTabBtn = document.getElementById('remove-tab-btn');
const togglePreviewBtn = document.getElementById('toggle-preview');

let tabs = [];
let activeTabId = null;
let saveTimeout = null;
let isPreview = false;

// Expose for main process to flush on quit
window.__getPendingNote = () => {
  if (!activeTabId) return null;
  return { tabId: activeTabId, content: editor.value };
};

// Initialize
async function init() {
  tabs = await window.api.getTabs();
  activeTabId = await window.api.getActiveTabId();

  // Validate activeTabId exists in tabs
  if (!tabs.find(t => t.id === activeTabId)) {
    activeTabId = tabs[0]?.id;
  }

  renderDots();
  loadTab(activeTabId);
}

// Render dot buttons from tabs array
function renderDots() {
  dotsContainer.innerHTML = '';
  tabs.forEach(tab => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (tab.id === activeTabId ? ' active' : '');
    dot.dataset.tabId = tab.id;
    dot.style.setProperty('--dot-color', tab.color);
    dot.title = `Tab (${tab.color})`;
    dot.addEventListener('click', () => {
      if (tab.id !== activeTabId) {
        saveCurrentTab();
        activeTabId = tab.id;
        window.api.saveActiveTabId(activeTabId);
        loadTab(activeTabId);
        renderDots();
      }
    });
    dotsContainer.appendChild(dot);
  });
}

// Update background accent color based on active tab
function updateAccentColor(color) {
  // Convert hex to RGB and apply as a subtle tint to the dark background
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  document.body.style.backgroundColor = `rgb(${Math.round(r * 0.1 + 14)}, ${Math.round(g * 0.1 + 14)}, ${Math.round(b * 0.1 + 20)})`;
  const barColor = `rgb(${Math.round(r * 0.08 + 12)}, ${Math.round(g * 0.08 + 12)}, ${Math.round(b * 0.08 + 18)})`;
  document.querySelectorAll('.tab-bar, .toolbar, .status-bar').forEach(el => {
    el.style.backgroundColor = barColor;
  });
}

// Load tab content into editor
function loadTab(tabId) {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return;
  editor.value = tab.content || '';
  updateAccentColor(tab.color);
  updateCounts();
  updatePreview();
  if (!isPreview) editor.focus();
}

// Save current tab content immediately
function saveCurrentTab() {
  if (!activeTabId) return;
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab && tab.content !== editor.value) {
    tab.content = editor.value;
    window.api.saveTabContent(activeTabId, editor.value);
  }
}

// Debounced save
function debouncedSave() {
  const tabId = activeTabId;
  const content = editor.value;
  const tab = tabs.find(t => t.id === tabId);
  if (tab) tab.content = content;

  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    window.api.saveTabContent(tabId, content);
  }, 300);
}

// Update word/char counts
function updateCounts() {
  const text = editor.value;
  const charCount = text.length;
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  wordCountEl.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
  charCountEl.textContent = `${charCount} character${charCount !== 1 ? 's' : ''}`;
}

// Toggle markdown preview
function toggleMarkdownPreview() {
  isPreview = !isPreview;

  if (isPreview) {
    updatePreview();
    editor.classList.add('hidden');
    preview.classList.remove('hidden');
    togglePreviewBtn.classList.add('active');
    togglePreviewBtn.textContent = 'Raw';
    modeIndicator.textContent = 'Preview';
  } else {
    editor.classList.remove('hidden');
    preview.classList.add('hidden');
    togglePreviewBtn.classList.remove('active');
    togglePreviewBtn.textContent = 'Preview';
    modeIndicator.textContent = 'Raw';
    editor.focus();
  }
}

// Render markdown to preview pane
function updatePreview() {
  if (!isPreview) return;
  try {
    preview.innerHTML = marked.parse(editor.value || '', {
      breaks: true,
      gfm: true
    });
  } catch (e) {
    preview.textContent = editor.value;
  }
}

// --- Event Listeners ---

// Editor input
editor.addEventListener('input', () => {
  updateCounts();
  debouncedSave();
});

// Add tab
addTabBtn.addEventListener('click', async () => {
  saveCurrentTab();
  const newTab = await window.api.addTab();
  if (newTab) {
    tabs.push(newTab);
    activeTabId = newTab.id;
    window.api.saveActiveTabId(activeTabId);
    renderDots();
    loadTab(activeTabId);
  }
});

// Remove current tab
removeTabBtn.addEventListener('click', async () => {
  if (tabs.length <= 1) return;
  const result = await window.api.removeTab(activeTabId);
  if (result) {
    tabs = result.tabs;
    activeTabId = result.activeTabId;
    renderDots();
    loadTab(activeTabId);
  }
});

// Toggle preview
togglePreviewBtn.addEventListener('click', toggleMarkdownPreview);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Cmd+1-9 switch tabs
  if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
    e.preventDefault();
    const idx = parseInt(e.key) - 1;
    if (idx < tabs.length) {
      saveCurrentTab();
      activeTabId = tabs[idx].id;
      window.api.saveActiveTabId(activeTabId);
      renderDots();
      loadTab(activeTabId);
    }
  }

  // Cmd+P toggle preview
  if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
    e.preventDefault();
    toggleMarkdownPreview();
  }

  // Cmd+T new tab
  if ((e.metaKey || e.ctrlKey) && e.key === 't') {
    e.preventDefault();
    addTabBtn.click();
  }

  // Cmd+W close tab
  if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
    e.preventDefault();
    if (tabs.length > 1) removeTabBtn.click();
  }
});

// Focus editor when window shown
window.api.onWindowShown(() => {
  if (!isPreview) editor.focus();
});

// Add hidden class for editor toggle
const style = document.createElement('style');
style.textContent = '#editor.hidden { display: none; }';
document.head.appendChild(style);

// Start
init();
