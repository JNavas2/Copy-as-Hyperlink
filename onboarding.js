// onboarding.js for Copy as Hyperlink extension
// Handles Remove Extension button logic
// © John Navas 2025, All Rights Reserved

document.addEventListener('DOMContentLoaded', function () {
  var btn = document.getElementById('removeBtn');
  if (!btn) return;
  btn.onclick = function () {
    if (typeof browser !== "undefined" && browser.tabs) {
      browser.tabs.create({ url: "about:addons" });
    } else {
      alert("Please open the Firefox Add-ons Manager to remove this extension.");
    }
  };
});
