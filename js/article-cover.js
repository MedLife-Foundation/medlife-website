/* Original illustrations for medical articles without an editorial cover. */
(() => {
  const topics = [
    { match: /قرحات? الفم|القلاع|أسنان|الأسنان|اللثة|الفموي|oral|dental|aphthous/i, color: '#147e85', icon: '<path d="M-55-47C-75-26-55 2-49 22C-45 42-45 72-32 76C-19 79-21 31-6 27C9 23 8 79 23 77C38 73 35 44 43 24C51 4 68-20 57-41C45-65 24-64 7-55C-7-48-28-68-45-55Z"/>' },
    { match: /سكري|السكر|[أإا]نسولين|insulin|diabet/i, color: '#996123', icon: '<path d="M0-74C-13-48-58-9-58 23a58 58 0 0 0 116 0C58-9 13-48 0-74Z"/><path d="M-30 18q0 27 24 34" fill="none"/>' },
    { match: /القلب|القلبية|قلبي|ضغط الدم|cardiac|heart/i, color: '#a23957', icon: '<path d="M0 65C-23 45-74 13-70-28C-65-69-22-73 0-41C25-73 68-66 71-30C76 7 31 45 0 65Z"/><path d="M-61 2h31l11-21 18 42 16-32 9 11h35" fill="none"/>' },
    { match: /الرحم|المبيض|تنظيم الأسرة|النسائية|صحة المرأة|الحمل|الولادة|cervi|pregnan/i, color: '#944d76', icon: '<path d="M-36-32Q0-12 36-32Q35-4 17 17Q6 32 6 59H-6Q-6 32-17 17Q-35-4-36-32Z"/><path d="M-32-29Q-75-65-76-22M32-29Q75-65 76-22" fill="none"/><ellipse cx="-70" cy="-14" rx="14" ry="9"/><ellipse cx="70" cy="-14" rx="14" ry="9"/>' },
  ];
  const general = { color: '#325980', icon: '<path d="M-51-65v39a37 37 0 0 0 74 0v-39M-14 11v20a37 37 0 0 0 74 0V9" fill="none"/><circle cx="60" cy="-3" r="12"/><path d="M-52-65h10m53 0h12"/>' };
  const cache = new Map();
  window.medlifeArticleCover = article => {
    const explicit = [article.image_url, article.image].find(url => typeof url === 'string' && url.trim());
    if (explicit) return explicit;
    const title = [article.title_ar, article.title_en, article.title].filter(Boolean).join(' ');
    const topic = topics.find(item => item.match.test(title)) ||
      topics.find(item => item.match.test(article.category || '')) || general;
    if (!cache.has(topic)) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 420" width="960" height="420">
      <defs><linearGradient id="g" x2="1" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="#152640"/><stop offset="1" stop-color="${topic.color}"/></linearGradient><pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.5" fill="white" opacity=".14"/></pattern></defs>
      <rect width="960" height="420" fill="url(#g)"/><rect width="960" height="420" fill="url(#dots)"/>
      <g fill="none" stroke="white" opacity=".16"><circle cx="480" cy="210" r="140"/><circle cx="480" cy="210" r="155"/><path d="M0 312h130l33-26 30 48 25-78 18 56h88m308-210h87l22-37 34 64 22-27h163"/></g>
      <g transform="translate(480 210) scale(1.28)" fill="white" fill-opacity=".14" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${topic.icon}</g></svg>`;
      cache.set(topic, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
    }
    return cache.get(topic);
  };
})();