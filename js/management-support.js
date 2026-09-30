/* Opt-in live support data from MedLife Management Platform.
   The legacy page remains the fallback when there are no published management cases.
   All values coming from the public API are escaped before entering HTML. */
(function () {
  "use strict";

  const fmt = (value) => new Intl.NumberFormat("en-US").format(Number(value || 0));

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    try {
      const url = new URL(raw, window.location.origin);
      if (url.protocol === "https:" || url.origin === window.location.origin) return url.href;
    } catch (_) {}
    return "";
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  }

  function card(c, open) {
    const amountRequired = Number(c.amount_required || 0);
    const amountSecured = Number(c.amount_secured || 0);
    const statusLabel = open ? (c.status === "supporting" ? "قيد الدعم" : "منشورة") : "مكتملة";
    const actionUrl = safeUrl(c.public_url);
    const action = actionUrl
      ? `<a class="btn primary" href="${escapeHtml(actionUrl)}">${open ? "دعم هذه الحالة" : "عرض الحالة"}</a>`
      : "";

    return `
      <article class="case-card">
        <div class="case-top">
          <span class="case-code">${escapeHtml(c.case_code)}</span>
          <span class="done">${statusLabel}</span>
        </div>
        <div class="case-body">
          <h4>${escapeHtml(c.subject || "حالة دعم")}</h4>
          <div class="amount">${fmt(open ? amountRequired : amountSecured)} <small>${escapeHtml(c.currency || "ل.س")}</small></div>
          <div class="meta">
            <div><b>${open ? fmt(amountRequired) : fmt(amountSecured)}</b>${open ? "المطلوب" : "المساعدة المسجلة"}</div>
            <div><b>${open ? fmt(amountSecured) : "100%"}</b>${open ? "المؤمّن" : "نسبة الإنجاز"}</div>
            <div><b>${escapeHtml(c.category || "—")}</b>نوع الدعم</div>
            <div><b>موثق</b>حالة التحقق</div>
          </div>
          ${action ? `<div class="support-action">${action}</div>` : ""}
        </div>
      </article>
    `;
  }

  async function init() {
    if (!window.MedLifeManagement) return;

    try {
      const result = await window.MedLifeManagement.support({ limit: 50 });
      const rows = Array.isArray(result.data) ? result.data : [];
      if (!rows.length) return;

      const open = rows.filter((row) => row.status === "published" || row.status === "supporting");
      const completed = rows.filter((row) => row.status === "closed");

      setText("statCompleted", completed.length);
      setText(
        "statAmount",
        fmt(completed.reduce((sum, row) => sum + Number(row.amount_secured || 0), 0)),
      );
      setText("statOpen", open.length);

      const completedGrid = document.getElementById("completedGrid");
      if (completedGrid) {
        completedGrid.innerHTML = completed.length
          ? completed.map((row) => card(row, false)).join("")
          : '<div class="empty">لا توجد مساعدات مكتملة منشورة حالياً.</div>';
      }

      const demo = document.querySelector("#completed .demo-banner");
      if (demo) demo.style.display = "none";

      const completedCount = document.querySelector('[data-tab="completed"] .count');
      const openCount = document.querySelector('[data-tab="open"] .count');
      if (completedCount) completedCount.textContent = String(completed.length);
      if (openCount) openCount.textContent = String(open.length);

      const openSection = document.getElementById("open");
      if (openSection) {
        const oldCard = openSection.querySelector(".open-card");
        if (oldCard) oldCard.remove();

        const oldManagementGrid = openSection.querySelector(".management-live-grid");
        if (oldManagementGrid) oldManagementGrid.remove();

        const grid = openSection.querySelector("#openGrid") || (() => {
          const created = document.createElement("div");
          created.className = "completed-grid";
          created.id = "openGrid";
          openSection.appendChild(created);
          return created;
        })();
        grid.className = "completed-grid management-live-grid";
        grid.innerHTML = open.length
          ? open.map((row) => card(row, true)).join("")
          : '<div class="empty">لا توجد حالياً حالات منشورة بحاجة إلى الدعم.</div>';
      }

      const reviewText = document.querySelector("#review .empty");
      if (reviewText) {
        reviewText.textContent =
          "طلبات قيد الدراسة لا تُنشر للعامة. تظهر هنا فقط الحالات التي اعتمدها فريق ميدلايف للنشر.";
      }
    } catch (error) {
      console.warn("Management support integration skipped:", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
