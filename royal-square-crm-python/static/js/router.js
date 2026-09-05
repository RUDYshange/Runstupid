/**
 * Hash routing. No framework, no build step — the URL is the state, so a
 * refresh lands on the same screen and an adviser can bookmark a client file.
 *
 *   #/clients            list
 *   #/clients/{id}       detail, overview tab
 *   #/clients/{id}/goals detail, goals tab
 *   #/claims/{id}        one claim
 */

const routes = [];

export function route(pattern, handler) {
  const names = [];
  const regex = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, name) => {
    names.push(name);
    return '([^/]+)';
  }) + '$');
  routes.push({ regex, names, handler });
}

export function navigate(path) {
  window.location.hash = path;
}

export function start(fallback) {
  const resolve = async () => {
    const path = window.location.hash.slice(1) || '/';
    for (const r of routes) {
      const match = path.match(r.regex);
      if (match) {
        const params = Object.fromEntries(r.names.map((n, i) => [n, match[i + 1]]));
        return r.handler(params);
      }
    }
    return fallback();
  };

  window.addEventListener('hashchange', resolve);
  resolve();
}
