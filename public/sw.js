/* MyWords (LinguaLoop) Service Worker
 * 策略说明：
 *  - /api/*           : 仅走网络（AI 代理、云同步不缓存）
 *  - 页面导航          : 网络优先，离线回退到缓存的 '/'
 *  - /_next/static/*  : 缓存优先（带哈希的不可变资源）；热更新 chunk 仅走网络
 *  - 公共静态资源       : 缓存优先（icons / sounds / dicts 等稳定资源）
 *  - 其余同源 GET     : 网络优先，失败时回退缓存
 */
const CACHE_NAME = 'mywords-pwa-v3'
const PRECACHE_URLS = ['/', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((err) => console.warn('[SW] precache failed:', err))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/sounds/') ||
    pathname.startsWith('/dicts/') ||
    /\.(png|jpe?g|gif|svg|ico|webp|woff2?|ttf|mp3|wav|json|pdf)$/i.test(pathname)
  )
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // 仅处理同源请求，跨域（AI 上游等）交给浏览器
  if (url.origin !== self.location.origin) return
  // API 一律走网络，不缓存
  if (url.pathname.startsWith('/api/')) return

  // 开发热更新 chunk：只走网络，避免缓存导致 HMR 失效
  if (url.pathname.includes('.hot-update.')) return

  // 缓存优先（不可变/稳定资源）
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
            }
            return response
          })
      )
    )
    return
  }

  // 网络优先（页面导航与其余请求），离线回退
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() =>
        caches
          .match(request)
          .then((cached) => cached || (request.mode === 'navigate' ? caches.match('/') : undefined))
      )
  )
})
