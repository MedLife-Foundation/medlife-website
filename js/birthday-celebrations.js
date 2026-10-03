(() => {
  const api = "/api/management?resource=birthdays&today=true";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));

  async function load() {
    try {
      const response = await fetch(api, { headers: { Accept: "application/json" }, cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload?.success || !Array.isArray(payload.data) || !payload.data.length) return;

      const footer = document.querySelector("footer");
      if (!footer || document.getElementById("medlifeBirthdayCelebration")) return;

      const section = document.createElement("section");
      section.id = "medlifeBirthdayCelebration";
      section.className = "section";
      section.innerHTML = `
        <div class="wrap">
          <div class="birthday-celebration">
            <div class="birthday-celebration-copy">
              <span class="eyebrow">🎂 من عائلة ميدلايف</span>
              <h2>اليوم نحتفل بأحد أعضاء فريقنا</h2>
              <p>نتمنى لأعضاء عائلة MedLife الذين يحتفلون اليوم بعيد ميلادهم عاماً جديداً مليئاً بالصحة والإنجاز والأيام الجميلة.</p>
            </div>
            <div class="birthday-celebration-names">
              ${payload.data.map((person) => `
                <div class="birthday-person">
                  <span class="birthday-confetti">🎉</span>
                  <strong>${escapeHtml(person.display_name)}</strong>
                  <small>عيد ميلاد سعيد!</small>
                </div>
              `).join("")}
            </div>
          </div>
        </div>`;

      const style = document.createElement("style");
      style.id = "medlifeBirthdayCelebrationStyle";
      style.textContent = `
        #medlifeBirthdayCelebration{padding:62px 0}
        .birthday-celebration{display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:center;padding:30px;border-radius:26px;background:linear-gradient(135deg,#fff8fa,#fff);border:1px solid #f0d9df;box-shadow:0 18px 50px rgba(21,29,54,.07)}
        .birthday-celebration-copy h2{margin:8px 0 8px;color:#151d36;font-size:clamp(25px,4vw,36px)}
        .birthday-celebration-copy p{margin:0;color:#64748b;line-height:1.95;font-size:13px}
        .birthday-celebration-names{display:grid;gap:10px}
        .birthday-person{display:flex;align-items:center;gap:11px;padding:13px 15px;border:1px solid #f2e0e4;border-radius:15px;background:#fff}
        .birthday-confetti{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:#fff1f4}
        .birthday-person strong{color:#151d36;font-size:13px}
        .birthday-person small{margin-right:auto;color:#b42343;font-size:10px;font-weight:800}
        @media(max-width:760px){.birthday-celebration{grid-template-columns:1fr;padding:22px}.birthday-celebration-copy h2{font-size:26px}}
      `;
      document.head.appendChild(style);
      footer.parentNode.insertBefore(section, footer);
    } catch {
      // Public celebration is optional and should never affect the rest of the site.
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load, { once: true });
  else load();
})();