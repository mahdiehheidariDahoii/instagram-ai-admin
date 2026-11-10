(() => {
  if (globalThis.__instagramAiAdminDraftListenerInstalled) return;
  globalThis.__instagramAiAdminDraftListenerInstalled = true;
  const findComposer = () => document.querySelector('#prompt-textarea[contenteditable="true"]') ||
    document.querySelector('[data-testid="composer-text-input"][contenteditable="true"]') ||
    document.querySelector('div[contenteditable="true"][role="textbox"]');
  let sending = false;
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'CHECK_SUBMISSION') {
      const composer = findComposer();
      const value = (composer?.innerText || composer?.textContent || '').trim();
      const main = document.querySelector('main');
      const userTurns = [...document.querySelectorAll('[data-message-author-role="user"], [data-testid^="conversation-turn-"][data-turn="user"]')];
      const expected = message.expectedText || '';
      const inTurns = userTurns.some(el => (el.innerText || el.textContent || '').includes(expected));
      const inMain = Boolean(expected && (main?.innerText || '').includes(expected));
      sendResponse({ok: true, submitted: Boolean(expected && (inTurns || (inMain && !value.includes(expected)))), composerHasDraft: value.includes(expected)});
      return;
    }
    if (message?.type !== 'DRAFT_CHATGPT') return;
    if (sending) { sendResponse({ok: false, error: 'An automatic send is already in progress.'}); return; }
    const composer = findComposer();
    if (!composer) { sendResponse({ok: false, error: 'ChatGPT composer not found. Open a chat and retry.'}); return; }
    const existing = (composer.innerText || composer.textContent || '').trim();
    if (existing) {
      if (existing === message.text.trim()) {
        composer.focus();
        sendResponse({ok: true, drafted: true, reusedDraft: true, autoSent: false});
      } else {
        sendResponse({ok: false, error: 'ChatGPT composer contains different text. Clear it and retry.'});
      }
      return;
    }
    try {
      composer.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(composer);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
      // execCommand can return false in ChatGPT's ProseMirror editor even
      // when insertion succeeded; inspect the actual editor before failing.
      document.execCommand('insertText', false, message.text);
      let actual = composer.innerText || composer.textContent || '';
      if (!actual.includes(message.text)) {
        // Fallback for ProseMirror variants that reject execCommand.
        // Populate a paragraph (rather than the editor root) and notify listeners.
        const paragraph = document.createElement('p');
        paragraph.textContent = message.text;
        composer.replaceChildren(paragraph);
        composer.dispatchEvent(new InputEvent('input', {
          bubbles: true, inputType: 'insertText', data: message.text
        }));
        actual = composer.innerText || composer.textContent || '';
      }
      if (!actual.includes(message.text)) {
        sendResponse({ok: false, error: 'Composer insertion failed; editor text did not match.'});
        return;
      }
      composer.dispatchEvent(new InputEvent('input', {bubbles: true, inputType: 'insertText', data: message.text}));
      if (!message.autoSend) {
        sendResponse({ok: true, drafted: true, autoSent: false});
        return;
      }
      sending = true;
      const started = Date.now();
      let clicked = false;
      const attemptSend = () => {
        const current = findComposer();
        const currentText = (current?.innerText || current?.textContent || '').trim();
        const stopButton = document.querySelector('[data-testid="stop-button"], button[aria-label="Stop generating"]');
        // A click is not proof of sending. Confirm the composer was cleared
        // or that ChatGPT entered its generating state.
        if (clicked && (stopButton || !currentText)) {
          sending = false;
          sendResponse({ok: true, drafted: true, autoSent: true});
          return;
        }
        if (Date.now() - started > 12000) {
          sending = false;
          sendResponse({ok: false, drafted: true, error: clicked
            ? 'Send button was clicked, but message submission was not confirmed. Check the ChatGPT tab.'
            : 'Send button not ready. Draft remains in ChatGPT; send manually.'});
          return;
        }
        if (!clicked) {
          if (!currentText.includes(message.text)) {
            sending = false;
            sendResponse({ok: false, error: 'Draft changed before automatic send.'});
            return;
          }
          const button = [...document.querySelectorAll('button')].find(el =>
            el.matches('[data-testid="send-button"], [aria-label="Send prompt"], [aria-label="Send message"], [aria-label="ارسال پیام"]') &&
            el.getClientRects().length > 0 && !el.disabled && el.getAttribute('aria-disabled') !== 'true'
          );
          if (button) {
            clicked = true;
            button.click();
          }
        }
        setTimeout(attemptSend, 250);
      };
      attemptSend();
      return true;
    } catch {
      sendResponse({ok: false, error: 'Failed to draft message in ChatGPT'});
    }
  });
})();

// Manual capture: return plain text, with no JSON validation.
(() => {
  if (globalThis.__instagramAiAdminCaptureListenerInstalled) return;
  globalThis.__instagramAiAdminCaptureListenerInstalled = true;
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== 'CAPTURE_CHATGPT') return;
    if (document.querySelector('[data-testid="stop-button"]')) {
      sendResponse({ok: false, error: 'ChatGPT is still generating.'});
      return;
    }
    // Only capture a verifiable assistant turn. Generic .markdown/main paragraphs
    // may be transient progress messages such as "Verifying ...".
    // ChatGPT has multiple renderers. Some show assistant responses without
    // data-message-author-role, including rich/code-block layouts.
    const main = document.querySelector('main') || document;
    const turns = [...main.querySelectorAll(
      '[data-message-author-role="assistant"], [data-testid^="conversation-turn-"][data-turn="assistant"], article[data-turn="assistant"], [data-role="assistant"]'
    )].filter(el => el.getClientRects().length);
    const assistantCount = turns.length;
    const codeNodes = [...main.querySelectorAll('pre code, pre, [data-testid="code-block"] code')];
    const candidates = [];
    for (const turn of turns.slice().reverse()) {
      candidates.push(...[...turn.querySelectorAll('pre code, pre')].reverse().map(el => el.innerText || el.textContent || ''));
      candidates.push(turn.innerText || turn.textContent || '');
    }
    // Fallback for ChatGPT renderers where assistant turn wrappers are absent.
    // Prefer code blocks and inspect from newest to oldest.
    if (!turns.length) {
      candidates.push(...codeNodes.reverse().map(el => el.innerText || el.textContent || ''));
    }
    let clean = '';
    for (const candidate of candidates) {
      const raw = candidate.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const first = raw.indexOf('{');
      const last = raw.lastIndexOf('}');
      if (first < 0 || last <= first) continue;
      const jsonText = raw.slice(first, last + 1).replace(/[\u00a0\u202f\u2007]/g, ' ');
      try {
        const parsed = JSON.parse(jsonText);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          clean = jsonText;
          break;
        }
      } catch {}
    }
    if (!clean) {
      sendResponse({ok:false,pending:true,assistantCount,error:
        'No complete assistant JSON detected (turns=' + turns.length + ', codeBlocks=' + codeNodes.length + ')'});
      return;
    }
    const generating = Boolean(document.querySelector(
      '[data-testid="stop-button"], button[aria-label="Stop generating"], button[aria-label="Stop streaming"], button[aria-label="توقف تولید"]'
    ));
    if (generating) {
      sendResponse({ok:false,pending:true,assistantCount,error:'Assistant is still generating'});
      return;
    }
    sendResponse({ok:true,captured:true,text:clean,source:'verified-assistant-json',assistantCount});
  });
})();
