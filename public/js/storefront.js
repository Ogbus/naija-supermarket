function productCardHtml(p) {
  const outOfStock = p.quantity_in_stock <= 0;
  return `
    <div class="product-card">
      <a href="/product.html?id=${p.id}">
        <div class="product-thumb">
          <img src="${p.image_url || '/images/placeholder.svg'}" alt="${escapeHtml(p.name)}">
        </div>
      </a>
      <span class="stock-tag ${outOfStock ? 'out' : ''}">${outOfStock ? 'Out of stock' : `${p.quantity_in_stock} in stock`}</span>
      <div class="product-body">
        <div class="product-cat">${escapeHtml(p.category_name || '')}</div>
        <a href="/product.html?id=${p.id}" style="color:inherit;text-decoration:none;">
          <div class="product-name">${escapeHtml(p.name)}</div>
        </a>
        <div class="product-unit">Per ${escapeHtml(p.unit)}</div>
        <div class="product-price-row">
          <span class="price">${Number(p.price).toLocaleString('en-NG')}</span>
          <button class="add-btn" data-id="${p.id}" ${outOfStock ? 'disabled' : ''} title="Add to cart">+</button>
        </div>
      </div>
    </div>
  `;
}

async function loadCategories(activeSlug) {
  const row = document.getElementById('chip-row');
  const navLinks = document.getElementById('category-links');
  if (!row) return;
  try {
    const { categories } = await api.get('/products/categories/all');
    row.innerHTML = `<span class="chip ${!activeSlug ? 'active' : ''}" data-slug="">All</span>` +
      categories.map(c => `<span class="chip ${activeSlug === c.slug ? 'active' : ''}" data-slug="${c.slug}">${escapeHtml(c.name)}</span>`).join('');
    row.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const slug = chip.dataset.slug;
        window.location.href = slug ? `/index.html?category=${slug}` : '/index.html';
      });
    });
    if (navLinks) {
      navLinks.innerHTML = categories.map(c => `<a href="/index.html?category=${c.slug}">${escapeHtml(c.name)}</a>`).join('');
    }
  } catch (err) {
    console.error('Failed to load categories', err);
  }
}

async function loadProducts() {
  const grid = document.getElementById('product-grid');
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category') || '';
  const search = params.get('search') || '';

  const titleEl = document.getElementById('grid-title');
  if (search) titleEl.textContent = `Results for "${search}"`;

  await loadCategories(category);

  let query = '';
  if (category) query += `category=${encodeURIComponent(category)}`;
  if (search) query += (query ? '&' : '') + `search=${encodeURIComponent(search)}`;

  try {
    const { products } = await api.get(`/products${query ? '?' + query : ''}`);
    document.getElementById('result-count').textContent = `${products.length} item${products.length === 1 ? '' : 's'}`;

    if (products.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
        <h3>No products found</h3>
        <p>Try a different search or browse another category.</p>
      </div>`;
      return;
    }

    grid.innerHTML = products.map(productCardHtml).join('');
    grid.querySelectorAll('.add-btn').forEach(btn => {
      btn.addEventListener('click', () => addToCart(btn.dataset.id, btn));
    });
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><h3>Couldn't load products</h3><p>${escapeHtml(err.message)}</p></div>`;
  }
}

async function addToCart(productId, btn) {
  if (!getAccessToken()) {
    window.location.href = `/login.html?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    return;
  }
  try {
    if (btn) btn.disabled = true;
    await api.post('/cart', { product_id: Number(productId), quantity: 1 });
    showToast('Added to cart');
    refreshCartBadge();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    if (btn) btn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', loadProducts);
