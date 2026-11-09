// Small helpers: share links on post pages, and the offline-friendly service worker.
(function () {
  var share = document.querySelector('[data-share]');
  if (share) {
    var title = share.getAttribute('data-title') || document.title;
    var url = location.href;
    var wa = share.querySelector('[data-share-whatsapp]');
    var fb = share.querySelector('[data-share-facebook]');
    var copy = share.querySelector('[data-copy]');
    if (wa) {
      wa.href = 'https://wa.me/?text=' + encodeURIComponent(title + ' ' + url);
      wa.target = '_blank';
      wa.rel = 'noopener';
    }
    if (fb) {
      fb.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
      fb.target = '_blank';
      fb.rel = 'noopener';
    }
    if (copy) {
      copy.addEventListener('click', function () {
        var done = function () {
          copy.textContent = 'Link copied';
          setTimeout(function () {
            copy.textContent = 'Copy link';
          }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done, function () {
            window.prompt('Copy this link:', url);
          });
        } else {
          window.prompt('Copy this link:', url);
        }
      });
    }
    share.hidden = false;
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }
})();
