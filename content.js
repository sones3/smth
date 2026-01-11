(function() {
  const REQUIRED_PATH = '/uiSNOC/main/service';
  const REQUIRED_PARAM = 'cat=viewTransaction_cs';
  
  function isCorrectPage() {
    return window.location.pathname.includes(REQUIRED_PATH) && 
           window.location.search.includes(REQUIRED_PARAM);
  }

  if (!isCorrectPage()) {
    return;
  }

  function formatDateToDDMMYYYY(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  }

  function showAlert(message) {
    alert(`SNOC Helper: ${message}`);
  }

  function waitForLoaderToFinish(timeout = 30000) {
    return new Promise((resolve, reject) => {
      const loader = document.getElementById('load_list_myTransactionGrid');
      if (!loader) {
        resolve();
        return;
      }

      const startTime = Date.now();
      
      const checkLoader = () => {
        const isVisible = loader.style.display === 'block';
        
        if (!isVisible) {
          resolve();
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout: le chargement a pris trop de temps'));
          return;
        }
        
        setTimeout(checkLoader, 100);
      };
      
      checkLoader();
    });
  }

  function waitForLoaderToStart(timeout = 5000) {
    return new Promise((resolve) => {
      const loader = document.getElementById('load_list_myTransactionGrid');
      if (!loader) {
        resolve();
        return;
      }

      const startTime = Date.now();
      
      const checkLoader = () => {
        const isVisible = loader.style.display === 'block';
        
        if (isVisible) {
          resolve();
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          resolve();
          return;
        }
        
        setTimeout(checkLoader, 50);
      };
      
      checkLoader();
    });
  }

  async function executeSearch() {
    try {
      const result = await chrome.storage.sync.get(['snocDate']);
      
      if (!result.snocDate) {
        showAlert('Date non configurée. Cliquez sur l\'extension pour définir une date.');
        return;
      }

      let clipboardText = '';
      try {
        clipboardText = await navigator.clipboard.readText();
      } catch (e) {
        showAlert('Impossible de lire le presse-papier. Vérifiez les permissions.');
        return;
      }

      if (!clipboardText || clipboardText.trim() === '') {
        showAlert('Le presse-papier est vide.');
        return;
      }

      const formattedDate = formatDateToDDMMYYYY(result.snocDate);

      const fromDateField = document.getElementById('from_date');
      const toDateField = document.getElementById('to_date');
      const msisdnField = document.getElementById('msisdn');
      const submitBtn = document.getElementById('btnSubmit');

      if (!fromDateField || !toDateField || !msisdnField || !submitBtn) {
        showAlert('Champs du formulaire introuvables sur cette page.');
        return;
      }

      fromDateField.value = formattedDate;
      toDateField.value = formattedDate;
      msisdnField.value = clipboardText.trim();

      fromDateField.dispatchEvent(new Event('change', { bubbles: true }));
      toDateField.dispatchEvent(new Event('change', { bubbles: true }));
      msisdnField.dispatchEvent(new Event('change', { bubbles: true }));

      submitBtn.click();

      await waitForLoaderToStart();
      await waitForLoaderToFinish();

      const targetRow = document.getElementById('1');
      
      if (!targetRow) {
        showAlert('Aucun résultat trouvé.');
        return;
      }

      const actionCell = targetRow.querySelector('td[aria-describedby="list_myTransactionGrid_Actions"]');
      
      if (!actionCell) {
        showAlert('Cellule d\'action introuvable dans le résultat.');
        return;
      }

      const onclickValue = actionCell.getAttribute('onclick');
      
      if (onclickValue) {
        const fn = new Function(onclickValue);
        fn.call(actionCell);
      } else {
        const clickableElement = actionCell.querySelector('[onclick]');
        if (clickableElement) {
          const innerOnclick = clickableElement.getAttribute('onclick');
          const fn = new Function(innerOnclick);
          fn.call(clickableElement);
        } else {
          actionCell.click();
        }
      }

    } catch (error) {
      showAlert(`Erreur: ${error.message}`);
    }
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'executeSearch') {
      executeSearch();
      sendResponse({ status: 'started' });
    }
    return true;
  });
})();
