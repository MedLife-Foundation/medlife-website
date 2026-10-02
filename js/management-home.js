(() => {
  const API = "/api/management?resource=content&content_type=page&slug=home&limit=1";

  const text = (value) => String(value ?? "");
  const safeUrl = (value) => {
    try {
      const raw = text(value).trim();
      const url = new URL(raw, location.origin);
      if (url.protocol === "https:" || url.origin === location.origin || url.protocol === "tel:" || url.protocol === "mailto:") return url.href;
    } catch {}
    return "";
  };
  const setText = (selector, value) => {
    const el = document.querySelector(selector);
    if (el && value !== undefined && value !== null) el.textContent = text(value);
  };
  const setRichTitle = (selector, value) => {
    const el = document.querySelector(selector);
    if (!el) return;
    const holder = document.createElement("div");
    holder.innerHTML = text(value);
    holder.querySelectorAll("*").forEach(node => {
      if (node.tagName !== "SPAN") node.replaceWith(document.createTextNode(node.textContent || ""));
      else [...node.attributes].forEach(attr => node.removeAttribute(attr.name));
    });
    el.replaceChildren(...holder.childNodes);
  };
  const setLink = (selector, label, url) => {
    const el = document.querySelector(selector);
    if (!el) return;
    const href = safeUrl(url);
    if (label !== undefined) el.textContent = text(label);
    if (href) el.href = href;
  };
  const setRepeater = (selector, items, render) => {
    const host = document.querySelector(selector);
    if (!host || !Array.isArray(items)) return;
    host.replaceChildren(...items.map((item, index) => render(item, index)).filter(Boolean));
  };
  const make = (tag, className, value) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (value !== undefined) el.textContent = text(value);
    return el;
  };

  function apply(home) {
    if (!home || typeof home !== "object") return;

    const hero = home.hero || {};
    setText(".ml-kicker", hero.kicker);
    setRichTitle(".ml-hero h1", hero.title);
    setText(".ml-hero > .ml-wrap .ml-hero-grid > div:first-child > p", hero.text);
    setLink(".ml-hero .ml-actions a:nth-child(1)", hero.primary_label, hero.primary_url);
    setLink(".ml-hero .ml-actions a:nth-child(2)", hero.secondary_label, hero.secondary_url);

    if (Array.isArray(home.stats)) {
      const stats = [...document.querySelectorAll(".ml-stat-grid .ml-stat")];
      home.stats.slice(0, 4).forEach((item, i) => {
        if (!stats[i]) return;
        const value = stats[i].querySelector("strong");
        const label = stats[i].querySelector("span");
        if (value) value.textContent = text(item?.value);
        if (label) label.textContent = text(item?.label);
        value?.removeAttribute("data-count");
      });
    }

    const about = home.about || {};
    const aboutSection = document.getElementById("about");
    if (aboutSection) {
      const head = aboutSection.querySelector(".ml-heading");
      setText("#about .ml-heading .ml-eyebrow", about.eyebrow);
      setText("#about .ml-heading h2", about.title);
      setText("#about .ml-heading p", about.intro);
      setText("#about .ml-logo-panel h3", about.panel_title);
      setText("#about .ml-logo-panel > p", about.panel_subtitle);
      setRepeater("#about .ml-pill-row", about.pills, (item) => make("span", "ml-pill", item));
      const cards = aboutSection.querySelectorAll(".ml-about .ml-panel");
      if (cards[1]) {
        const heading = cards[1].querySelector("h3");
        const paragraphs = cards[1].querySelectorAll("p");
        if (heading) heading.textContent = text(about.message_title);
        (about.message_paragraphs || []).slice(0, 2).forEach((item, index) => {
          if (paragraphs[index]) paragraphs[index].textContent = text(item);
        });
        setLink("#about .ml-about .ml-panel:nth-child(2) .ml-actions a", about.button_label, about.button_url);
      }
    }

    const programs = home.programs || {};
    setText("#programs .ml-heading .ml-eyebrow", programs.eyebrow);
    setText("#programs .ml-heading h2", programs.title);
    setText("#programs .ml-heading p", programs.intro);
    setRepeater("#programs .ml-program-grid", programs.items, (item, index) => {
      const card = make("article", "ml-program");
      card.append(make("span", "ml-program-number", item?.number || String(index + 1).padStart(2, "0")));
      card.append(make("h3", "", item?.title));
      card.append(make("p", "", item?.text));
      return card;
    });

    const support = home.support || {};
    const supportBlock = document.querySelector(".ml-support");
    if (supportBlock) {
      setText(".ml-support .ml-eyebrow", support.eyebrow);
      setText(".ml-support h2", support.title);
      setText(".ml-support > div:first-child > p", support.text);
      setText(".ml-support-card strong", support.card_title);
      setText(".ml-support-card span", support.card_text);
      setLink(".ml-support .ml-actions a:nth-child(1)", support.primary_label, support.primary_url);
      setLink(".ml-support .ml-actions a:nth-child(2)", support.secondary_label, support.secondary_url);
    }

    const gallery = home.gallery || {};
    setText("#homepageGallery .ml-heading .ml-eyebrow", gallery.eyebrow);
    setText("#homepageGallery .ml-heading h2", gallery.title);
    setText("#homepageGallery .ml-heading p", gallery.intro);
    setLink("#homepageGallery .ml-center a", gallery.button_label, gallery.button_url);
    setRepeater("#homepageGallery [data-home-gallery]", gallery.items, (item) => {
      const url = safeUrl(item?.url);
      if (!url) return null;
      const card = make("article", "ml-gallery-card");
      const img = document.createElement("img");
      img.src = url;
      img.alt = text(item?.alt || item?.title || "صورة من ميدلايف");
      img.loading = "lazy";
      const overlay = make("div", "ml-gallery-overlay");
      overlay.append(make("h3", "", item?.title));
      overlay.append(make("p", "", item?.text));
      card.append(img, overlay);
      return card;
    });

    const portals = home.portals || {};
    const portalSection = document.querySelector(".ml-links-grid")?.closest(".ml-section");
    if (portalSection) {
      const head = portalSection.querySelector(".ml-heading");
      if (head) {
        head.querySelector(".ml-eyebrow")?.replaceChildren(document.createTextNode(text(portals.eyebrow)));
        head.querySelector("h2")?.replaceChildren(document.createTextNode(text(portals.title)));
        head.querySelector("p")?.replaceChildren(document.createTextNode(text(portals.intro)));
      }
      setRepeater(".ml-links-grid", portals.items, (item) => {
        const card = make("article", "ml-link-card");
        card.append(make("h3", "", item?.title));
        card.append(make("p", "", item?.text));
        const link = document.createElement("a");
        link.textContent = text(item?.label);
        const href = safeUrl(item?.url);
        if (!href) return null;
        link.href = href;
        card.append(link);
        return card;
      });
    }

    const social = home.social || {};
    setText("#social .ml-social-head .ml-eyebrow", social.eyebrow);
    setText("#social .ml-social-head h2", social.title);
    setText("#social .ml-social-head p", social.intro);
    setRepeater("#social .ml-social-grid", social.items, (item) => {
      const href = safeUrl(item?.url);
      if (!href) return null;
      const card = make("a", "ml-social-card");
      card.href = href;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      const icon = make("span", "ml-social-icon");
      const i = document.createElement("i");
      const host = (() => { try { return new URL(href).hostname.toLowerCase(); } catch { return ""; } })();
      i.className = host.includes("instagram") ? "fa-brands fa-instagram" : "fa-brands fa-facebook";
      icon.append(i);
      const copy = document.createElement("span");
      copy.append(make("strong", "", item?.title));
      copy.append(make("small", "", item?.label));
      card.append(icon, copy);
      return card;
    });

    const contact = home.contact || {};
    setText("#contact .ml-heading .ml-eyebrow", contact.eyebrow);
    setText("#contact .ml-heading h2", contact.title);
    setText("#contact .ml-heading p", contact.intro);
    setText("#contact .ml-contact-card:nth-child(1) h3", contact.organization_title);
    setText("#contact .ml-contact-card:nth-child(1) .ml-contact-row:nth-of-type(1) span", contact.organization_location);
    setText("#contact .ml-contact-card:nth-child(1) .ml-contact-row:nth-of-type(2) span", contact.organization_note);
    setLink("#contact .ml-contact-card:nth-child(1) a", "صفحة تواصل معنا", contact.organization_url);
    setText("#contact .ml-contact-card:nth-child(2) h3", contact.forum_title);
    setLink("#contact .ml-contact-card:nth-child(2) .ml-contact-row:nth-child(1) a", contact.forum_phone, "tel:" + text(contact.forum_phone).replace(/\s+/g, ""));
    setLink("#contact .ml-contact-card:nth-child(2) .ml-contact-row:nth-child(2) a", contact.forum_mobile, "tel:" + text(contact.forum_mobile).replace(/\s+/g, ""));
    setLink("#contact .ml-contact-card:nth-child(2) .ml-contact-row:nth-child(3) a", contact.forum_email, "mailto:" + text(contact.forum_email));

    setText(".ml-footer", home.footer?.text);
  }

  async function load() {
    try {
      const response = await fetch(API, {headers:{Accept:"application/json"},cache:"no-store"});
      if (!response.ok) return;
      const payload = await response.json();
      const row = Array.isArray(payload?.data) ? payload.data[0] : null;
      if (row?.metadata) apply(row.metadata);
    } catch {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load, {once:true});
  else void load();
})();