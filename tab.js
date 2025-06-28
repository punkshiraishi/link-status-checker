document.addEventListener('DOMContentLoaded', function() {
  const copyAllBtn = document.getElementById('copyAllBtn');
  const checkStatusBtn = document.getElementById('checkStatusBtn');
  const linkList = document.getElementById('linkList');
  const stats = document.getElementById('stats');
  const statsCount = document.getElementById('statsCount');
  const sourceUrl = document.getElementById('sourceUrl');
  const sourceUrlText = document.getElementById('sourceUrlText');
  const checkControls = document.getElementById('checkControls');
  const filterControls = document.getElementById('filterControls');
  const statusFilter = document.getElementById('statusFilter');
  const intervalInput = document.getElementById('intervalInput');
  let currentLinks = [];

  // Get the tab ID from URL parameters or storage
  const urlParams = new URLSearchParams(window.location.search);
  const sourceTabId = urlParams.get('tabId');

  // Load links automatically when page loads
  loadLinks();

  copyAllBtn.addEventListener('click', function() {
    if (currentLinks.length === 0) return;
    
    // Get only visible (non-hidden) link items
    const visibleLinkItems = linkList.querySelectorAll('.link-item:not(.hidden)');
    const visibleUrls = Array.from(visibleLinkItems).map(function(linkItem) {
      const linkElement = linkItem.querySelector('.link-url a');
      return linkElement ? linkElement.href : '';
    }).filter(url => url !== '');
    
    if (visibleUrls.length === 0) {
      const originalText = copyAllBtn.textContent;
      copyAllBtn.textContent = 'No links to copy';
      setTimeout(function() {
        copyAllBtn.textContent = originalText;
      }, 1500);
      return;
    }
    
    const urlsText = visibleUrls.join('\n');
    copyToClipboard(urlsText, copyAllBtn);
  });

  checkStatusBtn.addEventListener('click', function() {
    if (currentLinks.length === 0) return;
    
    checkStatusBtn.disabled = true;
    checkStatusBtn.textContent = 'Checking...';
    
    checkAllStatus().then(() => {
      checkStatusBtn.disabled = false;
      checkStatusBtn.textContent = 'Check Status';
      // Show filter controls after first status check
      filterControls.style.display = 'flex';
    });
  });

  statusFilter.addEventListener('change', function() {
    filterLinks(statusFilter.value);
    updateCopyButtonLabel(statusFilter.value);
  });

  function loadLinks() {
    linkList.innerHTML = '<div class="loading">Loading links</div>';
    statsCount.textContent = 'Loading links from page...';

    if (sourceTabId) {
      // Get source tab info and send message
      chrome.tabs.get(parseInt(sourceTabId), function(tab) {
        if (tab) {
          displaySourceUrl(tab.url, tab.title);
          chrome.tabs.sendMessage(parseInt(sourceTabId), {action: 'extractLinks'}, function(response) {
            handleLinksResponse(response);
          });
        } else {
          showError('Source tab not found');
        }
      });
    } else {
      // Send message to active tab
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
          displaySourceUrl(tabs[0].url, tabs[0].title);
          chrome.tabs.sendMessage(tabs[0].id, {action: 'extractLinks'}, function(response) {
            handleLinksResponse(response);
          });
        } else {
          showError('No active tab found');
        }
      });
    }
  }

  function handleLinksResponse(response) {
    if (response && response.links) {
      currentLinks = response.links;
      displayLinks(response.links);
      updateStats(response.links.length);
      copyAllBtn.style.display = response.links.length > 0 ? 'inline-block' : 'none';
      checkControls.style.display = response.links.length > 0 ? 'flex' : 'none';
      updateCopyButtonLabel('all');
    } else {
      currentLinks = [];
      showNoLinks();
      copyAllBtn.style.display = 'none';
      checkControls.style.display = 'none';
      filterControls.style.display = 'none';
    }
  }

  function displayLinks(links) {
    if (links.length === 0) {
      showNoLinks();
      return;
    }

    linkList.innerHTML = '';
    links.forEach(function(linkData, index) {
      const linkItem = document.createElement('div');
      linkItem.className = 'link-item';
      linkItem.dataset.index = index;
      
      const urlSpan = document.createElement('div');
      urlSpan.className = 'link-url';
      
      const linkElement = document.createElement('a');
      linkElement.href = linkData.url;
      linkElement.textContent = linkData.url;
      linkElement.title = linkData.url;
      linkElement.target = '_blank';
      linkElement.rel = 'noopener noreferrer';
      
      urlSpan.appendChild(linkElement);
      linkItem.appendChild(urlSpan);
      linkList.appendChild(linkItem);
    });
  }

  function updateStats(count) {
    statsCount.textContent = `Found ${count} article link${count !== 1 ? 's' : ''} on this page`;
  }

  function showNoLinks() {
    linkList.innerHTML = '<div class="no-links">No article links found on page</div>';
    statsCount.textContent = 'No links found';
  }

  function displaySourceUrl(url, title) {
    sourceUrlText.textContent = url;
    sourceUrlText.title = `${title} - ${url}`;
    sourceUrl.style.display = 'block';
  }

  function showError(message) {
    linkList.innerHTML = `<div class="no-links">Error: ${message}</div>`;
    statsCount.textContent = 'Error loading links';
  }

  async function checkAllStatus() {
    const linkItems = linkList.querySelectorAll('.link-item');
    
    for (let i = 0; i < currentLinks.length; i++) {
      const linkItem = linkItems[i];
      const url = currentLinks[i].url;
      
      // Remove existing status if any
      const existingStatus = linkItem.querySelector('.status-code');
      if (existingStatus) {
        existingStatus.remove();
      }
      
      // Add loading status
      const statusSpan = document.createElement('span');
      statusSpan.className = 'status-code status-loading';
      statusSpan.textContent = '...';
      linkItem.appendChild(statusSpan);
      
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          mode: 'cors'
        });
        
        if (response.ok) {
          statusSpan.textContent = response.status;
          statusSpan.className = 'status-code status-200';
        } else if (response.status >= 300 && response.status < 400) {
          statusSpan.textContent = response.status;
          statusSpan.className = 'status-code status-300';
        } else if (response.status >= 400 && response.status < 500) {
          statusSpan.textContent = response.status;
          statusSpan.className = 'status-code status-400';
        } else if (response.status >= 500) {
          statusSpan.textContent = response.status;
          statusSpan.className = 'status-code status-500';
        } else {
          statusSpan.textContent = response.status;
          statusSpan.className = 'status-code status-400';
        }
      } catch (error) {
        // Try with no-cors as fallback for CORS-blocked requests
        try {
          await fetch(url, { 
            method: 'HEAD',
            mode: 'no-cors' 
          });
          statusSpan.textContent = 'CORS';
          statusSpan.className = 'status-code status-300';
        } catch (corsError) {
          statusSpan.textContent = 'Error';
          statusSpan.className = 'status-code status-400';
        }
      }
      
      // Configurable delay to avoid overwhelming servers
      const interval = parseInt(intervalInput.value) || 0;
      if (interval > 0) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
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
      button.textContent = 'Copy Failed';
      setTimeout(function() {
        button.textContent = 'Copy All URLs';
      }, 1500);
    });
  }

  function filterLinks(filterValue) {
    const linkItems = linkList.querySelectorAll('.link-item');
    let visibleCount = 0;
    
    linkItems.forEach(function(linkItem) {
      const statusCode = linkItem.querySelector('.status-code');
      let shouldShow = true;
      
      if (filterValue === 'all') {
        shouldShow = true;
      } else if (filterValue === 'unchecked') {
        shouldShow = !statusCode;
      } else if (statusCode) {
        const statusText = statusCode.textContent;
        const statusClass = statusCode.className;
        
        switch (filterValue) {
          case '200':
            shouldShow = statusClass.includes('status-200');
            break;
          case '300':
            shouldShow = statusClass.includes('status-300');
            break;
          case '400':
            shouldShow = statusClass.includes('status-400');
            break;
          case '500':
            shouldShow = statusClass.includes('status-500');
            break;
          case 'cors':
            shouldShow = statusText === 'CORS';
            break;
          case 'error':
            shouldShow = statusText === 'Error';
            break;
          default:
            shouldShow = true;
        }
      } else {
        shouldShow = false;
      }
      
      if (shouldShow) {
        linkItem.classList.remove('hidden');
        visibleCount++;
      } else {
        linkItem.classList.add('hidden');
      }
    });
    
    // Update stats to show filtered count
    const totalCount = currentLinks.length;
    if (filterValue === 'all') {
      statsCount.textContent = `Found ${totalCount} article link${totalCount !== 1 ? 's' : ''} on this page`;
    } else {
      statsCount.textContent = `Showing ${visibleCount} of ${totalCount} links`;
    }
  }

  function updateCopyButtonLabel(filterValue) {
    let label = '\ud83d\udccb Copy ';
    
    switch (filterValue) {
      case 'all':
        label += 'All URLs';
        break;
      case '200':
        label += 'Success URLs';
        break;
      case '300':
        label += 'Redirect URLs';
        break;
      case '400':
        label += 'Client Error URLs';
        break;
      case '500':
        label += 'Server Error URLs';
        break;
      case 'cors':
        label += 'CORS URLs';
        break;
      case 'error':
        label += 'Error URLs';
        break;
      case 'unchecked':
        label += 'Unchecked URLs';
        break;
      default:
        label += 'URLs';
    }
    
    copyAllBtn.textContent = label;
  }
});