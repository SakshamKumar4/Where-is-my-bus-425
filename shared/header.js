// WHERE IS MY BUS — shared header profile menu
// Call initProfileMenu() after DOM is ready on any page

export function initProfileMenu() {
  const session = (() => {
    try { return JSON.parse(localStorage.getItem('wimb_session') || 'null'); } catch { return null; }
  })();

  const container = document.getElementById('profile-menu-container');
  if (!container) return;

  if (!session) {
    // Not logged in — show sign in button
    container.innerHTML = `
      <a href="../login_page/code.html"
         class="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all min-h-[44px]">
        <span class="material-symbols-outlined text-base">login</span>
        <span class="hidden sm:inline">Sign In</span>
      </a>`;
    return;
  }

  // Get initials for avatar fallback
  const initials = session.name
    ? session.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const avatarHtml = session.photo
    ? `<img src="${session.photo}" alt="${session.name}" class="size-9 rounded-full object-cover border-2 border-primary"/>`
    : `<div class="size-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-black border-2 border-primary/30">${initials}</div>`;

  container.innerHTML = `
    <div class="relative" id="profile-dropdown-root">
      <button id="profile-btn"
        class="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all min-h-[44px]">
        ${avatarHtml}
        <div class="hidden sm:block text-left">
          <p class="text-sm font-bold leading-tight max-w-[120px] truncate">${session.name || 'User'}</p>
          <p class="text-[10px] text-slate-400 capitalize">${session.role || 'passenger'}</p>
        </div>
        <span class="material-symbols-outlined text-slate-400 text-base">expand_more</span>
      </button>

      <!-- Dropdown -->
      <div id="profile-dropdown"
        class="hidden absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-[200] overflow-hidden">
        <!-- User info -->
        <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <p class="font-bold text-sm truncate">${session.name || 'User'}</p>
          <p class="text-xs text-slate-400 truncate">${session.email || ''}</p>
          <span class="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${session.role === 'driver' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'} capitalize">${session.role || 'passenger'}</span>
        </div>

        <!-- Menu items -->
        <div class="py-1">
          <a href="../user_dashboard/code.html"
            class="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <span class="material-symbols-outlined text-slate-400 text-base">dashboard</span> Dashboard
          </a>
          ${session.role === 'driver' ? `
          <a href="../driver_portal/index.html"
            class="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <span class="material-symbols-outlined text-slate-400 text-base">steering</span> Driver Portal
          </a>` : ''}
          <a href="../live_tracking_map/code.html"
            class="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <span class="material-symbols-outlined text-slate-400 text-base">map</span> Live Map
          </a>
        </div>

        <div class="border-t border-slate-100 dark:border-slate-800 py-1">
          <button id="logout-btn"
            class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <span class="material-symbols-outlined text-base">logout</span> Sign Out
          </button>
        </div>
      </div>
    </div>`;

  // Toggle dropdown
  const btn = document.getElementById('profile-btn');
  const dropdown = document.getElementById('profile-dropdown');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', () => dropdown.classList.add('hidden'));

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('wimb_session');
    window.location.href = '../login_page/code.html';
  });
}
