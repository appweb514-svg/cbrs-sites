(function() {
  const AUTH_KEY = 'cbrs-auth';

  function getAuth() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function isLoggedIn() {
    return !!getAuth();
  }

  function updateAuthLinks() {
    const auth = getAuth();
    document.querySelectorAll('[data-auth-link]').forEach(el => {
      if (auth) {
        el.href = 'admin.html';
        const label = el.querySelector('[data-auth-label]');
        if (label) label.textContent = 'Admin';
        el.setAttribute('data-logged-in', '1');
      } else {
        el.href = 'connexion.html';
        const label = el.querySelector('[data-auth-label]');
        if (label) label.textContent = 'Connexion';
        el.setAttribute('data-logged-in', '0');
      }
    });
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = 'index.html';
  }

  window.CBRS_AUTH = { getAuth, isLoggedIn, logout, updateAuthLinks };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateAuthLinks);
  } else {
    updateAuthLinks();
  }
})();
