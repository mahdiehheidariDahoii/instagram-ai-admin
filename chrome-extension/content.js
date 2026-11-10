(() => {
  const CHANNEL = "INSTAGRAM_AI_ADMIN_BRIDGE_V1";
  const MAX_BYTES = 100_000;
  const TYPES = new Set(["REQUEST", "DRAFT_CHATGPT", "CAPTURE_RESPONSE"]);

  function reply(requestId, response) {
    window.postMessage({channel: CHANNEL, type: "RESPONSE", requestId, ...response}, location.origin);
  }

  function runtimeAvailable() {
    try {
      return typeof chrome !== "undefined" &&
        typeof chrome.runtime?.sendMessage === "function" &&
        Boolean(chrome.runtime.id);
    } catch {
      return false;
    }
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    const message = event.data;
    if (!message || message.channel !== CHANNEL || !TYPES.has(message.type)) return;
    if (typeof message.requestId !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(message.requestId)) return;

    if (!runtimeAvailable()) {
      reply(message.requestId, {ok: false, error: "Extension context expired. Reload this web-app tab after reloading the extension."});
      return;
    }

    const outbound = {requestId: message.requestId};
    if (message.type === "CAPTURE_RESPONSE") {
      outbound.type = "CAPTURE_RESPONSE";
      outbound.auto = message.auto === true;
    } else {
      let serialized;
      try { serialized = JSON.stringify(message.payload); } catch {
        reply(message.requestId, {ok: false, error: "Invalid payload"});
        return;
      }
      if (!serialized || serialized.length > MAX_BYTES) {
        reply(message.requestId, {ok: false, error: "Payload too large or invalid"});
        return;
      }
      outbound.type = message.type === "DRAFT_CHATGPT" ? "DRAFT_CHATGPT" : "RECEIVE_JSON";
      outbound.payload = message.payload;
      if (outbound.type === "DRAFT_CHATGPT") {
        outbound.autoSend = message.autoSend === true;
        if (typeof message.prompt === "string") outbound.prompt = message.prompt.slice(0, 90000);
        // Response validation belongs to the web app.
      }
    }

    try {
      chrome.runtime.sendMessage(outbound, (response) => {
        let error;
        try { error = chrome.runtime?.lastError?.message; } catch {
          error = "Extension context expired";
        }
        reply(message.requestId, error
          ? {ok: false, error}
          : response || {ok: false, error: "No extension response"});
      });
    } catch (error) {
      reply(message.requestId, {ok: false, error: error?.message || "Extension communication failed"});
    }
  });

  window.postMessage({channel: CHANNEL, type: "READY"}, location.origin);
})();
