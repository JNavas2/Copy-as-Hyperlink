/**
 * SERVICE_WORKER.JS of COPY AS HYPERLINK, EXTENSION for CHROME
 * (c) JOHN NAVAS 2025, ALL RIGHTS RESERVED
 */

chrome.runtime.onInstalled.addListener((details) => {
  if (["install", "update"].includes(details.reason)) {
    chrome.tabs.create({ url: chrome.runtime.getURL("onboarding.html") });
  }
  createContextMenu();
});

chrome.runtime.onStartup.addListener(createContextMenu);

function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "copy-as-hyperlink",
      title: "Copy as Hyperlink",
      contexts: ["all"]
    });
  });
}

function injectCopyScript(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: copyHyperlinkFromPage
  }, (results) => {
    if (chrome.runtime.lastError) {
      chrome.scripting.executeScript({
        target: { tabId },
        func: (message, bg) => {
          const oldToast = document.getElementById("copy-hyperlink-toast");
          if (oldToast) oldToast.remove();
          const toast = document.createElement("div");
          toast.id = "copy-hyperlink-toast";
          toast.textContent = message;
          toast.setAttribute("aria-live", "polite");
          Object.assign(toast.style, {
            position: "fixed", bottom: "10%", left: "50%",
            transform: "translateX(-50%)", background: bg, color: "#fff",
            padding: "12px 24px", borderRadius: "8px", fontSize: "16px",
            zIndex: "999999", boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
            textAlign: "center", maxWidth: "80vw", overflow: "hidden",
            whiteSpace: "nowrap", opacity: "0", transition: "opacity 0.2s"
          });
          document.body.appendChild(toast);
          setTimeout(() => { toast.style.opacity = "1"; }, 10);
          setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 200);
          }, 1500);
        },
        args: ["Copy as Hyperlink: Cannot access this page.", "#c62828"]
      }, () => {
        if (chrome.runtime.lastError) {
          console.warn("Copy as Hyperlink: " + chrome.runtime.lastError.message);
        }
      });
    }
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (tab?.id) injectCopyScript(tab.id);
});

chrome.action.onClicked.addListener((tab) => {
  if (tab?.id) injectCopyScript(tab.id);
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "copy-as-hyperlink") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) injectCopyScript(tabs[0].id);
    });
  }
});

function copyHyperlinkFromPage() {
  const selection = window.getSelection();
  const tabTitle = document.title, tabUrl = location.href;
  const selectedText = selection && !selection.isCollapsed ? selection.toString().trim() : "";

  // ✅ FIXED - Escapes HTML special characters
  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, m =>
      ({ 
        '&': '&amp;', 
        '<': '&lt;', 
        '>': '&gt;', 
        '"': '&quot;', 
        "'": '&#39;'  // ✅ FIXED - CORRECT numeric entity
      })[m]
    );
  }

  function getSelectedLinkInfo() {
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
    let node = selection.getRangeAt(0).startContainer;
    while (node) {
      if (node.nodeType === 1 && node.tagName === "A" && node.href)
        return { href: node.href, text: node.textContent.trim() || node.href };
      node = node.parentNode;
    }
    return null;
  }

  function showCopyHyperlinkToast(message, bg = "rgba(60,60,60,0.95)") {
    const oldToast = document.getElementById("copy-hyperlink-toast");
    if (oldToast) oldToast.remove();
    const toast = document.createElement("div");
    toast.id = "copy-hyperlink-toast";
    toast.textContent = message;
    toast.setAttribute("aria-live", "polite");
    Object.assign(toast.style, {
      position: "fixed", bottom: "10%", left: "50%",
      transform: "translateX(-50%)", background: bg, color: "#fff",
      padding: "12px 24px", borderRadius: "8px", fontSize: "16px",
      zIndex: "999999", boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
      textAlign: "center", maxWidth: "80vw", overflow: "hidden",
      whiteSpace: "nowrap", opacity: "0", transition: "opacity 0.2s"
    });
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = "1"; }, 10);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 200);
    }, 1500);
  }

  let html, plain, linkInfo = getSelectedLinkInfo();
  if (!selectedText) {
    html = `<a href="${tabUrl}">${escapeHtml(tabTitle)}</a>`;
    plain = tabUrl;
    showCopyHyperlinkToast("Tab copied as hyperlink!");
  } else if (linkInfo) {
    html = `<a href="${linkInfo.href}">${escapeHtml(linkInfo.text)}</a>`;
    plain = linkInfo.href;
    showCopyHyperlinkToast("Link copied as hyperlink!");
  } else {
    html = `<a href="${tabUrl}">${escapeHtml(tabTitle)}</a><br>${escapeHtml(selectedText)}`;
    plain = `${tabUrl}\n${selectedText}`;
    showCopyHyperlinkToast("Tab hyperlink and selected text copied!");
  }

  if (navigator.clipboard && window.ClipboardItem) {
    navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plain], { type: "text/plain" })
      })
    ]).catch(e => showCopyHyperlinkToast("Copy failed: " + e, "#c62828"));
  } else {
    const tempElem = document.createElement("textarea");
    tempElem.value = plain;
    document.body.appendChild(tempElem);
    tempElem.select();
    try { document.execCommand("copy"); }
    catch (e) { showCopyHyperlinkToast("Copy failed: " + e, "#c62828"); }
    document.body.removeChild(tempElem);
  }
}
