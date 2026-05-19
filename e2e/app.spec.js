const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('@playwright/test');
const path = require('path');

let app;
let page;

test.beforeAll(async () => {
  app = await electron.launch({
    args: [path.join(__dirname, '..', 'main.js')],
  });
  page = await app.firstWindow();
  // Wait for app to initialize
  await page.waitForSelector('#dots-container .dot');
});

test.afterAll(async () => {
  if (app) await app.close();
});

test.describe('App launch', () => {
  test('window loads with correct title', async () => {
    const title = await page.title();
    expect(title).toBe('MenuDot');
  });

  test('editor is visible', async () => {
    const editor = page.locator('#editor');
    await expect(editor).toBeVisible();
  });

  test('status bar shows word and character counts', async () => {
    await expect(page.locator('#word-count')).toHaveText('0 words');
    await expect(page.locator('#char-count')).toHaveText('0 characters');
  });
});

test.describe('Tab dots', () => {
  test('renders 7 default dots', async () => {
    const dots = page.locator('#dots-container .dot');
    await expect(dots).toHaveCount(7);
  });

  test('first dot is active by default', async () => {
    const firstDot = page.locator('#dots-container .dot').first();
    await expect(firstDot).toHaveClass(/active/);
  });

  test('clicking a dot switches active state', async () => {
    const dots = page.locator('#dots-container .dot');
    await dots.nth(2).click();
    await expect(dots.nth(2)).toHaveClass(/active/);
    await expect(dots.nth(0)).not.toHaveClass(/active/);
    // Switch back
    await dots.nth(0).click();
  });
});

test.describe('Editor', () => {
  test('typing updates word and character counts', async () => {
    const editor = page.locator('#editor');
    await editor.fill('hello world');
    await expect(page.locator('#word-count')).toHaveText('2 words');
    await expect(page.locator('#char-count')).toHaveText('11 characters');
    // Clean up
    await editor.fill('');
  });

  test('single word shows singular form', async () => {
    const editor = page.locator('#editor');
    await editor.fill('hello');
    await expect(page.locator('#word-count')).toHaveText('1 word');
    await expect(page.locator('#char-count')).toHaveText('5 characters');
    await editor.fill('');
  });

  test('tab content is independent per tab', async () => {
    const editor = page.locator('#editor');
    const dots = page.locator('#dots-container .dot');

    // Type in tab 1
    await dots.nth(0).click();
    await editor.fill('tab one content');

    // Switch to tab 2, type different content
    await dots.nth(1).click();
    await expect(editor).toHaveValue('');
    await editor.fill('tab two content');

    // Switch back to tab 1, verify content preserved
    await dots.nth(0).click();
    await expect(editor).toHaveValue('tab one content');

    // Switch to tab 2, verify its content
    await dots.nth(1).click();
    await expect(editor).toHaveValue('tab two content');

    // Clean up
    await editor.fill('');
    await dots.nth(0).click();
    await editor.fill('');
  });
});

test.describe('Markdown preview', () => {
  test('toggling preview shows rendered content', async () => {
    const editor = page.locator('#editor');
    const preview = page.locator('#preview');
    const toggleBtn = page.locator('#toggle-preview');

    await editor.fill('# Hello World');
    await toggleBtn.click();

    await expect(preview).toBeVisible();
    await expect(editor).toBeHidden();
    await expect(toggleBtn).toHaveText('Raw');
    await expect(page.locator('#mode-indicator')).toHaveText('Preview');

    // Check rendered markdown
    const h1 = preview.locator('h1');
    await expect(h1).toHaveText('Hello World');

    // Toggle back
    await toggleBtn.click();
    await expect(editor).toBeVisible();
    await expect(preview).toBeHidden();
    await expect(toggleBtn).toHaveText('Preview');
    await expect(page.locator('#mode-indicator')).toHaveText('Raw');

    await editor.fill('');
  });
});

test.describe('Add and remove tabs', () => {
  test('add tab creates new dot', async () => {
    const addBtn = page.locator('#add-tab-btn');
    const dots = page.locator('#dots-container .dot');

    const countBefore = await dots.count();
    await addBtn.click();
    await expect(dots).toHaveCount(countBefore + 1);

    // New tab should be active
    const lastDot = dots.last();
    await expect(lastDot).toHaveClass(/active/);
  });

  test('remove tab deletes current dot', async () => {
    const removeBtn = page.locator('#remove-tab-btn');
    const dots = page.locator('#dots-container .dot');

    const countBefore = await dots.count();
    await removeBtn.click();
    await expect(dots).toHaveCount(countBefore - 1);
  });
});

test.describe('Accent color', () => {
  test('background changes when switching tabs', async () => {
    const dots = page.locator('#dots-container .dot');

    await dots.nth(0).click();
    const bg1 = await page.evaluate(() => document.body.style.backgroundColor);

    await dots.nth(4).click();
    const bg2 = await page.evaluate(() => document.body.style.backgroundColor);

    expect(bg1).not.toBe(bg2);

    // Switch back
    await dots.nth(0).click();
  });
});
