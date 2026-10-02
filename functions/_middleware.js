export async function onRequest(context) {
  let response;
  try {
    response = await context.next();
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return response;

    const path = new URL(context.request.url).pathname.toLowerCase();
    const isArticlesLibrary = path === '/articles' || path === '/articles/' || path.endsWith('/articles.html');
    const isArticlesAdmin = path === '/articles-admin' || path === '/articles-admin/' || path.endsWith('/articles-admin.html');
    const isArticleReader = path === '/article-reader-v5.html' || path.startsWith('/articles/');
    const isSupportPage = path === '/support' || path === '/support/' || path === '/support.html';
    const isContactPage = path === '/contact' || path === '/contact/' || path === '/contact.html';

    if (isArticlesAdmin) {
      let html = await response.text();
      const styleTag = '<link rel="stylesheet" href="/articles-admin-layout.css?v=20260901-3">';
      const scriptTags = [
        '<script src="/articles-admin-actions.js?v=20260901-1" defer></script>',
        '<script src="/articles-admin-ai-cover.js?v=20260901-4" defer></script>',
        '<script src="/articles-admin-canonical-panel.js?v=20260901-2" defer></script>'
      ];
      if (!html.includes('/articles-admin-layout.css')) {
        html = html.includes('</head>') ? html.replace('</head>', `${styleTag}</head>`) : `${styleTag}${html}`;
      }
      for (const tag of scriptTags) {
        const marker = tag.match(/(?:src|href)="([^"]+)/)?.[1] || '';
        if (marker && !html.includes(marker)) {
          html = html.includes('</body>') ? html.replace('</body>', `${tag}</body>`) : `${html}${tag}`;
        }
      }
      const headers = new Headers(response.headers);
      headers.delete('content-length');
      headers.set('cache-control','no-store, no-cache, must-revalidate, max-age=0');
      headers.set('pragma','no-cache');
      return new Response(html,{status:response.status,statusText:response.statusText,headers});
    }

    if (!isArticlesLibrary && !isArticleReader && !isSupportPage && !isContactPage) return response;

    let html = await response.text();
    const tags = [];
    if (isArticlesLibrary) tags.push('<script src="/articles-library-canonical.js?v=20260901-2" defer></script>');
    if (isArticleReader) tags.push('<script src="/article-reader-rich-content.js?v=20260828-1" defer></script>');
    if (isSupportPage) tags.push('<script src="/site-nav.js?v=20260831-support1" defer></script>');
    if (isContactPage) {
      const earlyStyle = '<style id="medlife-contact-no-flash">body>header.hero,body>main.wrap{visibility:hidden!important;opacity:0!important}</style>';
      html = html.includes('</head>') ? html.replace('</head>', `${earlyStyle}</head>`) : `${earlyStyle}${html}`;
      tags.push('<script src="/site-nav.js?v=20260831-contact-final10" defer></script>');
      tags.push('<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="anonymous">');
      tags.push('<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin="anonymous" defer></script>');
      tags.push('<script src="/contact-page-v8.js?v=20260831-contact-final" defer></script>');
      tags.push('<script src="/contact-page-final-4.js?v=20260831-contact-final4" defer></script>');
      tags.push('<script src="/contact-page-final-5.js?v=20260831-contact-final5" defer></script>');
      tags.push('<script src="/contact-page-final-6.js?v=20260831-contact-final6" defer></script>');
      tags.push('<script src="/contact-page-final-7.js?v=20260831-contact-final7" defer></script>');
      tags.push('<script src="/contact-page-final-8.js?v=20260831-contact-final8" defer></script>');
      tags.push('<script src="/contact-page-final-9.js?v=20260831-contact-final9" defer></script>');
      tags.push('<script src="/contact-page-final-10.js?v=20260831-contact-final10" defer></script>');
      tags.push('<script src="/contact-page-nav-final.js?v=20260831-contact-nav-final" defer></script>');
      tags.push('<script src="/contact-social-refinement-v2.js?v=20260831-social-refinement2" defer></script>');
      tags.push('<script src="/contact-social-roles-final.js?v=20260831-social-roles-final" defer></script>');
      tags.push('<script src="/contact-nav-direct-final.js?v=20260831-contact-nav-direct-final" defer></script>');
      tags.push('<script src="/contact-collaboration-center-final.js?v=20260831-contact-collaboration-center-final" defer></script>');
      tags.push('<script src="/contact-ui-align-final.js?v=20260831-contact-ui-align-final" defer></script>');
      tags.push('<script src="/contact-ui-final-fix.js?v=20260831-contact-ui-final-fix" defer></script>');
    }
    const marker = tags.join('');
    if (marker) {
      const alreadyHasAll = tags.every(tag => {
        const src = tag.match(/(?:src|href)="([^"]+)/)?.[1] || '';
        return src && html.includes(src);
      });
      if (!alreadyHasAll) html = html.includes('</body>') ? html.replace('</body>', `${marker}</body>`) : `${html}${marker}`;
    }

    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.set('cache-control','no-store, no-cache, must-revalidate, max-age=0');
    headers.set('pragma','no-cache');
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
  } catch(error) {
    return response || new Response('Middleware error',{status:500});
  }
}
