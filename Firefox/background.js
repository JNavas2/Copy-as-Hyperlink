/**
 * BACKGROUND.JS of COPY AS HYPERLINK, EXTENSION for MOZILLA FIREFOX
 * SUPPORTS BOTH DESKTOP AND ANDROID, CROSS-PLATFORM ROBUST VERSION
 * (c) JOHN NAVAS 2025, ALL RIGHTS RESERVED
 */

// Show onboarding page on install or update
browser.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install" || reason === "update") {
    browser.tabs.create({ url: browser.runtime.getURL("onboarding.html") });
  }
});

// Add context menu for desktop only
browser.runtime.getPlatformInfo().then(({ os }) => {
  if (os !== "android") {
    browser.contextMenus.create({
      id: "copy-as-hyperlink",
      title: "Copy as Hyperlink",
      contexts: ["all"]
    });
  }
});

// Helper to inject the main function
function injectCopyScript(tabId) {
  browser.tabs.executeScript(tabId, {
    code: `(${copyHyperlinkFromPage})();`
  });
}

// Context menu click
browser.contextMenus.onClicked.addListener((info, tab) => {
  injectCopyScript(tab.id);
});

// Toolbar button click
browser.browserAction.onClicked.addListener(tab => {
  injectCopyScript(tab.id);
});

// Keyboard shortcut
browser.commands.onCommand.addListener(command => {
  if (command === "copy-as-hyperlink") {
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      if (tabs[0]) injectCopyScript(tabs[0].id);
    });
  }
});

// Main function injected into the page
function copyHyperlinkFromPage() {
  const selection = window.getSelection();
  const tabTitle = document.title;
  const tabUrl = location.href;
  const selectedText = selection && !selection.isCollapsed ? selection.toString().trim() : "";

  // Find if selection is within a link
  function getLinkInfo() {
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
    let node = selection.getRangeAt(0).startContainer;
    while (node) {
      if (node.nodeType === 1 && node.tagName === "A" && node.href) {
        return { href: node.href, text: node.textContent.trim() || node.href };
      }
      node = node.parentNode;
    }
    return null;
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, m =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
    );
  }

  function showToast(msg) {
    let toast = document.getElementById("copy-hyperlink-toast");
    if (toast) toast.remove();
    toast = document.createElement("div");
    toast.id = "copy-hyperlink-toast";
    toast.textContent = msg;
    Object.assign(toast.style, {
      position: "fixed", bottom: "10%", left: "50%", transform: "translateX(-50%)",
      background: "rgba(60,60,60,0.95)", color: "#fff", padding: "12px 24px",
      borderRadius: "8px", fontSize: "16px", zIndex: "999999", boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
      textAlign: "center", maxWidth: "80vw", overflow: "hidden", whiteSpace: "nowrap",
      opacity: "0", transition: "opacity 0.2s"
    });
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = "1"; }, 10);
    setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 200); }, 1500);
  }

  function copyToClipboard(html, plain) {
    if (navigator.clipboard && window.ClipboardItem) {
      navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" })
        })
      ]).catch(e => showToast("Copy failed: " + e));
    } else {
      const temp = document.createElement("textarea");
      temp.value = plain;
      document.body.appendChild(temp);
      temp.select();
      try { document.execCommand("copy"); }
      catch (e) { showToast("Copy failed: " + e); }
      document.body.removeChild(temp);
    }
  }

  const linkInfo = getLinkInfo();
  let html, plain;
  if (!selectedText) {
    html = `<a href="${tabUrl}">${escapeHtml(tabTitle)}</a>`;
    plain = tabUrl;
    showToast("Tab copied as hyperlink!");
  } else if (linkInfo) {
    html = `<a href="${linkInfo.href}">${escapeHtml(linkInfo.text)}</a>`;
    plain = linkInfo.href;
    showToast("Link copied as hyperlink!");
  } else {
    html = `<a href="${tabUrl}">${escapeHtml(tabTitle)}</a><br>${escapeHtml(selectedText)}`;
    plain = `${tabUrl}\n${selectedText}`;
    showToast("Tab hyperlink and selected text copied!");
  }
  copyToClipboard(html, plain);
}
