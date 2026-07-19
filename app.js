const STORAGE_KEY = 'best-price-items-v1';
const ITEM_COUNT = 4;
const rowsContainer = document.querySelector('#rows');
const template = document.querySelector('#item-row-template');
const clearButton = document.querySelector('#clear-all');
const refreshIndicator = document.querySelector('#refresh-indicator');
const refreshMessage = refreshIndicator.querySelector('.refresh-message');

const savedItems = readSavedItems();

for (let index = 0; index < ITEM_COUNT; index += 1) {
  const fragment = template.content.cloneNode(true);
  const row = fragment.querySelector('.item-row');
  const price = fragment.querySelector('.price');
  const quantity = fragment.querySelector('.quantity');

  row.dataset.index = String(index);
  fragment.querySelector('.item-number').textContent = `Item ${index + 1}`;
  price.setAttribute('aria-label', `Item ${index + 1} price`);
  quantity.setAttribute('aria-label', `Item ${index + 1} quantity`);
  price.value = savedItems[index]?.price ?? '';
  quantity.value = savedItems[index]?.quantity ?? '';
  rowsContainer.append(fragment);
}

function calculate() {
  const rows = [...document.querySelectorAll('.item-row')];
  const items = rows.map((row) => {
    const priceInput = row.querySelector('.price');
    const quantityInput = row.querySelector('.quantity');
    const price = Number.parseFloat(priceInput.value);
    const quantity = Number.parseFloat(quantityInput.value);
    const result = Number.isFinite(price) && Number.isFinite(quantity) && quantity > 0
      ? price / quantity
      : null;

    row.querySelector('.result').textContent = result === null ? '—' : formatPrice(result);
    row.classList.remove('best');
    return { row, price: priceInput.value, quantity: quantityInput.value, result };
  });

  const validResults = items.filter((item) => item.result !== null);
  if (validResults.length >= 2) {
    const lowest = Math.min(...validResults.map((item) => item.result));
    validResults.forEach((item) => {
      if (Math.abs(item.result - lowest) < 0.0000001) item.row.classList.add('best');
    });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(
    items.map(({ price, quantity }) => ({ price, quantity }))
  ));
}

function formatPrice(value) {
  const digits = value < 0.01 ? 4 : value < 1 ? 3 : 2;
  return `$${value.toFixed(digits)}`;
}

function readSavedItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

rowsContainer.addEventListener('input', calculate);
clearButton.addEventListener('click', () => {
  document.querySelectorAll('input').forEach((input) => { input.value = ''; });
  calculate();
  clearButton.blur();
});

calculate();

enablePullToRefresh();

function enablePullToRefresh() {
  const threshold = 72;
  const maximumPull = 120;
  let startX = 0;
  let startY = 0;
  let pulling = false;
  let ready = false;

  window.addEventListener('touchstart', (event) => {
    if (
      window.scrollY > 2
      || event.touches.length !== 1
      || event.target.closest('input, button, a')
    ) {
      pulling = false;
      return;
    }

    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    pulling = true;
    ready = false;
  }, { passive: true });

  window.addEventListener('touchmove', (event) => {
    if (!pulling) return;

    const distance = event.touches[0].clientY - startY;
    const sideways = Math.abs(event.touches[0].clientX - startX);

    if (distance <= 0 || sideways > Math.max(28, distance * 0.8)) {
      resetIndicator();
      pulling = false;
      return;
    }

    event.preventDefault();
    const pull = Math.min(maximumPull, distance * 0.55);
    ready = pull >= threshold;
    refreshIndicator.classList.add('visible');
    refreshIndicator.classList.toggle('ready', ready);
    refreshIndicator.style.transform = `translate(-50%, ${pull - 64}px)`;
    refreshMessage.textContent = ready ? 'Release to refresh' : 'Pull to refresh';
  }, { passive: false });

  const finishPull = () => {
    if (!pulling) return;
    pulling = false;

    if (ready) {
      refreshIndicator.classList.remove('ready');
      refreshIndicator.classList.add('refreshing');
      refreshIndicator.style.transform = 'translate(-50%, 8px)';
      refreshMessage.textContent = 'Refreshing…';
      window.setTimeout(() => window.location.reload(), 180);
      return;
    }

    resetIndicator();
  };

  window.addEventListener('touchend', finishPull);
  window.addEventListener('touchcancel', finishPull);

  function resetIndicator() {
    ready = false;
    refreshIndicator.classList.remove('visible', 'ready', 'refreshing');
    refreshIndicator.style.transform = 'translate(-50%, -76px)';
    refreshMessage.textContent = 'Pull to refresh';
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}
