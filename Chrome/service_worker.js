// service_worker.js for Copy as Hyperlink (Chrome Manifest V3)
// (c) John Navas 2025, All Rights Reserved

// On install or update, open onboarding page
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install" || details.reason === "update") {
    chrome.tabs.create({ url: chrome.runtime.getURL("onboarding.html") });
  }
});

// Create context menu on startup (and on install)
function createContextMenu() {
  chrome.contextMenus.create({
    id: "copy-as-hyperlink",
    title: "Copy as Hyperlink",
    contexts: ["all"]
  });
}
chrome.runtime.onStartup.addListener(createContextMenu);
chrome.runtime.onInstalled.addListener(createContextMenu);

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (tab && tab.id) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyHyperlinkFromPage
    });
  }
});

// Handle toolbar (action) button click
chrome.action.onClicked.addListener((tab) => {
  if (tab && tab.id) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyHyperlinkFromPage
    });
  }
});

// Handle keyboard shortcut command
chrome.commands.onCommand.addListener((command) => {
  if (command === "copy-as-hyperlink") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: copyHyperlinkFromPage
        });
      }
    });
  }
});

// The function injected into the page to copy as hyperlink
function copyHyperlinkFromPage() {
  let link = null;
  let text = null;

  // Try to find a selected link in the current selection
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
    const range = selection.getRangeAt(0);
    let node = range.startContainer;
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "A" && node.href) {
        link = node.href;
        text = node.textContent.trim() || node.href;
        break;
      }
      node = node.parentNode;
    }
  }

  if (link) {
    const html = `<a href="${link}">${escapeHtml(text || link)}</a>`;
    copyHtmlToClipboard(html, link);
    showSimulatedToast("Link copied as hyperlink!");
  } else {
    const title = document.title;
    const url = location.href;
    const html = `<a href="${url}">${escapeHtml(title)}</a>`;
    copyHtmlToClipboard(html, url);
    showSimulatedToast("Tab copied as hyperlink!");
  }

  function copyHtmlToClipboard(htmlString, plainString) {
    if (navigator.clipboard && window.ClipboardItem) {
      navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([htmlString], { type: "text/html" }),
          "text/plain": new Blob([plainString], { type: "text/plain" })
        })
      ]).catch(e => {
        showSimulatedToast("Copy failed: " + e);
      });
    } else {
      const tempElem = document.createElement("textarea");
      tempElem.value = plainString;
      document.body.appendChild(tempElem);
      tempElem.select();
      try {
        document.execCommand("copy");
      } catch (e) {
        showSimulatedToast("Copy failed: " + e);
      }
      document.body.removeChild(tempElem);
    }
  }

  function showSimulatedToast(message) {
    const oldToast = document.getElementById("copy-hyperlink-toast");
    if (oldToast) oldToast.remove();

    const toast = document.createElement("div");
    toast.id = "copy-hyperlink-toast";
    toast.textContent = message;
    toast.setAttribute("aria-live", "polite");
    toast.style.position = "fixed";
    toast.style.bottom = "10%";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = "rgba(60,60,60,0.95)";
    toast.style.color = "#fff";
    toast.style.padding = "12px 24px";
    toast.style.borderRadius = "8px";
    toast.style.fontSize = "16px";
    toast.style.zIndex = "999999";
    toast.style.boxShadow = "0 2px 12px rgba(0,0,0,0.2)";
    toast.style.textAlign = "center";
    toast.style.maxWidth = "80vw";
    toast.style.overflow = "hidden";
    toast.style.whiteSpace = "nowrap";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.2s";

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "1";
    }, 10);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 200);
    }, 1500);
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function (m) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[m];
    });
  }
}
