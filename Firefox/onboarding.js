// onboarding.js for Copy as Hyperlink extension
// Handles Remove Extension button logic
// (c) John Navas 2025, All Rights Reserved

document.addEventListener('DOMContentLoaded', function () {
  var removeBtn = document.getElementById('removeBtn');
  if (removeBtn) {
    removeBtn.onclick = function () {
      if (typeof browser !== "undefined" && browser.tabs) {
        browser.tabs.create({ url: "about:addons" });
      } else {
        alert("Please open the Firefox Add-ons Manager to remove this extension.");
      }
    };
  }
});
