const ALLOWED_ORIGINS = new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);
const CHAT_URL = "https://chatgpt.com/";
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function sendToChatTab(tabId, message, retries = 1) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      lastError = error;
      if (attempt === 0) {
        try {
          await chrome.scripting.executeScript({target: {tabId}, files: ["chatgpt-content.js"]});
        } catch (injectionError) {
          lastError = injectionError;
        }
      }
      await delay(350);
    }
  }
  throw lastError;
}
async function pressRealEnter(tabId) {
  const target = {tabId};
  await chrome.debugger.attach(target, "1.3");
  try {
    await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
      type: "rawKeyDown", key: "Enter", code: "Enter",
      windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 36
    });
    await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
      type: "char", text: "\r", key: "Enter", code: "Enter",
      windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 36
    });
    await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
      type: "keyUp", key: "Enter", code: "Enter",
      windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 36
    });
  } finally {
    await chrome.debugger.detach(target).catch(() => {});
  }
}
async function waitForTab(tabId, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === "complete") return tab;
    await delay(250);
  }
  throw new Error("ChatGPT tab did not finish loading.");
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  let origin;
  try { origin = new URL(sender.url || "").origin; } catch { sendResponse({ok: false, error: "Invalid sender"}); return; }
  if (!ALLOWED_ORIGINS.has(origin) || !sender.tab || !["RECEIVE_JSON", "DRAFT_CHATGPT", "CAPTURE_RESPONSE"].includes(message?.type)) {
    sendResponse({ok: false, error: "Unauthorized request"});
    return;
  }
  if (message.type === "CAPTURE_RESPONSE") {
    (async () => {
      const record = await chrome.storage.session.get("activeDraft");
      const draft = record.activeDraft;
      if (!draft || draft.origin !== origin || draft.senderTabId !== sender.tab.id || Date.now() - draft.createdAt > 30 * 60_000) {
        sendResponse({ok: false, error: "No active draft from this page. Draft a new request first."});
        return;
      }
      const chatTab = await chrome.tabs.get(draft.chatTabId);
      if (!chatTab.url?.startsWith(CHAT_URL)) throw new Error("The original ChatGPT tab is no longer available.");
      const result = await sendToChatTab(draft.chatTabId, {type: "CAPTURE_CHATGPT", afterCount: draft.assistantCount || 0});
      if (message.auto && result?.ok) {
        if (!result.text || result.text === draft.baselineText) {
          sendResponse({ok: false, pending: true, error: "Waiting for a new answer"});
          return;
        }
      }
      sendResponse({...result, requestId: message.requestId, originalRequestId: draft.requestId});
    })().catch(error => sendResponse({ok: false, error: error?.message || "Could not read ChatGPT response"}));
    return true;
  }
  let json;
  try {
    json = JSON.stringify(message.payload, null, 2);
    if (!json || json.length > 100_000) throw new Error();
  } catch { sendResponse({ok: false, error: "Invalid JSON payload"}); return; }

  if (message.type === "RECEIVE_JSON") {
    console.info("[Instagram AI Admin Bridge] JSON received", {requestId: message.requestId, bytes: json.length});
    sendResponse({ok: true, received: true, requestId: message.requestId, bytes: json.length});
    return;
  }

  (async () => {
    const tabs = await chrome.tabs.query({url: "https://chatgpt.com/*"});
    const saved = (await chrome.storage.session.get("activeDraft")).activeDraft;
    let tab = tabs.find(t => t.id && t.active && t.status === "complete") ||
      tabs.find(t => t.id === saved?.chatTabId && t.status === "complete") ||
      tabs.find(t => t.id && t.status === "complete");
    if (!tab) {
      tab = await chrome.tabs.create({url: CHAT_URL, active: true});
      tab = await waitForTab(tab.id);
    }
    await chrome.tabs.update(tab.id, {active: true});
    await chrome.windows.update(tab.windowId, {focused: true});
    const prompt = typeof message.prompt === "string" && message.prompt.trim()
      ? message.prompt
      : "لطفاً درخواست JSON زیر را بررسی کن و فقط پاسخ JSON معتبر برگردان.\n\n" + json;
    // Capture baseline BEFORE sending. Capturing it afterwards can store the
    // newly generated answer and make every subsequent poll look unchanged.
    let baselineText = "";
    let assistantCount = 0;
    try {
      const baseline = await sendToChatTab(tab.id, {type: "CAPTURE_CHATGPT"});
      baselineText = baseline?.text || "";
      assistantCount = baseline?.assistantCount || 0;
    } catch {}

    let result;
    let lastError;
    // A newly opened tab can report "complete" before ChatGPT hydrates
    // its composer or before its content script is ready.
    for (let attempt = 0; attempt < 24; attempt++) {
      try {
        result = await sendToChatTab(tab.id, {type: "DRAFT_CHATGPT", text: prompt, autoSend: false});
        if (result?.ok) break;
        if (!/composer not found|insertion failed|could not insert/i.test(result?.error || "")) break;
      } catch (error) {
        lastError = error;
      }
      await delay(650);
    }
    if (result?.ok && message.autoSend === true) {
      try {
        // Allow ChatGPT to register the editor change before sending.
        await delay(700);
        await chrome.tabs.update(tab.id, {active: true});
        await chrome.windows.update(tab.windowId, {focused: true});
        await pressRealEnter(tab.id);
        let confirmed = false;
        for (let i = 0; i < 60; i++) {
          await delay(250);
          const state = await sendToChatTab(tab.id, {type: "CHECK_SUBMISSION", expectedText: prompt});
          if (state?.submitted) { confirmed = true; break; }
        }
        result = confirmed
          ? {ok: true, drafted: true, autoSent: true}
          : {ok: true, drafted: true, autoSent: false, submissionUnconfirmed: true, warning: "Return pressed; submission not confirmed. Response polling will continue."};
      } catch (error) {
        result = {ok: false, drafted: true, error: "Could not send real Return key: " + (error?.message || String(error))};
      }
    }
    if (!result && lastError) throw lastError;
    if (!result?.ok && !result?.error) result = {ok: false, error: "ChatGPT composer was not ready after waiting."};
    if (result?.ok) {
      await chrome.storage.session.set({activeDraft: {
        origin, senderTabId: sender.tab.id, chatTabId: tab.id,
        createdAt: Date.now(), baselineText, assistantCount, requestId: message.requestId
      }});
    }
    sendResponse({...result, requestId: message.requestId});
  })().catch(error => {
    console.error("[Instagram AI Admin Bridge] ChatGPT draft error:", error);
    sendResponse({ok: false, error: error?.message || "Unknown ChatGPT tab error"});
  });
  return true;
});
