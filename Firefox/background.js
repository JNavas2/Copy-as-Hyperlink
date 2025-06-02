/**
 * BACKGROUND.JS of COPY AS HYPERLINK, EXTENSION for MOZILLA FIREFOX
 * SUPPORTS BOTH DESKTOP AND ANDROID, CROSS-PLATFORM ROBUST VERSION
 * (c) JOHN NAVAS 2025, ALL RIGHTS RESERVED
 */

// Show onboarding page on install or update
browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install" || details.reason === "update") {
    const url = browser.runtime.getURL("onboarding.html");
    browser.tabs.create({ url });
  }
});

// Add context menu for desktop only
browser.runtime.getPlatformInfo().then(info => {
  if (info.os !== "android") {
    browser.contextMenus.create({
      id: "copy-as-hyperlink",
      title: "Copy as Hyperlink",
      contexts: ["all"]
    });
  }
});

// Handle context menu clicks (always inject with no arguments)
browser.contextMenus && browser.contextMenus.onClicked.addListener((info, tab) => {
  browser.tabs.executeScript(tab.id, {
    code: `(${copyHyperlinkFromPage.toString()})();`
  });
});

// Listen for browser action (toolbar/extension menu) click
browser.browserAction.onClicked.addListener((tab) => {
  browser.tabs.executeScript(tab.id, {
    code: '(' + copyHyperlinkFromPage.toString() + ')();'
  });
});

// Listen for keyboard shortcut command (Desktop only)
browser.commands.onCommand.addListener((command) => {
  if (command === "copy-as-hyperlink") {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs.length > 0) {
        browser.tabs.executeScript(tabs[0].id, {
          code: '(' + copyHyperlinkFromPage.toString() + ')();'
        });
      }
    });
  }
});

/**
 * Main function injected into the page.
 * If a link is selected, copies it as a hyperlink.
 * Otherwise, copies the tab title and URL as a hyperlink.
 */
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
    const html = `<a href="${link}">${text || link}</a>`;
    copyHtmlToClipboard(html, link);
    showSimulatedToast("Link copied as hyperlink!");
  } else {
    const title = document.title;
    const url = location.href;
    const html = `<a href="${url}">${title}</a>`;
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
}
