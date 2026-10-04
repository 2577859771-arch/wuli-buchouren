// Only trusted packaged lab pages need inline scripts/styles and embedded WASM.
// Never apply this relaxed policy to /api/* or the AI/auth pages.
const sitePolicy = "default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'";
const labPolicy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self' data:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'";
export function lab3dContentSecurityPolicy(pathname) {
  return pathname.startsWith('/physics-lab/') ? labPolicy : sitePolicy;
}
export function staticAssetPath(pathname) {
  return pathname.endsWith('/') ? pathname + 'index.html' : pathname;
}
