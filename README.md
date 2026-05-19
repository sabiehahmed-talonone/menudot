# MenuDot

A lightweight menu bar note-taking app for macOS, inspired by [Tot](https://tot.rocks). Lives in your status bar, stays out of your way, and keeps your notes always one click away.

## Features

- **Menu bar native** — no dock icon, no window clutter. Click the dot in your menu bar to open.
- **Tabbed notes** — color-coded dot tabs to organize different notes. Start with 7, add or remove as needed.
- **Markdown support** — write in raw text, preview rendered Markdown with `Cmd+P`.
- **Persistent storage** — notes save automatically and survive app restarts. Stored locally via `electron-store`.
- **Keyboard-first** — switch tabs, create/close tabs, and toggle preview without touching the mouse.

## Screenshots

| Editor (Raw) | Markdown Preview |
|---|---|
| Dark themed editor with colored dot tabs | Full GFM Markdown rendering |

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+1` through `Cmd+9` | Switch to tab 1–9 |
| `Cmd+T` | New tab |
| `Cmd+W` | Close current tab |
| `Cmd+P` | Toggle Markdown preview / raw editor |

## Tech Stack

- [Electron](https://www.electronjs.org/) — desktop app framework
- [menubar](https://github.com/nickethe/menubar) — tray/popup window management
- [electron-store](https://github.com/sindresorhus/electron-store) — persistent JSON storage
- [marked](https://github.com/markedjs/marked) — Markdown parser (GFM)
- Plain HTML/CSS/JS — no frontend framework

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **macOS** (menu bar app — macOS only)

## Getting Started

### Clone and install

```bash
git clone <your-repo-url> menudot
cd menudot
npm install
```

### Run in development

```bash
npm start
```

A dot icon appears in your menu bar. Click it to open the note-taking popup.

## Building the DMG

MenuDot can be packaged as an unsigned `.dmg` for distribution without an Apple Developer account.

### Build

```bash
npm run dist
```

The DMG is output to:

```
dist/MenuDot-1.0.0-arm64.dmg
```

> **Note:** This builds for Apple Silicon (arm64) by default. To build a universal binary (arm64 + Intel), change `"arch"` in `package.json` from `["arm64"]` to `["universal"]`. Universal builds are ~190MB vs ~96MB.

### What "unsigned" means

Since the app is not signed with an Apple Developer certificate:

- macOS Gatekeeper will block the app on first launch
- This is normal and expected for unsigned apps

### Installing the unsigned DMG

1. Open `MenuDot-1.0.0-arm64.dmg`
2. Drag **MenuDot** into the **Applications** folder
3. **First launch only** — do one of the following:

   **Option A: Right-click method (recommended)**
   - Open Finder → Applications
   - Right-click (or Control-click) on **MenuDot**
   - Click **Open**
   - In the dialog that appears, click **Open** again

   **Option B: Terminal method**
   ```bash
   xattr -cr /Applications/MenuDot.app
   ```
   Then open MenuDot normally.

   **Option C: System Settings**
   - Open **System Settings → Privacy & Security**
   - Scroll down — you'll see a message about MenuDot being blocked
   - Click **Open Anyway**

4. After the first launch, MenuDot opens normally every time.

## Project Structure

```
menudot/
├── main.js              # Main process — tray, menubar, IPC, persistence
├── preload.js           # Context bridge — secure IPC API for renderer
├── package.json         # Dependencies and electron-builder config
├── renderer/
│   ├── index.html       # App shell
│   ├── styles.css       # Dark theme, dot styling, Markdown preview
│   └── app.js           # Tab management, editor, auto-save, shortcuts
├── assets/
│   ├── icon.png         # 1024x1024 app icon (source)
│   ├── icon.icns        # macOS app icon (generated)
│   ├── iconTemplate.png # 22x22 menu bar tray icon
│   └── iconTemplate@2x.png  # 44x44 retina tray icon
└── scripts/
    └── generate-icon.js # Generates the app icon programmatically
```

## Data Storage

Notes are stored as JSON via `electron-store` at:

```
~/Library/Application Support/menudot/config.json
```

Structure:

```json
{
  "tabs": [
    { "id": "1", "color": "#ff6b35", "content": "Your note here..." },
    { "id": "2", "color": "#f7c948", "content": "" }
  ],
  "activeTabId": "1"
}
```

To reset all data, delete the config file:

```bash
rm ~/Library/Application\ Support/menudot/config.json
```

## Regenerating the App Icon

The app icon is generated programmatically (no design tools needed):

```bash
node scripts/generate-icon.js
```

This creates `assets/icon.png` (1024x1024). To rebuild the `.icns`:

```bash
mkdir -p assets/icon.iconset
for s in 16 32 128 256 512; do
  sips -z $s $s assets/icon.png --out assets/icon.iconset/icon_${s}x${s}.png
done
for s in 16 32 128 256; do
  d=$((s*2))
  sips -z $d $d assets/icon.png --out assets/icon.iconset/icon_${s}x${s}@2x.png
done
sips -z 1024 1024 assets/icon.png --out assets/icon.iconset/icon_512x512@2x.png
iconutil -c icns assets/icon.iconset -o assets/icon.icns
```

## Configuration

Key settings in `package.json` under `"build"`:

| Field | Purpose |
|---|---|
| `mac.identity` | Set to `null` to skip code signing |
| `mac.target.arch` | `"arm64"`, `"x64"`, or `"universal"` |
| `mac.extendInfo.LSUIElement` | `true` hides the dock icon |
| `dmg.contents` | Layout of the DMG installer window |

## Troubleshooting

**App doesn't appear in menu bar**
- Check if MenuDot is running: `ps aux | grep -i menudot`
- The icon is a small dot — look carefully near your other menu bar icons

**Notes disappeared after update**
- Data format may have changed between versions
- Check `~/Library/Application Support/menudot/config.json`

**DMG won't open on another Mac**
- Follow the unsigned DMG installation steps above
- The recipient must allow the app through Gatekeeper on first launch

**Build fails**
- Ensure Node.js >= 18: `node --version`
- Clear build cache: `rm -rf dist/ node_modules/ && npm install`

## License

MIT
