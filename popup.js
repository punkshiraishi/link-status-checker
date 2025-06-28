document.addEventListener('DOMContentLoaded', function() {
  const refreshBtn = document.getElementById('refreshBtn');
  const copyAllBtn = document.getElementById('copyAllBtn');
  const linkList = document.getElementById('linkList');
  let currentLinks = [];

  refreshBtn.addEventListener('click', function() {
    console.log('Link Picker Popup: Refresh button clicked');
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Extracting...';
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      console.log('Link Picker Popup: Sending message to content script');
      chrome.tabs.sendMessage(tabs[0].id, {action: 'extractLinks'}, function(response) {
        refreshBtn.disabled = false;
        refreshBtn.textContent = 'Refresh Links';
        
        if (response && response.links) {
          console.log('Link Picker Popup: Received', response.links.length, 'links from content script');
          currentLinks = response.links;
          displayLinks(response.links);
          copyAllBtn.style.display = response.links.length > 0 ? 'inline-block' : 'none';
        } else {
          console.log('Link Picker Popup: No links received from content script');
          currentLinks = [];
          showNoLinks();
          copyAllBtn.style.display = 'none';
        }
      });
    });
  });

  copyAllBtn.addEventListener('click', function() {
    if (currentLinks.length === 0) return;
    
    const allUrls = currentLinks.map(link => link.url).join('\n');
    copyToClipboard(allUrls, copyAllBtn);
  });

  function displayLinks(links) {
    console.log('Link Picker Popup: Displaying', links.length, 'links in UI');
    
    if (links.length === 0) {
      showNoLinks();
      return;
    }

    linkList.innerHTML = '';
    links.forEach(function(linkData, index) {
      const linkItem = document.createElement('div');
      linkItem.className = 'link-item';
      
      const urlSpan = document.createElement('div');
      urlSpan.className = 'link-url';
      urlSpan.textContent = linkData.url;
      urlSpan.title = linkData.url;
      
      linkItem.appendChild(urlSpan);
      linkList.appendChild(linkItem);
      
      if (index < 5) {
        console.log('Link Picker Popup: Added to UI:', linkData.url);
      }
    });
    
    if (links.length > 5) {
      console.log('Link Picker Popup: ... and', links.length - 5, 'more links');
    }
  }

  function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(function() {
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      button.classList.add('copied');
      
      setTimeout(function() {
        button.textContent = originalText;
        button.classList.remove('copied');
      }, 1500);
    }).catch(function(err) {
      console.error('Failed to copy: ', err);
      button.textContent = 'Error';
      setTimeout(function() {
        button.textContent = 'Copy';
      }, 1500);
    });
  }

  function showNoLinks() {
    linkList.innerHTML = '<div class="no-links">No article links found on page</div>';
  }
});