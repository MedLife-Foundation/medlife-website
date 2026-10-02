(() => {
  const items = [
    ['index.html', 'الرئيسية', 'home'],
    ['about-medlife.html', 'عن المؤسسة', 'about'],
    ['index.html#programs', 'مجالات العمل', 'programs'],
    ['articles.html', 'المقالات', 'articles'],
    ['forum-v3.html', 'المنتدى', 'forum'],
    ['gallery.html', 'الصور', 'gallery'],
    ['support.html', 'صندوق الدعم', 'support'],
    ['contact.html', 'تواصل معنا', 'contact']
  ];

  const rawPage = location.pathname.split('/').filter(Boolean).pop() || 'index.html';
  const page = rawPage.endsWith('/') ? rawPage.slice(0, -1) : rawPage;
  const home = page === '' || page === 'index.html';

  const activeKey = () => {
    if (page === 'gallery' || page === 'gallery.html') return 'gallery';
    if (home && location.hash === '#programs') return 'programs';
    if (home && location.hash === '#homepageGallery') return 'gallery';
    if (home) return 'home';
    if (page === 'about-medlife' || page === 'about-medlife.html') return 'about';
    if (page === 'forum-v3' || page === 'forum-v3.html') return 'forum';
    if (page === 'support' || page === 'support.html') return 'support';
    const match = items.find(item => item[0].split('#')[0] === page && !item[0].includes('#'));
    return match ? match[2] : '';
  };

  const setActive = key => {
    document.querySelectorAll('.medlife-global-nav a, .medlife-global-mobile a')
      .forEach(a => a.classList.toggle('active', a.dataset.key === key));
  };

  const removeLegacyHeaders = () => {
    document.querySelectorAll('.medlife-global-header').forEach(el => el.remove());
    document.querySelectorAll('body > header.top, body header.top').forEach(el => el.remove());
    if (page === 'forum-v3.html' || page === 'forum-v3') {
      document.querySelectorAll('body > header.nav').forEach(el => el.remove());
    }
    if (page === 'gallery' || page === 'gallery.html') {
      document.querySelectorAll('body > header.gallery-legacy-header, body > header:not(.medlife-global-header)').forEach(el => el.remove());
    }
    if (page === 'support' || page === 'support.html') {
      document.querySelectorAll('body > header.support-legacy-header').forEach(el => el.remove());
    }
  };

  function build() {
    removeLegacyHeaders();

    const current = activeKey();
    const header = document.createElement('header');
    header.className = 'medlife-global-header';
    header.innerHTML = `
      <div class="medlife-global-wrap">
        <a class="medlife-global-brand" href="/index.html" aria-label="مؤسسة ميدلايف — الرئيسية">
          <img src="/logo.PNG" alt="مؤسسة ميدلايف">
        </a>
        <nav class="medlife-global-nav" aria-label="التنقل الرئيسي">
          ${items.map(([url, label, key]) => `
            <a href="${url}" data-key="${key}" class="${key === current ? 'active' : ''}">${label}</a>
          `).join('')}
        </nav>
        <div class="medlife-global-actions" aria-label="إجراءات العضوية">
          <a class="member" href="/login.html">دخول الأعضاء</a>
          <a class="join" href="/join-options.html">الانضمام</a>
        </div>
        <button class="medlife-global-menu" type="button" aria-label="فتح قائمة التنقل" aria-expanded="false" aria-controls="medlife-global-mobile">القائمة</button>
      </div>
      <div id="medlife-global-mobile" class="medlife-global-mobile" hidden>
        ${items.map(([url, label, key]) => `
          <a href="${url}" data-key="${key}" class="${key === current ? 'active' : ''}">${label}</a>
        `).join('')}
        <a href="/login.html">دخول الأعضاء</a>
        <a class="mobile-join" href="/join-options.html">الانضمام إلى ميدلايف</a>
      </div>
    `;

    document.body.prepend(header);

    if (current === 'forum') {
      const sub = document.createElement('nav');
      sub.className = 'medlife-forum-subnav';
      sub.setAttribute('aria-label', 'تنقل المنتدى');
      sub.innerHTML = `
        <div class="medlife-forum-subnav-inner">
          <a href="#about" data-forum-key="about">عن المنتدى</a>
          <a href="#activities" data-forum-key="activities">الأنشطة</a>
          <a href="#booking" data-forum-key="booking">احجز مساحتك</a>
          <a href="#contact" data-forum-key="contact">تواصل معنا</a>
        </div>`;
      header.insertAdjacentElement('afterend', sub);

      const style = document.createElement('style');
      style.id = 'medlife-forum-subnav-style';
      style.textContent = `
        .medlife-forum-subnav{position:sticky;top:72px;z-index:2400;background:rgba(255,255,255,.97);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid #e8edf3;box-shadow:0 5px 15px rgba(21,29,54,.045);animation:medlifeForumSubnavIn .28s ease-out both}
        .medlife-forum-subnav-inner{width:min(1180px,calc(100% - 28px));min-height:48px;margin:auto;display:flex;align-items:stretch;justify-content:center;gap:3px;overflow-x:auto;scrollbar-width:none}
        .medlife-forum-subnav-inner::-webkit-scrollbar{display:none}
        .medlife-forum-subnav-inner a{position:relative;display:flex;align-items:center;justify-content:center;padding:0 16px;color:#151d36;text-decoration:none;font:800 12px Cairo,sans-serif;white-space:nowrap;transition:color .2s ease,background .2s ease}
        .medlife-forum-subnav-inner a::after{content:"";position:absolute;left:14px;right:14px;bottom:6px;height:2px;border-radius:999px;background:#ff2a54;transform:scaleX(0);transition:transform .2s ease}
        .medlife-forum-subnav-inner a:hover{color:#ff2a54;background:#fff8fa;border-radius:8px}
        .medlife-forum-subnav-inner a.active{color:#ff2a54}
        .medlife-forum-subnav-inner a.active::after{transform:scaleX(1)}
        @keyframes medlifeForumSubnavIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
        @media(max-width:700px){.medlife-forum-subnav{top:64px}.medlife-forum-subnav-inner{justify-content:flex-start}.medlife-forum-subnav-inner a{padding:0 13px;font-size:11px}}
      `;
      document.head.appendChild(style);

      const forumLinks = [...sub.querySelectorAll('[data-forum-key]')];
      const setForumActive = key => forumLinks.forEach(a => a.classList.toggle('active', a.dataset.forumKey === key));
      const sections = forumLinks.map(a => [a.getAttribute('href').slice(1), a.dataset.forumKey]);
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
          const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (visible) setForumActive(visible.target.dataset.forumKey);
        }, {rootMargin:'-26% 0px -58% 0px', threshold:[0,.2,.5,.8]});
        sections.forEach(([id,key]) => {
          const el = document.getElementById(id);
          if (el) { el.dataset.forumKey = key; observer.observe(el); }
        });
      }
      forumLinks.forEach(a => a.addEventListener('click', () => setForumActive(a.dataset.forumKey)));
    }

    if (current === 'support') {
      const sub = document.createElement('nav');
      sub.className = 'medlife-support-subnav';
      sub.setAttribute('aria-label', 'تنقل صندوق الدعم');
      sub.innerHTML = `
        <div class="medlife-support-subnav-inner">
          <a href="support-request.html" data-support-key="request">تقديم طلب مساعدة</a>
          <a href="#cases" data-support-key="cases">استعراض الحالات</a>
          <a href="support-donation.html?case=ML-SUP-2026-016" data-support-key="support">تقديم دعم</a>
        </div>`;
      header.insertAdjacentElement('afterend', sub);

      const style = document.createElement('style');
      style.id = 'medlife-support-subnav-style';
      style.textContent = `
        .medlife-support-subnav{position:sticky;top:72px;z-index:2400;background:rgba(255,255,255,.97);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid #e8edf3;box-shadow:0 5px 15px rgba(21,29,54,.045);animation:medlifeSupportSubnavIn .28s ease-out both}
        .medlife-support-subnav-inner{width:min(1180px,calc(100% - 28px));min-height:48px;margin:auto;display:flex;align-items:stretch;justify-content:center;gap:3px;overflow-x:auto;scrollbar-width:none}
        .medlife-support-subnav-inner::-webkit-scrollbar{display:none}
        .medlife-support-subnav-inner a{position:relative;display:flex;align-items:center;justify-content:center;padding:0 17px;color:#151d36;text-decoration:none;font:800 12px Cairo,sans-serif;white-space:nowrap;transition:color .2s ease,background .2s ease}
        .medlife-support-subnav-inner a::after{content:"";position:absolute;left:14px;right:14px;bottom:6px;height:2px;border-radius:999px;background:#e83255;transform:scaleX(0);transition:transform .2s ease}
        .medlife-support-subnav-inner a:hover{color:#e83255;background:#fff8fa;border-radius:8px}
        .medlife-support-subnav-inner a.active{color:#e83255}
        .medlife-support-subnav-inner a.active::after{transform:scaleX(1)}
        @keyframes medlifeSupportSubnavIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
        @media(max-width:700px){.medlife-support-subnav{top:64px}.medlife-support-subnav-inner{justify-content:flex-start}.medlife-support-subnav-inner a{padding:0 13px;font-size:11px}}
      `;
      document.head.appendChild(style);

      const supportLinks = [...sub.querySelectorAll('[data-support-key]')];
      const setSupportActive = key => supportLinks.forEach(a => a.classList.toggle('active', a.dataset.supportKey === key));
      const sections = supportLinks.filter(a => a.hash).map(a => [a.getAttribute('href').slice(1), a.dataset.supportKey]);
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
          const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (visible) setSupportActive(visible.target.dataset.supportKey);
        }, {rootMargin:'-26% 0px -58% 0px', threshold:[0,.2,.5,.8]});
        sections.forEach(([id,key]) => {
          const el = document.getElementById(id);
          if (el) { el.dataset.supportKey = key; observer.observe(el); }
        });
      }
      setSupportActive(location.hash === '#cases' ? 'cases' : 'request');
      supportLinks.forEach(a => a.addEventListener('click', () => setSupportActive(a.dataset.supportKey)));
    }

    if (!document.getElementById('medlife-global-nav-style')) {
      const style = document.createElement('style');
      style.id = 'medlife-global-nav-style';
      style.textContent = `
        .medlife-global-header{position:sticky;top:0;z-index:2500;background:rgba(255,255,255,.97);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border-bottom:1px solid #e5eaf1;box-shadow:0 8px 24px rgba(21,29,54,.07)}
        .medlife-global-wrap{width:min(1320px,calc(100% - 28px));min-height:72px;margin:auto;display:flex;align-items:center;gap:16px}
        .medlife-global-brand{flex:0 0 auto;display:flex;align-items:center;text-decoration:none;margin-inline-end:2px}.medlife-global-brand img{height:48px;width:auto;display:block;object-fit:contain}
        .medlife-global-nav{flex:1 1 auto;display:flex;align-items:stretch;justify-content:center;gap:2px;min-width:0;min-height:72px}
        .medlife-global-nav a{position:relative;display:flex;align-items:center;padding:0 10px;color:#151d36;text-decoration:none;font:800 12px Cairo,sans-serif;white-space:nowrap;transition:color .2s ease,background .2s ease}
        .medlife-global-nav a::after{content:"";position:absolute;left:10px;right:10px;bottom:9px;height:2px;border-radius:999px;background:#ff2a54;transform:scaleX(0);transition:transform .22s ease}
        .medlife-global-nav a:hover{color:#ff2a54;background:#fff8fa;border-radius:8px}.medlife-global-nav a.active{color:#ff2a54}.medlife-global-nav a.active::after{transform:scaleX(1)}
        .medlife-global-actions{display:flex;flex:0 0 auto;align-items:center;gap:7px}.medlife-global-actions a{display:inline-flex;align-items:center;justify-content:center;border:1px solid #dde4ed;border-radius:10px;padding:8px 11px;color:#151d36;background:#fff;text-decoration:none;font:800 11px Cairo,sans-serif;white-space:nowrap;transition:.2s ease}.medlife-global-actions a:hover{border-color:#ff2a54;color:#ff2a54;transform:translateY(-1px)}.medlife-global-actions .join{background:#ff2a54;border-color:#ff2a54;color:#fff}.medlife-global-actions .join:hover{background:#ea234a;border-color:#ea234a;color:#fff}
        .medlife-global-menu{display:none;border:1px solid #dde4ed;background:#f7f9fc;color:#151d36;border-radius:10px;padding:9px 13px;font:800 12px Cairo,sans-serif;cursor:pointer}
        .medlife-global-mobile{border-top:1px solid #e8edf3;background:#fff;box-shadow:0 10px 20px rgba(21,29,54,.06)}.medlife-global-mobile a{display:block;padding:12px 18px;border-bottom:1px solid #eef2f7;color:#151d36;text-decoration:none;font:800 13px Cairo,sans-serif}.medlife-global-mobile a.active{color:#ff2a54;background:#fff7f9;border-inline-start:3px solid #ff2a54}.medlife-global-mobile .mobile-join{color:#fff;background:#ff2a54;border-inline-start:0;justify-content:center;margin:10px 14px;border-radius:12px;border-bottom:0}
        @media(max-width:1240px){.medlife-global-nav a{padding-inline:7px;font-size:11px}.medlife-global-actions a{padding:9px 10px}.medlife-global-nav{gap:0}}
        @media(max-width:1050px){.medlife-global-nav,.medlife-global-actions{display:none}.medlife-global-menu{display:block;margin-inline-start:auto}.medlife-global-wrap{min-height:64px}.medlife-global-brand img{height:44px}}
        @media(max-width:430px){.medlife-global-wrap{width:calc(100% - 18px)}.medlife-global-brand img{height:40px}.medlife-global-menu{padding:8px 10px}}
      `;
      document.head.appendChild(style);
    }

    const menu = header.querySelector('.medlife-global-menu');
    const mobile = header.querySelector('.medlife-global-mobile');
    menu.addEventListener('click', () => {
      const open = mobile.hidden;
      mobile.hidden = !open;
      menu.setAttribute('aria-expanded', String(open));
    });
    mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mobile.hidden = true;
      menu.setAttribute('aria-expanded', 'false');
    }));

    if (home && 'IntersectionObserver' in window) {
      const sections = [['about', 'about'], ['programs', 'programs'], ['homepageGallery', 'gallery'], ['social', 'contact']];
      const observer = new IntersectionObserver(entries => {
        const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.dataset.navKey);
        else if (!location.hash) setActive('home');
      }, {rootMargin:'-22% 0px -60% 0px', threshold:[0,.2,.4,.6]});
      sections.forEach(([id,key]) => { const el=document.getElementById(id); if(el){el.dataset.navKey=key;observer.observe(el);} });
    }
  }

  window.addEventListener('hashchange', () => setActive(activeKey()));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
