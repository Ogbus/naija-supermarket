/* Shared header behaviour: auth-aware nav links, cart badge count, mobile menu toggle. */

function initLayout() {
  const user = getStoredUser();
  const loggedIn = !!getAccessToken();

  const authArea = document.getElementById('auth-area');
  if (authArea) {
    if (loggedIn && user) {
      authArea.innerHTML = `
        <a href="/account.html"><span class="label">Hi, ${escapeHtml(user.name.split(' ')[0])}</span></a>
        ${user.role === 'admin' ? '<a href="/admin/dashboard.html"><span class="label">Admin</span></a>' : ''}
        <a href="#" id="logout-link"><span class="label">Log out</span></a>
      `;
      const logoutLink = document.getElementById('logout-link');
      if (logoutLink) logoutLink.addEventListener('click', (e) => { e.preventDefault(); logoutUser(); });
    } else {
      authArea.innerHTML = `<a href="/login.html"><span class="label">Log in</span></a>`;
    }
  }

  refreshCartBadge();

  const navToggle = document.getElementById('nav-toggle');
  const navCategories = document.getElementById('nav-categories');
  if (navToggle && navCategories) {
    navToggle.addEventListener('click', () => navCategories.classList.toggle('open'));
  }

  const searchForm = document.getElementById('search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = new FormData(searchForm).get('q');
      window.location.href = `/index.html?search=${encodeURIComponent(q || '')}`;
    });
  }
}

async function refreshCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  if (!getAccessToken()) { badge.textContent = '0'; return; }
  try {
    const data = await api.get('/cart');
    const count = data.items.reduce((sum, i) => sum + i.quantity, 0);
    badge.textContent = String(count);
  } catch {
    badge.textContent = '0';
  }
}

document.addEventListener('DOMContentLoaded', initLayout);
