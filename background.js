/**
 * BACKGROUND.JS of COPY AS HYPERLINK, EXTENSION for MOZILLA FIREFOX
 * SUPPORTS BOTH DESKTOP AND ANDROID, CROSS-PLATFORM ROBUST VERSION
 * © JOHN NAVAS 2025, ALL RIGHTS RESERVED
 */

// background.js for Copy as Hyperlink extension
// Supports Desktop (context menu, shortcut, toolbar) and Android (toolbar only)

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
    // Context menu for right-clicked links
    browser.contextMenus.create({
      id: "copy-as-hyperlink-link",
      title: "Copy as Hyperlink",
      contexts: ["link"]
    });
    // Context menu for page background (not a link)
    browser.contextMenus.create({
      id: "copy-as-hyperlink-page",
      title: "Copy as Hyperlink",
      contexts: ["page"]
    });
  }
});

// Handle context menu clicks
browser.contextMenus && browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "copy-as-hyperlink-link") {
    // User right-clicked a link
    browser.tabs.executeScript(tab.id, {
      code: `(${copyHyperlinkFromPage.toString()})(${JSON.stringify(info.linkUrl)}, null);`
    });
  } else if (info.menuItemId === "copy-as-hyperlink-page") {
    // User right-clicked the page (not a link)
    browser.tabs.executeScript(tab.id, {
      code: `(${copyHyperlinkFromPage.toString()})();`
    });
  }
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
 * If linkUrl is provided, uses that; otherwise, tries to find a selected link or falls back to the page itself.
 * Copies as a rich hyperlink to the clipboard, and shows a simulated toast popup for confirmation.
 */
function copyHyperlinkFromPage(linkUrl, linkText) {
  let link = linkUrl || null;
  let text = linkText || null;

  if (!link) {
    // Try to find a selected link in the current selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
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

  /**
   * Copies both HTML and plain text versions to the clipboard.
   * Uses the modern Clipboard API if available, otherwise falls back to execCommand.
   * @param {string} htmlString - The HTML to copy.
   * @param {string} plainString - The plain text to copy.
   */
  function copyHtmlToClipboard(htmlString, plainString) {
    if (navigator.clipboard && window.ClipboardItem) {
      // Use Clipboard API for rich copy
      navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([htmlString], { type: "text/html" }),
          "text/plain": new Blob([plainString], { type: "text/plain" })
        })
      ]).catch(e => {
        showSimulatedToast("Copy failed: " + e);
      });
    } else {
      // Fallback for older browsers: copy plain text only
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

  /**
   * Simulates a toast popup at the bottom of the page for user feedback.
   * Removes any existing toast, displays the new one, and fades it out after 1.5s.
   * @param {string} message - The message to display in the toast.
   */
  function showSimulatedToast(message) {
    // Remove any existing toast to avoid stacking
    const oldToast = document.getElementById("copy-hyperlink-toast");
    if (oldToast) oldToast.remove();

    // Create the toast element
    const toast = document.createElement("div");
    toast.id = "copy-hyperlink-toast";
    toast.textContent = message;
    toast.setAttribute("aria-live", "polite"); // Accessibility

    // Style the toast for visibility and aesthetics
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

    // Fade in the toast
    setTimeout(() => {
      toast.style.opacity = "1";
    }, 10);

    // Fade out and remove after 1.5 seconds
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 200);
    }, 1500);
  }
}
