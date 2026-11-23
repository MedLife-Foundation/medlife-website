window.medlifeArticleCover = article => {
  const uploaded = [article.image_url, article.image].find(url => typeof url === 'string' && url.trim());
  return uploaded || '/images/medlife-editorial-cover.webp?v=3';
};
