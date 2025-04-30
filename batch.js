// Helper function: wait for an element to appear in the DOM
function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      console.log(`Waiting for element: ${selector}`);
      const interval = setInterval(() => {
        const element = document.querySelector(selector);
        // Basic check: element exists and seems attached/rendered
        if (element && (element.offsetParent !== null || document.body.contains(element))) {
          console.log(`Element found: ${selector}`);
          clearInterval(interval);
          resolve(element);
        }
      }, 200);
      setTimeout(() => {
        const element = document.querySelector(selector);
         if (element && (element.offsetParent !== null || document.body.contains(element))) {
           console.log(`Element found on final check: ${selector}`);
           clearInterval(interval);
           resolve(element);
         } else {
          clearInterval(interval);
          console.error(`Timeout waiting for element: ${selector}`);
          reject(new Error(`Timeout waiting for element: ${selector}`));
         }
      }, timeout);
    });
  }
  
  // Helper Function: Check Element Visibility
  function isElementVisible(el) {
    if (!el) return false;
    const isAttached = el.offsetParent !== null || document.body.contains(el);
    if (!isAttached) return false; 
    const hasSize = el.offsetWidth > 0 || el.offsetHeight > 0;
    if (!hasSize && el.tagName.toLowerCase() === 'button') return false;
    const style = window.getComputedStyle(el);
    if (!style || style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.1) {
        return false;
    }
    if (el.tagName.toLowerCase() === 'button' && el.disabled) {
      return false; 
    }
    return true; 
  }
  
  
  // Function that performs the steps for one link
  async function processLink(url) {
    try {
      // --- Wait for the "+ Add" button explicitly ---
      const addButtonSelector = 'button.add-source-button[aria-label="Add source"]'; // Precise selector
      console.log(`Attempting to wait for "${addButtonSelector}" button...`);
      const addButton = await waitForElement(addButtonSelector, 15000);
  
      if (addButton) {
          addButton.click();
          console.log('Clicked "+ Add" button (identified by selector).');
      } else {
          throw new Error('Could not find "+ Add" button after waiting.');
      }
  
      // Wait briefly for the add source menu animation
      await new Promise(resolve => setTimeout(resolve, 500));
  
      // --- Detect URL type and click correct source ---
      let isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
      let sourceTypeSpanText = isYouTube ? 'YouTube' : 'Website';
      console.log(`Processing as ${sourceTypeSpanText} link: ${url}`);
  
      // 1. Find and click the appropriate source type option
      let sourceTypeElement = null;
      const potentialItemsSourceSelector = 'mat-list-item, .mat-mdc-menu-item, mat-chip[id^="mat-mdc-chip"]'; // Include relevant mat-chip
      await waitForElement(potentialItemsSourceSelector, 7000);
  
      const potentialItems = document.querySelectorAll(potentialItemsSourceSelector);
      console.log(`Found ${potentialItems.length} potential source type items.`);
  
       for (const item of potentialItems) {
          let itemText = '';
          const tagName = item.tagName.toLowerCase();
  
          if (tagName === 'mat-list-item' || item.classList.contains('mat-mdc-menu-item')) {
              const textElement = item.querySelector('.mat-mdc-menu-item-text') || item.querySelector('.mdc-list-item__content');
              itemText = (textElement || item).textContent.trim();
          }
          else if (tagName === 'mat-chip') {
               const chipTextElement = item.querySelector('span.mdc-evolution-chip__text-label');
               if (chipTextElement) {
                   const innerSpan = chipTextElement.querySelector('span');
                   itemText = (innerSpan || chipTextElement).textContent.trim();
               }
          }
           else {
               itemText = item.textContent.trim();
          }
  
          if (itemText && itemText.includes(sourceTypeSpanText) && isElementVisible(item)) {
              console.log(`Match found for "${sourceTypeSpanText}" in element:`, item);
              sourceTypeElement = item;
              break;
          }
      }
  
      if (sourceTypeElement) {
        sourceTypeElement.click();
        console.log(`Clicked "${sourceTypeSpanText}" option.`);
      } else {
         const closeButton = document.querySelector('button[aria-label="Close dialog"], button[aria-label="Close"]');
         if(closeButton) closeButton.click();
         console.error(`Could not find visible "${sourceTypeSpanText}". Items checked:`, Array.from(potentialItems).map(el => el.outerHTML.substring(0, 150) + '...'));
        throw new Error(`Could not find visible "${sourceTypeSpanText}" option in the menu after waiting.`);
      }
  
      // Wait briefly for the URL input dialog to appear
      await new Promise(resolve => setTimeout(resolve, 1000));
  
      // 2. Wait for the input element and insert the URL
      const urlInputSelector = 'input[formcontrolname="newUrl"]'; // Use formcontrolname attribute
      const urlInput = await waitForElement(urlInputSelector, 5000);
      if (urlInput) {
        urlInput.value = url;
        urlInput.dispatchEvent(new Event('input', { bubbles: true })); // Trigger input event for framework binding
        console.log(`Entered URL: ${url}`);
  
        // --- NEW: Add 1-second delay after pasting URL ---
        console.log("Waiting 1 second after pasting URL for processing...");
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1000ms = 1 second
        // --- END of new delay ---
  
      } else {
          throw new Error(`Could not find URL input field (selector: ${urlInputSelector}) after waiting.`); // Include selector in error
      }
  
      // --- REMOVED redundant 500ms delay that was here ---
  
      // 3. Find and click the "Insert" or "Add" button
      console.log("Searching for 'Insert' or 'Add' button globally...");
      const allButtonsSelector = 'button'; // Look for any button first
      await waitForElement(allButtonsSelector, 7000); // Wait for *any* button
  
      // Add delay for rendering/animations/state updates
      console.log("Short delay before searching button text...");
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
  
      const allButtons = document.querySelectorAll(allButtonsSelector);
      console.log(`Found ${allButtons.length} button elements total.`);
  
      const visibleButtons = Array.from(allButtons).filter(isElementVisible);
      console.log(`${visibleButtons.length} potentially visible buttons found. Checking text...`);
  
      visibleButtons.forEach((btn, index) => {
          console.log(`Visible button ${index}: Text="${btn.textContent.trim()}", Disabled=${btn.disabled}, HTML=${btn.outerHTML.substring(0,100)}...`);
      });
  
      let insertButton = visibleButtons.find(
          el => /^\s*(Insert|Add)\s*$/.test(el.textContent) // Check text using regex
      );
  
  
      if (insertButton) {
          console.log(`Found target button with text "${insertButton.textContent.trim()}".`);
          if (insertButton.disabled) { // Check if button is disabled
               console.warn(`"${insertButton.textContent.trim()}" button is currently disabled. Waiting...`);
               await new Promise(resolve => setTimeout(resolve, 1500)); // Wait if it was found but disabled
               // Re-fetch the button state
               const updatedButtonState = document.querySelector(allButtonsSelector); // Simplistic re-fetch; might need specific selector if possible
               if (updatedButtonState && updatedButtonState.disabled) { // Check if still disabled
                   throw new Error(`"${insertButton.textContent.trim()}" button remained disabled.`);
               }
                // If it's now enabled (or we couldn't re-check reliably), proceed to click original reference
               console.log("Button appears enabled now or re-check failed, attempting click.");
          }
          insertButton.click();
          console.log(`Clicked "${insertButton.textContent.trim()}" button.`);
      } else {
        console.error("Target 'Insert' or 'Add' button not found among visible buttons.");
        throw new Error('Could not find a visible "Insert" or "Add" button after waiting.');
      }
  
      // Wait for source processing
      console.log("Waiting for source processing to complete (adjust time as needed)...");
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5-second wait, adjust if needed
  
    } catch (error) {
      console.error(`Failed to process link ${url}: ${error.message}`);
      try {
          const closeButton = document.querySelector('mat-dialog-container button[aria-label="Close"], mat-dialog-container button[aria-label="Cancel"], button[aria-label="Close dialog"]');
          if(closeButton && isElementVisible(closeButton)) { // Check if close button is visible too
               console.log("Attempting to close dialog after error...");
               closeButton.click();
               await new Promise(resolve => setTimeout(resolve, 500));
          } else {
               console.warn("Could not find a specific, visible close button after error.");
          }
      } catch (closeError) {
          console.error("Error attempting to close dialog:", closeError);
      }
    }
  }
  
  // Function to loop over a list of links, adding a delay between each
  async function automateInsertLinks(links) {
    console.log(`Starting automation for ${links.length} links.`);
    for (let i = 0; i < links.length; i++) {
      const url = links[i];
      console.log(`--- Processing link ${i + 1} of ${links.length} ---`);
      await processLink(url); // Process the current link
      console.log(`--- Finished processing link ${i + 1} ---`);
  
      // --- DELAY LOGIC START ---
      if (i < links.length - 1) {
        const delaySeconds = 3;
        console.log(`Waiting ${delaySeconds} seconds before processing the next link...`);
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      }
      // --- DELAY LOGIC END ---
  
    }
    console.log('All links processed.');
  }
  
  
  // --- Overlay Code (Unchanged) ---
  (function createLinkInputOverlay() {
    const existingOverlay = document.getElementById('notebooklm-batch-overlay');
      if (existingOverlay) {
          console.log("Overlay already exists. Removing old one.");
          existingOverlay.remove();
      }
    const overlay = document.createElement('div');
    overlay.id = 'notebooklm-batch-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';
    const container = document.createElement('div');
    container.style.backgroundColor = '#fff';
    container.style.padding = '20px';
    container.style.borderRadius = '8px';
    container.style.width = '90%';
    container.style.maxWidth = '500px';
    container.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    container.style.fontFamily = 'sans-serif';
    const header = document.createElement('h3');
    header.textContent = 'Enter Links (one per line)';
    header.style.marginTop = '0';
    header.style.marginBottom = '15px';
    header.style.color = '#333';
    container.appendChild(header);
    const textArea = document.createElement('textarea');
    textArea.id = 'notebooklm-batch-links-input';
    textArea.style.width = '100%';
    textArea.style.height = '200px';
    textArea.style.marginBottom = '15px';
    textArea.style.padding = '10px';
    textArea.style.border = '1px solid #ccc';
    textArea.style.borderRadius = '4px';
    textArea.style.boxSizing = 'border-box';
    textArea.placeholder = 'https://example.com/page1\nhttps://www.youtube.com/watch?v=...\nhttps://docs.google.com/...';
    container.appendChild(textArea);
    const startButton = document.createElement('button');
    startButton.textContent = 'Start Adding Sources';
      startButton.style.display = 'block'; startButton.style.width = '100%';
    startButton.style.marginTop = '10px';
    startButton.style.padding = '12px 20px';
    startButton.style.fontSize = '16px';
      startButton.style.backgroundColor = '#4285F4'; startButton.style.color = 'white'; startButton.style.border = 'none'; startButton.style.borderRadius = '4px'; startButton.style.cursor = 'pointer'; startButton.style.transition = 'background-color 0.3s';
      startButton.onmouseover = () => startButton.style.backgroundColor = '#357ae8'; startButton.onmouseout = () => startButton.style.backgroundColor = '#4285F4';
    container.appendChild(startButton);
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Cancel';
      closeButton.style.display = 'block'; closeButton.style.width = '100%'; closeButton.style.marginTop = '10px'; closeButton.style.padding = '10px 20px'; closeButton.style.fontSize = '14px'; closeButton.style.backgroundColor = '#eee'; closeButton.style.color = '#333'; closeButton.style.border = '1px solid #ccc'; closeButton.style.borderRadius = '4px'; closeButton.style.cursor = 'pointer'; closeButton.style.transition = 'background-color 0.3s';
      closeButton.onmouseover = () => closeButton.style.backgroundColor = '#ddd'; closeButton.onmouseout = () => closeButton.style.backgroundColor = '#eee';
      closeButton.addEventListener('click', function() { if (document.body.contains(overlay)) { document.body.removeChild(overlay); } console.log('Link input cancelled.'); });
      container.appendChild(closeButton);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    startButton.addEventListener('click', function () {
      const rawInput = textArea.value;
      const links = rawInput.split('\n').map(link => link.trim()).filter(link => link !== '' && (link.startsWith('http://') || link.startsWith('https://')));
      if (document.body.contains(overlay)) { document.body.removeChild(overlay); }
      if (links.length > 0) { if (typeof automateInsertLinks === 'function') { setTimeout(() => automateInsertLinks(links), 100); } else { alert('Error: The automateInsertLinks function is not defined.'); console.error('automateInsertLinks function not found.'); } } else { alert('Please enter at least one valid link.'); }
    });
    textArea.focus();
  })();