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

function copyLinkAsHtml(url, text) {
  const html = `<a href="${url}">${text || url}</a>`;
  navigator.clipboard.write([
    new ClipboardItem({
      "text/html": new Blob([html], {type: "text/html"}),
      "text/plain": new Blob([url], {type: "text/plain"})
    })
  ]);
  showToast("Link copied as hyperlink!");
}

function copyTabAsHtml() {
  const title = document.title;
  const url = location.href;
  const html = `<a href="${url}">${title}</a>`;
  navigator.clipboard.write([
    new ClipboardItem({
      "text/html": new Blob([html], {type: "text/html"}),
      "text/plain": new Blob([url], {type: "text/plain"})
    })
  ]);
  showToast("Tab link copied as hyperlink!");
}

function showToast(message) {
  let toast = document.createElement("div");
  toast.textContent = message;
  toast.style = "position:fixed;bottom:10%;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:5px;z-index:9999;";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1500);
}
