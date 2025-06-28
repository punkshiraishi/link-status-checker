document.addEventListener('DOMContentLoaded', function() {
  const openTabBtn = document.getElementById('openTabBtn');

  openTabBtn.addEventListener('click', function() {
    console.log('Link Picker Popup: Opening tab');
    openTabBtn.disabled = true;
    openTabBtn.textContent = 'Opening...';
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTabId = tabs[0].id;
      const tabUrl = chrome.runtime.getURL('tab.html') + '?tabId=' + currentTabId;
      
      chrome.tabs.create({ url: tabUrl }, function() {
        window.close(); // Close the popup
      });
    });
  });
});