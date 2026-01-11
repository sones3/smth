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
        console.log('SNOC Helper: Loader non trouvé');
        resolve();
        return;
      }

      const startTime = Date.now();
      let loaderHasAppeared = false;
      const maxWaitForAppearance = 2000;
      
      console.log('SNOC Helper: État initial du loader:', loader.style.display);
      
      const checkLoader = () => {
        const elapsed = Date.now() - startTime;
        
        if (elapsed > timeout) {
          reject(new Error('Timeout: le chargement a pris trop de temps'));
          return;
        }

        const currentDisplay = loader.style.display;
        
        if (currentDisplay === 'block') {
          if (!loaderHasAppeared) {
            console.log('SNOC Helper: Loader apparaît (block)');
          }
          loaderHasAppeared = true;
        }
        
        if (loaderHasAppeared && (currentDisplay === 'none' || currentDisplay === '')) {
          console.log('SNOC Helper: Loader disparu (none)');
          resolve();
          return;
        }
        
        if (!loaderHasAppeared && elapsed > maxWaitForAppearance) {
          console.log('SNOC Helper: Loader n\'est jamais apparu, on continue');
          resolve();
          return;
        }
        
        setTimeout(checkLoader, 100);
      };
      
      checkLoader();
    });
  }

  async function executeSearch() {
    try {
      console.log('SNOC Helper: Début de l\'exécution');
      
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

      fromDateField.focus();
      fromDateField.value = formattedDate;
      fromDateField.dispatchEvent(new Event('input', { bubbles: true }));
      fromDateField.dispatchEvent(new Event('change', { bubbles: true }));
      
      const fromDatePicker = document.querySelector('.datepicker.datepicker-dropdown');
      if (fromDatePicker) {
        fromDatePicker.remove();
      }
      
      document.body.focus();
      
      toDateField.focus();
      toDateField.value = formattedDate;
      toDateField.dispatchEvent(new Event('input', { bubbles: true }));
      toDateField.dispatchEvent(new Event('change', { bubbles: true }));
      
      const toDatePicker = document.querySelector('.datepicker.datepicker-dropdown');
      if (toDatePicker) {
        toDatePicker.remove();
      }
      
      document.body.focus();
      
      msisdnField.value = clipboardText.trim();
      msisdnField.dispatchEvent(new Event('input', { bubbles: true }));
      msisdnField.dispatchEvent(new Event('change', { bubbles: true }));

      submitBtn.click();

      console.log('SNOC Helper: Submit cliqué, attente du loader');

      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        await waitForLoaderToFinish();
      } catch (error) {
        console.log('SNOC Helper: Erreur loader:', error.message);
        return;
      }

      console.log('SNOC Helper: Loader terminé, recherche de la ligne');

      const targetRow = document.getElementById('1');
      
      if (!targetRow) {
        console.log('SNOC Helper: Aucune ligne trouvée');
        return;
      }

      const actionCell = targetRow.querySelector('td[aria-describedby="list_myTransactionGrid_Actions"]');
      
      if (!actionCell) {
        console.log('SNOC Helper: Cellule action introuvable');
        return;
      }

      console.log('SNOC Helper: Cellule action trouvée, tentative de clic');

      const onclickValue = actionCell.getAttribute('onclick');
      
      if (onclickValue) {
        console.log('SNOC Helper: onclick trouvé sur cellule:', onclickValue);
        actionCell.click();
      } else {
        const clickableElement = actionCell.querySelector('[onclick]');
        if (clickableElement) {
          console.log('SNOC Helper: onclick trouvé sur élément enfant');
          clickableElement.click();
        } else {
          console.log('SNOC Helper: Aucun onclick trouvé, clic direct sur cellule');
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
