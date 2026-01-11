document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('dateInput');
  const saveBtn = document.getElementById('saveBtn');
  const currentDateSpan = document.getElementById('currentDate');
  const messageDiv = document.getElementById('message');

  chrome.storage.sync.get(['snocDate'], (result) => {
    if (result.snocDate) {
      currentDateSpan.textContent = result.snocDate;
      dateInput.value = result.snocDate;
    }
  });

  function showMessage(text, isError = false) {
    messageDiv.textContent = text;
    messageDiv.className = 'message ' + (isError ? 'error' : 'success');
    messageDiv.style.display = 'block';
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 2500);
  }

  saveBtn.addEventListener('click', () => {
    const date = dateInput.value;
    
    if (!date) {
      showMessage('Veuillez entrer une date', true);
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      showMessage('Format invalide (YYYY-MM-DD)', true);
      return;
    }

    chrome.storage.sync.set({ snocDate: date }, () => {
      currentDateSpan.textContent = date;
      showMessage('Date sauvegardée !');
    });
  });
});
