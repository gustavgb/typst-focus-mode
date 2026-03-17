const activeStates = {};

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === "toggle-focus") {
    let currentTab = tab;

    // Fallback if tab is not passed to the command listener
    if (!currentTab) {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTab = tabs[0];
    }

    if (!currentTab || !currentTab.id) return;

    const tabId = currentTab.id;
    const isCurrentlyOn = activeStates[tabId] || false;

    try {
      if (isCurrentlyOn) {
        await chrome.scripting.removeCSS({
          target: { tabId: tabId },
          files: ["styles.css"]
        });
        activeStates[tabId] = false;
      } else {
        await chrome.scripting.insertCSS({
          target: { tabId: tabId },
          files: ["styles.css"]
        });
        activeStates[tabId] = true;
      }
    } catch (error) {
      console.error("Failed to toggle CSS. Ensure you are on a typst.app/project/* page.", error);
    }
  }
});

// Clean up state when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  delete activeStates[tabId];
});

// Reset state when a tab navigates or reloads (since injected CSS is cleared by the browser)
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    activeStates[tabId] = false;
  }
});
