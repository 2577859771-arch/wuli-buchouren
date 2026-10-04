// Additive integration: does not replace the site's AI, auth or existing SPA.
const destination = new URL('./lab3d.html', import.meta.url);
const nav = document.querySelector('nav[aria-label="主导航"]');
if (nav && !document.getElementById('lab3d-entry')) {
  const link = document.createElement('a');
  link.id = 'lab3d-entry';
  link.className = 'nav-btn lab3d-entry';
  link.textContent = '3D 实验室';
  const sync = () => {
    const url = new URL(destination);
    const theme = document.documentElement.dataset.theme;
    if (theme === 'dark' || theme === 'light') url.searchParams.set('theme', theme);
    link.href = url.href;
  };
  sync();
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  nav.append(link);
}
