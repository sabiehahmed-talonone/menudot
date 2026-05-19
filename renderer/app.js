const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const wordCountEl = document.getElementById('word-count');
const charCountEl = document.getElementById('char-count');
const modeIndicator = document.getElementById('mode-indicator');
const dotsContainer = document.getElementById('dots-container');
const addTabBtn = document.getElementById('add-tab-btn');
const removeTabBtn = document.getElementById('remove-tab-btn');
const togglePreviewBtn = document.getElementById('toggle-preview');
const insertTodoBtn = document.getElementById('insert-todo-btn');
const emojiBtn = document.getElementById('emoji-btn');
const emojiPicker = document.getElementById('emoji-picker');

let tabs = [];
let activeTabId = null;
let saveTimeout = null;
let isPreview = false;
let emojiPickerOpen = false;

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
    setupPreviewCheckboxes();
  } catch (e) {
    preview.textContent = editor.value;
  }
}

// --- Todo ---

function insertTodo() {
  if (isPreview) return;
  const start = editor.selectionStart;
  const text = editor.value;

  // Find start of current line
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  const before = text.slice(0, lineStart);
  const after = text.slice(lineStart);

  // If line is empty or cursor is at start, insert todo prefix
  const prefix = '- [ ] ';
  const newText = before + prefix + after;
  editor.value = newText;
  editor.selectionStart = editor.selectionEnd = lineStart + prefix.length;
  editor.focus();
  updateCounts();
  debouncedSave();
}

// --- Emoji Picker ---

const EMOJI_DATA = {
  'Smileys': ['😀','😃','😄','😁','😅','😂','🤣','😊','😇','🙂','😉','😌','😍','🥰','😘','😋','😛','😜','🤪','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','😢','😭','😤','🤯','😱','🥺','😴'],
  'Hands': ['👍','👎','👌','✌️','🤞','🤟','🤘','👏','🙌','👐','🤲','🤝','🙏','✍️','💪','🖐️','👋','🤚','👆','👇','👉','👈','☝️'],
  'People': ['❤️','🧡','💛','💚','💙','💜','🖤','💔','💯','💢','💥','💫','💦','🔥','⭐','🌟','✨','💡','🎉','🎊','🏆','🥇','🏅','🎯','🚀'],
  'Objects': ['📝','📌','📎','🔗','📁','📂','🗂️','📊','📈','📉','✅','❌','⚠️','🔴','🟡','🟢','🔵','⬛','⬜','🔲','🔳','▶️','⏸️','⏹️','🔔','🔕','📅','⏰','🕐'],
  'Arrows': ['⬆️','⬇️','➡️','⬅️','↗️','↘️','↙️','↖️','↕️','↔️','🔄','🔃','🔙','🔚','🔛','🔜','🔝']
};

function buildEmojiPicker() {
  const categories = Object.keys(EMOJI_DATA);

  const search = document.createElement('input');
  search.className = 'emoji-search';
  search.placeholder = 'Search emoji...';
  search.type = 'text';

  const catBar = document.createElement('div');
  catBar.className = 'emoji-categories';

  const grid = document.createElement('div');
  grid.className = 'emoji-grid';

  function renderCategory(catName) {
    grid.innerHTML = '';
    const emojis = EMOJI_DATA[catName];
    emojis.forEach(emoji => {
      const btn = document.createElement('button');
      btn.textContent = emoji;
      btn.title = emoji;
      btn.addEventListener('click', () => insertEmoji(emoji));
      grid.appendChild(btn);
    });

    catBar.querySelectorAll('.emoji-cat-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.cat === catName);
    });
  }

  function renderSearch(query) {
    grid.innerHTML = '';
    const q = query.toLowerCase();
    const all = Object.values(EMOJI_DATA).flat();
    // Simple filter — show all if query is empty
    const filtered = q ? all.filter(e => e.includes(q)) : all;
    filtered.forEach(emoji => {
      const btn = document.createElement('button');
      btn.textContent = emoji;
      btn.title = emoji;
      btn.addEventListener('click', () => insertEmoji(emoji));
      grid.appendChild(btn);
    });

    catBar.querySelectorAll('.emoji-cat-btn').forEach(b => b.classList.remove('active'));
  }

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'emoji-cat-btn';
    btn.dataset.cat = cat;
    // Use first emoji of category as label
    btn.textContent = EMOJI_DATA[cat][0];
    btn.title = cat;
    btn.addEventListener('click', () => {
      search.value = '';
      renderCategory(cat);
    });
    catBar.appendChild(btn);
  });

  search.addEventListener('input', () => {
    if (search.value.trim()) {
      renderSearch(search.value.trim());
    } else {
      renderCategory(categories[0]);
    }
  });

  emojiPicker.appendChild(search);
  emojiPicker.appendChild(catBar);
  emojiPicker.appendChild(grid);

  renderCategory(categories[0]);
}

function insertEmoji(emoji) {
  if (isPreview) return;
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  editor.value = editor.value.slice(0, start) + emoji + editor.value.slice(end);
  editor.selectionStart = editor.selectionEnd = start + emoji.length;
  editor.focus();
  updateCounts();
  debouncedSave();
  toggleEmojiPicker(false);
}

function toggleEmojiPicker(forceState) {
  emojiPickerOpen = forceState !== undefined ? forceState : !emojiPickerOpen;
  emojiPicker.classList.toggle('hidden', !emojiPickerOpen);
  emojiBtn.classList.toggle('active', emojiPickerOpen);
  if (emojiPickerOpen) {
    const search = emojiPicker.querySelector('.emoji-search');
    if (search) { search.value = ''; search.focus(); }
  }
}

// --- Interactive checkboxes in preview ---

function setupPreviewCheckboxes() {
  const checkboxes = preview.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((cb, idx) => {
    cb.removeAttribute('disabled');
    cb.addEventListener('change', () => {
      toggleCheckbox(idx, cb.checked);
    });
  });
}

function toggleCheckbox(index, checked) {
  const text = editor.value;
  const pattern = /- \[([ xX])\]/g;
  let match;
  let count = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (count === index) {
      const replacement = checked ? '- [x]' : '- [ ]';
      editor.value = text.slice(0, match.index) + replacement + text.slice(match.index + match[0].length);
      updateCounts();
      debouncedSave();
      updatePreview();
      return;
    }
    count++;
  }
}

// Build emoji picker on load
buildEmojiPicker();

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

// Insert todo
insertTodoBtn.addEventListener('click', insertTodo);

// Emoji picker toggle
emojiBtn.addEventListener('click', () => toggleEmojiPicker());

// Close emoji picker on outside click
document.addEventListener('click', (e) => {
  if (emojiPickerOpen && !emojiPicker.contains(e.target) && e.target !== emojiBtn) {
    toggleEmojiPicker(false);
  }
});

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

  // Cmd+L insert todo
  if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
    e.preventDefault();
    insertTodo();
  }

  // Cmd+E toggle emoji picker
  if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
    e.preventDefault();
    toggleEmojiPicker();
  }

  // Escape closes emoji picker
  if (e.key === 'Escape' && emojiPickerOpen) {
    toggleEmojiPicker(false);
    editor.focus();
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
