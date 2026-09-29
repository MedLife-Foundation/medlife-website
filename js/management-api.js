/* MedLife Management Platform public API client.
   Public-safe data only. No admin credentials are stored here. */
(function () {
  "use strict";

  const BASE = "/api/management";

  async function request(resource, params) {
    const url = new URL(BASE, window.location.origin);
    url.searchParams.set("resource", resource);
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Accept": "application/json" },
      credentials: "same-origin",
      cache: "no-store"
    });

    const payload = await response.json().catch(() => ({
      success: false,
      error: "Invalid response."
    }));

    if (!response.ok || payload.success === false) {
      throw new Error(payload.error || "تعذر تحميل بيانات ميدلايف.");
    }

    return payload;
  }

  window.MedLifeManagement = Object.freeze({
    list: request,
    content: (params) => request("content", params),
    activities: (params) => request("activities", params),
    campaigns: (params) => request("campaigns", params),
    support: (params) => request("support", params),
    media: (params) => request("media", params)
  });
})();
