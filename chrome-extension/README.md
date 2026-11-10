# Instagram AI Admin Chrome Bridge — Phase 1

1. Open chrome://extensions in Chrome.
2. Enable Developer mode.
3. Click Load unpacked and select the chrome-extension directory.
4. Open http://localhost:3000/extension-test and refresh it.
5. Click «ارسال JSON آزمایشی» and verify «موفق: افزونه JSON را دریافت کرد».

Only localhost:3000 and 127.0.0.1:3000 are allowed. No ChatGPT integration or external network access is implemented in this phase.
The extension acknowledges receipt of JSON in its service worker; it does not persist it.

## Phase 2 — Draft in ChatGPT (no automatic send)

Reload the unpacked extension in chrome://extensions, then refresh the local test page and any open chatgpt.com tab.
Click «انتقال JSON به ChatGPT (بدون ارسال)». The extension finds an open ChatGPT tab and drafts the sample JSON there.
If ChatGPT is not open, the extension opens it and asks you to click again once loaded.
It will never click Send. It refuses to overwrite existing draft text.
This phase relies on the current ChatGPT web composer DOM, which may change.
