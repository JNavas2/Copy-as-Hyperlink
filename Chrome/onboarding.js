// onboarding.js for Copy as Hyperlink extension (Chrome only)
// Handles Remove Extension button logic

document.addEventListener('DOMContentLoaded', function () {
  var removeBtn = document.getElementById('removeBtn');
  if (removeBtn) {
    removeBtn.onclick = function () {
      chrome.tabs.create({ url: "chrome://extensions" });
    };
  }
});
