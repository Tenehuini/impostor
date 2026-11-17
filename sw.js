// Cache offline: el juego funciona sin conexión una vez abierto.
const CACHE = 'impostor-v26';
const FILES = [
  './', 'index.html', 'styles.css', 'app.js', 'words.js', 'changelog.js', 'manifest.json',
  'assets/male.jpg', 'assets/female.jpg', 'assets/icon-192.png', 'assets/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Red primero (para recibir actualizaciones); si no hay conexión, usa el caché.
// 'no-cache' obliga a consultar al servidor: si no, el navegador puede mezclar un
// index.html nuevo con un app.js viejo guardado hasta 10 minutos.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const req = new Request(e.request, { cache: 'no-cache' });
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
