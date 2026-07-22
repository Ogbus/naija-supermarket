/* Shared admin sidebar behaviour + guard */
function initAdminLayout(activePage) {
  if (!requireAdmin()) return false;
  const user = getStoredUser();
  const nameEl = document.getElementById('admin-user-name');
  if (nameEl && user) nameEl.textContent = user.name;

  document.querySelectorAll('.admin-nav a').forEach(link => {
    if (link.dataset.page === activePage) link.classList.add('active');
  });

  const logoutLink = document.getElementById('admin-logout');
  if (logoutLink) logoutLink.addEventListener('click', (e) => { e.preventDefault(); logoutUser(); });

  return true;
}
