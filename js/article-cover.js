(() => {
  const topics = [
    [/قرحات? الفم|القلاع|أسنان|الأسنان|اللثة|الفموي|oral|dental|aphthous/i, 'oral'],
    [/سكري|السكر|[أإا]نسولين|insulin|diabet/i, 'diabetes'],
    [/القلب|القلبي|قلبي|ضغط الدم|cardiac|heart/i, 'heart'],
    [/الرحم|المبيض|تنظيم الأسرة|النسائية|صحة المرأة|الحمل|الولادة|cervi|pregnan/i, 'women'],
    [/طب الأطفال|الأطفال|حديثي الولادة|حديثو الولادة|pediatric|paediatric/i, 'children'],
  ];
  window.medlifeArticleCover = article => {
    const uploaded = [article.image_url, article.image].find(url => typeof url === 'string' && url.trim());
    if (uploaded) return uploaded;
    const title = [article.title_ar, article.title_en, article.title].filter(Boolean).join(' ');
    const findTopic = value => topics.find(([pattern]) => pattern.test(value));
    const topic = findTopic(title) || findTopic(article.category || '');
    return '/images/article-covers/' + (topic?.[1] || 'general') + '.webp';
  };
})();