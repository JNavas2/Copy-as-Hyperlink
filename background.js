chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "copy-link-as-html",
    title: "Copy as Hyperlink",
    contexts: ["link", "page"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.linkUrl) {
    // Copy selected link as HTML
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: copyLinkAsHtml,
      args: [info.linkUrl, info.selectionText || info.linkText]
    });
  } else {
    // Copy current tab as HTML
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: copyTabAsHtml
    });
  }
});

// These functions run in the context of the web page
function copyLinkAsHtml(url, text) {
  const html = `<a href="${url}">${text || url}</a>`;
  copyHtmlToClipboard(html, url);
  showSimulatedToast("Link copied as hyperlink!");
}

function copyTabAsHtml() {
  const title = document.title;
  const url = location.href;
  const html = `<a href="${url}">${title}</a>`;
  copyHtmlToClipboard(html, url);
  showSimulatedToast("Tab link copied as hyperlink!");
}

function copyHtmlToClipboard(htmlString, plainString) {
  if (navigator.clipboard && window.ClipboardItem) {
    navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([htmlString], {type: "text/html"}),
        "text/plain": new Blob([plainString], {type: "text/plain"})
      })
    ]);
  } else {
    // Fallback for older browsers
    const tempElem = document.createElement("textarea");
    tempElem.value = plainString;
    document.body.appendChild(tempElem);
    tempElem.select();
    document.execCommand("copy");
    document.body.removeChild(tempElem);
  }
}

function showSimulatedToast(message) {
  // Remove any existing toast
  const oldToast = document.getElementById("copy-hyperlink-toast");
  if (oldToast) oldToast.remove();

  const toast = document.createElement("div");
  toast.id = "copy-hyperlink-toast";
  toast.textContent = message;
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

  // Fade in
  setTimeout(() => {
    toast.style.opacity = "1";
  }, 10);

  // Remove after 1.5 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 200);
  }, 1500);
}
