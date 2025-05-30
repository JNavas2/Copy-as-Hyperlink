/**
 * BACKGROUND.JS of COPY AS HYPERLINK, EXTENSION for MOZILLA FIREFOX
 * SUPPORTS BOTH DESKTOP AND ANDROID, CROSS-PLATFORM ROBUST VERSION
 * © JOHN NAVAS 2025, ALL RIGHTS RESERVED
 */

// Show onboarding or upboarding page on install or update
browser.runtime.onInstalled.addListener((details) => {
  console.log("[background] onInstalled:", details);
  if (details.reason === "install" || details.reason === "update") {
    const url = browser.runtime.getURL("onboarding.html");
    console.log("[background] Opening onboarding page:", url);
    browser.tabs.create({ url });
  }
});

// Listen for browser action (toolbar/extension menu) click
browser.browserAction.onClicked.addListener((tab) => {
  // Inject the main logic into the active tab as a self-invoking function
  browser.tabs.executeScript(tab.id, {
    code: '(' + copyHyperlinkFromPage.toString() + ')();'
  });
});

/**
 * Main function injected into the page.
 * Checks for a selected link or falls back to the page itself,
 * copies as a rich hyperlink to the clipboard,
 * and shows a simulated toast popup for confirmation.
 */
function copyHyperlinkFromPage() {
  // Try to find a selected link in the current selection
  let link = null;
  let text = null;
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    // Traverse up the DOM to see if the selection is inside a link
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
    // If a link is found in the selection, copy it as a rich hyperlink
    const html = `<a href="${link}">${text}</a>`;
    copyHtmlToClipboard(html, link);
    showSimulatedToast("Link copied as hyperlink!");
  } else {
    // Fallback: copy current page's title and URL as a hyperlink
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