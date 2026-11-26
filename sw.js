// Goose Games: офлайн-кэш.
// Лежит в корне сайта рядом с index.html.
// Первый запуск (онлайн) скачивает всё из списка ниже, дальше сайт и игры открываются без интернета.
// Обновления подтягиваются сами: файл берётся из кэша, а свежая копия качается фоном
// и будет показана при следующем запуске. Номер ниже менять нужно только для полной очистки кэша.

const CACHE = 'goose-games-v2';

const FILES = [
  './',
  'index.html',
  'index_ny_.html',
  'goose-logo.png',
  'goose-logo-newyear.png',

  // игры
  'casino.html',
  'life.html',
  'EraTrader.html',
  'photosynthesis.html',
  'boxtay.html',
  'Funny%20farm.html',
  'GooseRunner.html',

  // обычные иконки
  'casino-icon.png',
  'life-icon.png',
  'trader-icon.png',
  'photosynthesis-icon.png',
  'boxtay-icon.png',
  'farm-icon.png',
  'runner-icon.png',

  // новогодние иконки (если какой-то нет на сайте, она просто пропустится)
  'casino-icon-newyear.png',
  'life-icon-newyear.png',
  'trader-icon-newyear.png',
  'photosynthesis-icon-newyear.png',
  'boxtay-icon-newyear.png',
  'farm-icon-newyear.png',
  'runner-icon-newyear.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // каждый файл по отдельности: если какого-то нет, остальные всё равно сохранятся
      Promise.allSettled(
        FILES.map((url) => cache.add(new Request(url, { cache: 'reload' })))
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);

      // свежая копия фоном; сохраняем только нормальные ответы (не 404)
      const network = fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);

      if (cached) {
        event.waitUntil(network);
        return cached;
      }

      const res = await network;
      if (res) return res;

      // нет интернета и файла нет в кэше: для страниц показываем главную
      if (req.mode === 'navigate') {
        const home = (await cache.match('index.html')) || (await cache.match('./'));
        if (home) return home;
      }
      return new Response('Нет подключения к интернету', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    })
  );
});
