(function(){
  "use strict";

  const form = document.getElementById("form");
  if (!form) return;

  const SKIP_KEYS = new Set(["password","confirm_password","account_password","email_password"]);
  const style = document.createElement("style");
  style.textContent = [
    "#dynamicMemberForm{margin-top:28px;padding-top:4px}",
    "#dynamicMemberForm .dynamic-intro{margin:0 0 14px;color:#64748b;font-size:11px;line-height:1.8}",
    "#dynamicMemberForm .dynamic-field{margin:0 0 14px}",
    "#dynamicMemberForm .dynamic-field[data-visible=false]{display:none}",
    "#dynamicMemberForm .dynamic-field label{display:block;font-weight:800;color:#151d36;margin-bottom:6px}",
    "#dynamicMemberForm .dynamic-help{margin:0 0 7px;color:#64748b;font-size:10px;line-height:1.7}",
    "#dynamicMemberForm .dynamic-option-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}",
    "#dynamicMemberForm .dynamic-option{display:flex;align-items:flex-start;gap:8px;padding:10px;border:1px solid #e2e8f0;border-radius:11px;background:#fff;font-size:11px}",
    "#dynamicMemberForm .dynamic-option input{width:auto;margin-top:3px}",
    "#dynamicMemberForm .dynamic-section{border-top:1px solid #e2e8f0;padding-top:18px}",
    "#dynamicMemberForm .dynamic-note{margin:0 0 16px;padding:11px 13px;border-radius:12px;background:#f8fafc;color:#64748b;font-size:10px;line-height:1.8}",
    "@media(max-width:700px){#dynamicMemberForm .dynamic-option-grid{grid-template-columns:1fr}}"
  ].join("");
  document.head.appendChild(style);

  const host = document.createElement("section");
  host.id = "dynamicMemberForm";
  host.className = "dynamic-section";
  host.innerHTML =
    '<h2>أسئلة إضافية</h2>' +
    '<p class="dynamic-intro">قد تظهر هنا أسئلة إضافية بحسب الأقسام أو الفرق التي تختارها وبحسب إجاباتك السابقة.</p>' +
    '<div class="dynamic-note">هذه الأسئلة تُدار من لوحة تحكم MedLife، لذلك يمكن تحديثها من الإدارة دون إعادة بناء صفحة الموقع.</div>' +
    '<div id="dynamicMemberFields"></div>';

  const consent = document.getElementById("consent")?.closest(".check");
  if (consent) consent.parentNode.insertBefore(host, consent);
  else form.appendChild(host);

  let currentFormId = null;
  let fields = [];
  let loading = true;

  function cssEscape(value){
    const raw = String(value ?? "");
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(raw);
    return raw.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function keySelector(key){
    return '[data-dynamic-key="' + cssEscape(key) + '"]';
  }

  function selectedUnitIds(){
    return [...form.querySelectorAll('input[name="requested_department"]:checked')]
      .map(x => String(x.dataset.unitId || ""))
      .filter(Boolean);
  }

  function getValue(field){
    const nodes = [...form.querySelectorAll(keySelector(field.field_key))];
    if (!nodes.length) return "";
    if (field.field_type === "multi_select") return nodes.filter(x => x.checked).map(x => x.value);
    if (field.field_type === "boolean") return Boolean(nodes[0].checked);
    return nodes[0].value ?? "";
  }

  function matchesCondition(field){
    const rule = field.visibility || {};
    if (!rule || rule.mode !== "when") return true;
    const controlling = fields.find(x => x.field_key === String(rule.field_key || ""));
    if (!controlling) return false;
    const actual = getValue(controlling);
    const expected = rule.value ?? "";
    if (rule.operator === "not_equals") {
      return Array.isArray(actual) ? !actual.includes(String(expected)) : String(actual) !== String(expected);
    }
    if (rule.operator === "contains") {
      return Array.isArray(actual) ? actual.includes(String(expected)) : String(actual).includes(String(expected));
    }
    return Array.isArray(actual) ? actual.includes(String(expected)) : String(actual) === String(expected);
  }

  function visible(field){
    const targets = Array.isArray(field.target_unit_ids) ? field.target_unit_ids.filter(Boolean) : [];
    const selected = selectedUnitIds();
    const unitMatches = targets.length === 0 || selected.some(id => targets.includes(id));
    return unitMatches && matchesCondition(field);
  }

  function buildOptions(field){
    const options = Array.isArray(field.options) ? field.options : [];
    return options.map(option => ({
      value: String(option.value ?? option.label_ar ?? option.label ?? ""),
      label: String(option.label_ar ?? option.label ?? option.value ?? "")
    })).filter(option => option.value && option.label);
  }

  function renderField(field){
    const wrapper = document.createElement("div");
    wrapper.className = "dynamic-field";
    wrapper.dataset.visible = "true";
    wrapper.dataset.fieldId = field.id;
    const label = document.createElement("label");
    label.textContent = String(field.label_ar || field.field_key);
    if (field.required) label.textContent += " *";
    wrapper.appendChild(label);

    if (field.help_ar) {
      const help = document.createElement("p");
      help.className = "dynamic-help";
      help.textContent = String(field.help_ar);
      wrapper.appendChild(help);
    }

    const type = String(field.field_type || "text");
    if (type === "select") {
      const select = document.createElement("select");
      select.dataset.dynamicKey = field.field_key;
      select.dataset.dynamicField = "true";
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "اختر";
      select.appendChild(placeholder);
      buildOptions(field).forEach(option => {
        const optionNode = document.createElement("option");
        optionNode.value = option.value;
        optionNode.textContent = option.label;
        select.appendChild(optionNode);
      });
      if (field.placeholder_ar) select.setAttribute("aria-label", String(field.placeholder_ar));
      if (field.required) select.required = true;
      wrapper.appendChild(select);
    } else if (type === "multi_select") {
      const grid = document.createElement("div");
      grid.className = "dynamic-option-grid";
      buildOptions(field).forEach((option) => {
        const item = document.createElement("label");
        item.className = "dynamic-option";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = option.value;
        input.dataset.dynamicKey = field.field_key;
        input.dataset.dynamicField = "true";
        const text = document.createElement("span");
        text.textContent = option.label;
        item.append(input, text);
        grid.appendChild(item);
      });
      wrapper.appendChild(grid);
    } else if (type === "boolean") {
      const item = document.createElement("label");
      item.className = "dynamic-option";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = "true";
      input.dataset.dynamicKey = field.field_key;
      input.dataset.dynamicField = "true";
      const text = document.createElement("span");
      text.textContent = field.label_ar || "نعم";
      label.remove();
      wrapper.appendChild(item);
      item.append(input, text);
    } else {
      const input = type === "textarea" ? document.createElement("textarea") : document.createElement("input");
      if (input.tagName === "INPUT") input.type = type;
      input.dataset.dynamicKey = field.field_key;
      input.dataset.dynamicField = "true";
      if (field.placeholder_ar) input.placeholder = String(field.placeholder_ar);
      if (field.required) input.required = true;
      wrapper.appendChild(input);
    }

    return wrapper;
  }

  function refreshVisibility(){
    fields.forEach(field => {
      const wrapper = form.querySelector('[data-field-id="' + cssEscape(field.id) + '"]');
      if (!wrapper) return;
      const show = visible(field);
      wrapper.dataset.visible = show ? "true" : "false";
      wrapper.querySelectorAll("[data-dynamic-field]").forEach(control => {
        if (field.required && field.field_type !== "multi_select" && field.field_type !== "boolean") {
          control.required = show;
        }
        if (field.required && field.field_type === "select") control.required = show;
      });
    });
  }

  function validate(){
    refreshVisibility();
    for (const field of fields) {
      if (!visible(field) || !field.required) continue;
      const value = getValue(field);
      const missing = Array.isArray(value) ? value.length === 0 : field.field_type === "boolean" ? value !== true : !String(value).trim();
      if (missing) {
        const target = form.querySelector(keySelector(field.field_key));
        alert("يرجى تعبئة السؤال: " + String(field.label_ar || field.field_key));
        target?.focus();
        return false;
      }
    }
    return true;
  }

  function getData(){
    refreshVisibility();
    const result = {};
    for (const field of fields) {
      if (!visible(field)) continue;
      const value = getValue(field);
      if (field.field_type === "boolean") {
        result[field.field_key] = Boolean(value);
      } else if (Array.isArray(value) ? value.length : String(value ?? "").trim()) {
        result[field.field_key] = value;
      }
    }
    return result;
  }

  function reset(){
    refreshVisibility();
  }

  async function load(){
    try {
      const response = await fetch("/api/management?resource=join_form", {cache:"no-store"});
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || "تعذر تحميل نموذج الانضمام.");
      const item = Array.isArray(payload.data) ? payload.data[0] : null;
      if (!item || !item.id) throw new Error("لا يوجد نموذج انضمام منشور حالياً.");
      currentFormId = item.id;
      fields = (Array.isArray(item.fields) ? item.fields : []).filter(field => field?.is_active && !SKIP_KEYS.has(String(field.field_key || "")));
      const fieldsHost = document.getElementById("dynamicMemberFields");
      if (fieldsHost) {
        fieldsHost.innerHTML = "";
        if (!fields.length) {
          host.style.display = "none";
        } else {
          host.style.display = "block";
          fields.forEach(field => fieldsHost.appendChild(renderField(field)));
          refreshVisibility();
        }
      }
    } catch (error) {
      console.warn("Dynamic member form unavailable", error);
      host.style.display = "none";
      currentFormId = null;
      fields = [];
    } finally {
      loading = false;
    }
  }

  form.addEventListener("input", refreshVisibility);
  form.addEventListener("change", refreshVisibility);
  form.addEventListener("reset", () => window.setTimeout(reset, 0));

  window.MedLifeDynamicForm = {
    validate,
    getData,
    refresh: refreshVisibility,
    getFormId: () => currentFormId,
    reset,
    isLoading: () => loading
  };

  void load();
})();