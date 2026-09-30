(function(){
"use strict";
const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const rich=v=>esc(v).replace(/&lt;span&gt;/g,"<span>").replace(/&lt;\/span&gt;/g,"</span>");
const url=v=>{try{const u=new URL(String(v||""),location.origin);return u.protocol==="https:"||u.origin===location.origin?u.href:""}catch{return""}};
async function getHome(){
  const r=await fetch("/api/management?resource=content&content_type=page&slug=home&limit=1",{headers:{Accept:"application/json"},cache:"no-store"});
  if(!r.ok)throw 0;
  const d=await r.json();
  return Array.isArray(d?.data)?d.data[0]:null;
}
function setText(root,selector,value){const el=root?.querySelector(selector);if(el&&value!==undefined)el.textContent=String(value??"");return el}
function initHome(page){
  const d=page?.metadata;
  if(!d||d.template!=="homepage")return;
  const hero=document.querySelector(".ml-hero");
  if(hero){
    setText(hero,".ml-kicker",d.hero?.kicker);
    const h=hero.querySelector("h1");if(h)h.innerHTML=rich(d.hero?.title||"");
    setText(hero,"p",d.hero?.text);
    const actions=hero.querySelector(".ml-actions");
    if(actions){
      const a=actions.querySelectorAll("a");
      if(a[0]){a[0].textContent=d.hero?.primary_label||"";a[0].href=url(d.hero?.primary_url)||a[0].href}
      if(a[1]){a[1].textContent=d.hero?.secondary_label||"";a[1].href=url(d.hero?.secondary_url)||a[1].href}
    }
  }
  const stats=[...(d.stats||[])];
  document.querySelectorAll(".ml-stat").forEach((el,i)=>{
    const s=stats[i];if(!s)return;
    const strong=el.querySelector("strong"),span=el.querySelector("span");
    if(strong){strong.textContent=s.value||"";strong.dataset.count=s.value||""}
    if(span)span.textContent=s.label||"";
  });
  const about=document.querySelector("#about");
  if(about){
    setText(about,".ml-heading .ml-eyebrow",d.about?.eyebrow);
    setText(about,".ml-heading h2",d.about?.title);
    setText(about,".ml-heading p",d.about?.intro);
    const panels=about.querySelectorAll(".ml-panel");
    if(panels[0]){
      setText(panels[0],"h3",d.about?.panel_title);
      setText(panels[0],"p",d.about?.panel_subtitle);
      const pills=panels[0].querySelector(".ml-pill-row");if(pills)pills.innerHTML=(d.about?.pills||[]).map(x=>"<span class='ml-pill'>"+esc(x)+"</span>").join("");
    }
    if(panels[1]){
      setText(panels[1],"h3",d.about?.message_title);
      const ps=panels[1].querySelectorAll("p");(d.about?.message_paragraphs||[]).slice(0,2).forEach((x,i)=>{if(ps[i])ps[i].textContent=x||""});
      const a=panels[1].querySelector("a");if(a){a.textContent=d.about?.button_label||"";a.href=url(d.about?.button_url)||a.href}
    }
  }
  const programs=document.querySelector("#programs");
  if(programs){
    setText(programs,".ml-heading .ml-eyebrow",d.programs?.eyebrow);
    setText(programs,".ml-heading h2",d.programs?.title);
    setText(programs,".ml-heading p",d.programs?.intro);
    const grid=programs.querySelector(".ml-program-grid");
    if(grid)grid.innerHTML=(d.programs?.items||[]).map(x=>"<article class='ml-program'><span class='ml-program-number'>"+esc(x.number)+"</span><h3>"+esc(x.title)+"</h3><p>"+esc(x.text)+"</p></article>").join("");
  }
  const support=document.querySelector(".ml-support");
  if(support){
    setText(support,".ml-eyebrow",d.support?.eyebrow);
    setText(support,"h2",d.support?.title);
    setText(support,"p",d.support?.text);
    setText(support,".ml-support-card strong",d.support?.card_title);
    setText(support,".ml-support-card span",d.support?.card_text);
    const a=support.querySelectorAll(".ml-actions a");
    if(a[0]){a[0].textContent=d.support?.primary_label||"";a[0].href=url(d.support?.primary_url)||a[0].href}
    if(a[1]){a[1].textContent=d.support?.secondary_label||"";a[1].href=url(d.support?.secondary_url)||a[1].href}
  }
  const gallery=document.querySelector("#homepageGallery");
  if(gallery){
    setText(gallery,".ml-heading .ml-eyebrow",d.gallery?.eyebrow);
    setText(gallery,".ml-heading h2",d.gallery?.title);
    setText(gallery,".ml-heading p",d.gallery?.intro);
    const grid=gallery.querySelector("[data-home-gallery]");
    if(grid && Array.isArray(d.gallery?.items) && d.gallery.items.length){
      grid.innerHTML=d.gallery.items.map(x=>"<article class='ml-gallery-card'><img src='"+(url(x.url)||"")+"' alt='"+esc(x.alt||"")+"' loading='lazy'><div class='ml-gallery-overlay'><h3>"+esc(x.title||"")+"</h3><p>"+esc(x.text||"")+"</p></div></article>").join("");
    }
    const a=gallery.querySelector(".ml-center a");if(a){a.textContent=d.gallery?.button_label||"";a.href=url(d.gallery?.button_url)||a.href}
  }
  const portal=document.querySelector(".ml-links-grid")?.closest(".ml-section");
  if(portal){
    setText(portal,".ml-heading .ml-eyebrow",d.portals?.eyebrow);
    setText(portal,".ml-heading h2",d.portals?.title);
    setText(portal,".ml-heading p",d.portals?.intro);
    const grid=portal.querySelector(".ml-links-grid");
    if(grid)grid.innerHTML=(d.portals?.items||[]).map(x=>"<article class='ml-link-card'><h3>"+esc(x.title||"")+"</h3><p>"+esc(x.text||"")+"</p><a href='"+(url(x.url)||"#")+"'>"+esc(x.label||"")+"</a></article>").join("");
  }
  const social=document.querySelector("#social");
  if(social){
    setText(social,".ml-eyebrow",d.social?.eyebrow);
    setText(social,"h2",d.social?.title);
    setText(social,"p",d.social?.intro);
  }
}
(async()=>{
  if(!document.querySelector(".ml-hero"))return;
  try{const page=await getHome();initHome(page)}
  catch(e){console.warn("Managed homepage fallback active",e)}
})();
})();