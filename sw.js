// Offline support: always ask the network for the newest files (bypassing the HTTP cache), fall back to the saved copy offline.
const CACHE='dh-sheets-v2';
const ASSETS=['./','index.html','data/srd-data.js','data/srd-rules.js','manifest.webmanifest','icon.svg','icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
  const same=new URL(e.request.url).origin===self.location.origin;
  e.respondWith(fetch(e.request,same?{cache:'no-cache'}:undefined).then(r=>{if(r.ok||r.type==='opaque'){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})))});
