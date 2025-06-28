chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'extractLinks') {
    console.log('Link Picker: Starting link extraction...');
    const links = extractArticleLinks();
    console.log('Link Picker: Extraction completed. Found', links.length, 'article links');
    sendResponse({links: links});
  }
});

function extractArticleLinks() {
  const allLinks = document.querySelectorAll('a[href]');
  console.log('Link Picker: Found', allLinks.length, 'total links on page');
  
  const articleLinks = [];
  let filteredCount = 0;

  allLinks.forEach(function(link) {
    const href = link.getAttribute('href');
    const text = link.textContent.trim();
    
    if (isArticleLink(href, text, link)) {
      const fullUrl = new URL(href, window.location.href).href;
      articleLinks.push({
        url: fullUrl,
        text: text
      });
      console.log('Link Picker: Added link:', text || fullUrl);
    } else {
      filteredCount++;
    }
  });

  console.log('Link Picker: Filtered out', filteredCount, 'non-article links');
  console.log('Link Picker: Before deduplication:', articleLinks.length, 'links');
  
  const deduplicatedLinks = removeDuplicates(articleLinks);
  console.log('Link Picker: After deduplication:', deduplicatedLinks.length, 'unique links');
  
  return deduplicatedLinks;
}

function isArticleLink(href, text, linkElement) {
  if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
    return false;
  }

  const excludePatterns = [
    /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i,
    /\.(css|js|json|xml|pdf|zip|rar)$/i,
    /\/(ads?|advertisement|banner|sponsor)/i,
    /doubleclick\.net/i,
    /googleads/i,
    /googlesyndication/i,
    /amazon-adsystem/i,
    /facebook\.com\/tr/i,
    /twitter\.com\/intent/i,
    /mailto:/i,
    /tel:/i,
    /sms:/i
  ];

  for (const pattern of excludePatterns) {
    if (pattern.test(href)) {
      return false;
    }
  }

  const excludeClasses = [
    'ad', 'ads', 'advertisement', 'banner', 'sponsor',
    'social', 'share', 'follow', 'subscribe'
  ];

  const className = linkElement.className.toLowerCase();
  for (const excludeClass of excludeClasses) {
    if (className.includes(excludeClass)) {
      return false;
    }
  }

  if (text.length < 3) {
    return false;
  }

  const parent = linkElement.parentElement;
  if (parent) {
    const parentClass = parent.className.toLowerCase();
    for (const excludeClass of excludeClasses) {
      if (parentClass.includes(excludeClass)) {
        return false;
      }
    }
  }

  return true;
}

function removeDuplicates(links) {
  const seen = new Set();
  const duplicates = [];
  
  const uniqueLinks = links.filter(function(link) {
    if (seen.has(link.url)) {
      duplicates.push(link.url);
      return false;
    }
    seen.add(link.url);
    return true;
  });
  
  if (duplicates.length > 0) {
    console.log('Link Picker: Removed', duplicates.length, 'duplicate links');
  }
  
  return uniqueLinks;
}