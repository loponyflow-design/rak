/* RAK app-shell cache. Only handles page navigations — weather/geocoding API
   calls, Google Fonts, and the runtime-generated manifest/icon blob URLs are
   all left untouched and go straight to the network as before. */
var CACHE_NAME = 'rak-shell-v1';
var SHELL_URL = './index.html';

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache){ return cache.add(SHELL_URL); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys()
      .then(function(keys){
        return Promise.all(keys.filter(function(k){ return k!==CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
      })
      .then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  var req = event.request;
  if(req.method!=='GET' || req.mode!=='navigate') return; // only intercept page loads

  event.respondWith(
    fetch(req)
      .then(function(res){
        var resClone = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(SHELL_URL, resClone); });
        return res;
      })
      .catch(function(){ return caches.match(SHELL_URL); })
  );
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({type:'window', includeUncontrolled:true}).then(function(clients){
      for(var i=0;i<clients.length;i++){
        if('focus' in clients[i]) return clients[i].focus();
      }
      if(self.clients.openWindow) return self.clients.openWindow(SHELL_URL);
    })
  );
});
