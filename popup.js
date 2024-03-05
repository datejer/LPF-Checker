const clearCacheBtn = document.getElementById("lpfchecker-clear-cache");
const cacheStatusOutput = document.getElementById("lpfchecker-cache-status");

clearCacheBtn.addEventListener("click", () => {
  chrome.storage.local.clear(() => {
    cacheStatusOutput.textContent = "Cache cleared!";
    cacheStatusOutput.style.color = "green";
  });
});

window.onload = () => {
  chrome.storage.local.get(null, (items) => {
    cacheStatusOutput.textContent = `Cache size: ${Object.keys(items).length}`;
  });
};
