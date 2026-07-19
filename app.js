const STORAGE_KEY = 'best-price-items-v1';
const ITEM_COUNT = 4;
const rowsContainer = document.querySelector('#rows');
const template = document.querySelector('#item-row-template');
const clearButton = document.querySelector('#clear-all');

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
  document.querySelector('.price').focus();
});

calculate();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}
