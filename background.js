chrome.commands.onCommand.addListener((command) => {
  if (command === 'execute-search') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const url = tabs[0].url || '';
        if (url.includes('newsnoc/uiSNOC/main/service') && url.includes('cat=viewTransaction_cs')) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'executeSearch' });
        }
      }
    });
  }
});
