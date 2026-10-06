const VAT = 1.25;
const persistent = true;

// 149.7 -> "149,70 kr", 1000 -> "1 000 kr"
const sek = new Intl.NumberFormat('sv-SE', {
  style: 'currency', currency: 'SEK', trailingZeroDisplay: 'stripIfInteger'
});
const kr = n => sek.format(n);

// so labels like "Fish & Chips" or 19" survive being written into the cart
const esc = s => String(s).replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);

// A product is a form with data-label and data-price + an input named quantity:
//   <form data-label="Duck" data-price="50"> <input name="quantity" ...> </form>
// data-id is optional, only needed if two products share the same label
const productForms = () => [...document.forms].filter(form => 'price' in form.dataset);
const productId = form => form.dataset.id || form.dataset.label;

function getCart(restore) {
  const rows = productForms().map(form => {
    const id = productId(form);
    const input = form.elements.quantity;
    if (restore && input) {
      input.value = restore.rows.find(x => x.id === id)?.quantity || 0;
    }
    const label = form.dataset.label || id;
    // accept both 49.90 and 49,90
    const price = parseFloat(form.dataset.price.replace(',', '.')) || 0;
    const quantity = +input?.value || 0;
    return { id, label, price, quantity, rowSum: price * quantity };
  })
    .filter(x => x.quantity > 0)
    .sort((a, b) => a.label.localeCompare(b.label, 'sv'));
  const total = rows.reduce((a, c) => a + c.rowSum, 0);
  const cart = { rows, total, totalExVat: total / VAT };
  if (persistent) { localStorage.cart = JSON.stringify(cart); }
  else { delete localStorage.cart; }
  return cart;
}

// keep: an input inside the cart that is being typed in; it survives the re-render
function renderCart(keep, restore) {
  const { rows, total, totalExVat } = getCart(restore);
  document.querySelector('.cart').innerHTML = !rows.length ?
    `<p class="empty">Din varukorg är tom.</p>` :
    `<table>
      <tbody>
      ${rows.map(({ id, label, price, quantity, rowSum }) => `
        <tr>
          <td>${esc(label)}</td>
          <td>${kr(price)}</td>
          <td><input
            type="number"
            min="0" max="999"
            name="quantity"
            data-id="${esc(id)}"
            aria-label="Antal ${esc(label)}"
            value="${quantity}"
          > st</td>
          <td>${kr(rowSum)}</td>
          <td><button type="button" class="remove" aria-label="Ta bort ${esc(label)}">×</button></td>
        </tr>
      `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <th colspan="3">Summa:</th>
          <th>${kr(total)}</th>
          <td></td>
        </tr>
        <tr>
          <th colspan="3">Exkl. moms:</th>
          <th>${kr(totalExVat)}</th>
          <td></td>
        </tr>
      </tfoot>
    </table>
    <button type="button" class="empty-cart">Töm varukorgen</button>
  `;
  if (keep) {
    // a brand new input would get the caret at the start, so reuse the original node
    [...document.querySelectorAll('.cart input')]
      .find(x => x.dataset.id === keep.dataset.id)?.replaceWith(keep);
    keep.focus();
  }
}

// The product forms are the source of truth, so changing a quantity
// means changing it there (id omitted = all products)
function setQuantity(id, value) {
  for (const form of productForms()) {
    if (id !== undefined && productId(form) !== id) { continue; }
    if (form.elements.quantity) { form.elements.quantity.value = value; }
  }
}

// Pressing Enter in a quantity field would otherwise submit the form and reload the page
document.body.addEventListener('submit', e => e.preventDefault());

document.body.addEventListener('input', ({ target }) => {
  if (!target.matches('input[name="quantity"]')) { return; }
  const inCart = target.closest('.cart');
  // typing in the cart: copy the value to the product form, the source of truth
  if (inCart) { setQuantity(target.dataset.id, target.value); }
  else if (!productForms().includes(target.form)) { return; }
  renderCart(inCart && target);
});

// the X on a cart row and the "empty cart" button: set quantity 0 and re-render
document.body.addEventListener('click', ({ target }) => {
  const button = target.closest('.cart button');
  if (!button) { return; }
  if (button.matches('.remove')) {
    setQuantity(button.closest('tr').querySelector('input').dataset.id, 0);
  }
  else if (button.matches('.empty-cart')) { setQuantity(undefined, 0); }
  else { return; }
  renderCart();
});

renderCart(null, persistent && JSON.parse(localStorage.cart || null));