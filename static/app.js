(function () {
  const C = {
    bg: "#f7f8fa", surface: "#ffffff", surfaceAlt: "#f1f3f6", border: "#e0e3ea", borderLight: "#eceef3",
    text: "#1e293b", textMuted: "#64748b", textFaint: "#94a3b8", headerBg: "#f0f1f5",
    band1: "#ffffff", band2: "#fafbfc", orderBg: "#f0f4ff",
    stockoutBg: "#fef2f2", stockoutText: "#b91c1c", stockoutBorder: "#fecaca",
    criticalBg: "#fff7ed", criticalText: "#c2410c", criticalBorder: "#fed7aa",
    lowBg: "#fefce8", lowText: "#a16207", lowBorder: "#fef08a",
    healthyBg: "#f0fdf4", healthyText: "#15803d", healthyBorder: "#bbf7d0",
    excessBg: "#faf5ff", excessText: "#7c3aed", excessBorder: "#ddd6fe",
    blue: "#3b82f6", blueLight: "#dbeafe", green: "#10b981", greenLight: "#d1fae5",
    bbdText: "#b45309", bbdBg: "#fffbeb", brand: "#4f46e5", brandLight: "#eef2ff",
    noteBg: "#fefce8", noteBorder: "#fef08a", noteText: "#854d0e",
  };

  const cfg = window.MRP_CONFIG || {};
  const weekLabels = cfg.weekLabels || [];
  const rowTypes = cfg.rowTypes || [];
  const vendors = cfg.vendors || [];
  const noteTags = cfg.noteTags || [];
  const rawSkus = cfg.rawSkus || [];

  function wohStyle(v) {
    if (v < 0) return { bg: C.stockoutBg, color: C.stockoutText, fw: 700 };
    if (v < 2) return { bg: C.criticalBg, color: C.criticalText, fw: 700 };
    if (v < 4) return { bg: C.lowBg, color: C.lowText, fw: 600 };
    if (v > 14) return { bg: C.excessBg, color: C.excessText, fw: 600 };
    return { bg: C.healthyBg, color: C.healthyText, fw: 600 };
  }

  function riskBadge(woh) {
    const mn = Math.min(...woh), mx = Math.max(...woh);
    if (mn < 0) return { label: "STOCKOUT", bg: C.stockoutBg, color: C.stockoutText, border: C.stockoutBorder };
    if (mn < 2) return { label: "CRITICAL", bg: C.criticalBg, color: C.criticalText, border: C.criticalBorder };
    if (mn < 4) return { label: "LOW", bg: C.lowBg, color: C.lowText, border: C.lowBorder };
    if (mx > 14) return { label: "EXCESS", bg: C.excessBg, color: C.excessText, border: C.excessBorder };
    return { label: "HEALTHY", bg: C.healthyBg, color: C.healthyText, border: C.healthyBorder };
  }

  function getTagStyle(key) {
    const t = noteTags.find((x) => x.key === key);
    return t || { color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0", icon: "📝" };
  }

  let state = {
    manualOrders: {},
    showRec: true,
    filterRisk: "all",
    filterVendor: "all",
    search: "",
    hlOn: true,
    chatOpen: true,
    chatMsgs: [{ role: "ai", text: "Hi! I'm your planning copilot. Ask about SKUs, suppliers, trends, issues, notes — or try the quick prompts above." }],
    chatIn: "",
    showIssues: null,
    skuNotes: {
      "10-211": { tags: ["Depleting", "Menu Change"], text: "Running down inventory. Menu removal planned CW12. Do not reorder after current PO arrives.", author: "Sarah", date: "Feb 5" },
      "10-230": { tags: ["Vendor Delay"], text: "FreshRealm confirmed 1-week delay on next PO. Monitor closely for stockout risk.", author: "Prajwal", date: "Feb 6" },
    },
    editingNote: null,
    noteText: "",
    noteTags: [],
    computed: [],
  };

  function initManualOrders() {
    const o = {};
    rawSkus.forEach((s) => { o[s.id] = Array(12).fill(0); });
    return o;
  }

  if (!Object.keys(state.manualOrders).length) state.manualOrders = initManualOrders();

  function apiCompute() {
    return fetch("/api/compute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manualOrders: state.manualOrders }),
    }).then((r) => r.json()).then((data) => data.computed || []);
  }

  function apiCopilot(query, computed, notes) {
    return fetch("/api/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, computed, notes }),
    }).then((r) => r.json()).then((data) => data.text || "");
  }

  function setState(update) {
    Object.assign(state, update);
    render();
  }

  function filteredSkus() {
    let sk = state.computed;
    if (state.search) {
      const t = state.search.toLowerCase();
      sk = sk.filter((s) => s.name.toLowerCase().includes(t) || s.id.includes(t) || s.vendor.toLowerCase().includes(t));
    }
    if (state.filterVendor !== "all") sk = sk.filter((s) => s.vendor === state.filterVendor);
    if (state.filterRisk !== "all") {
      sk = sk.filter((s) => {
        const mn = Math.min(...s.weeksOnHand), mx = Math.max(...s.weeksOnHand);
        if (state.filterRisk === "stockout") return mn < 0;
        if (state.filterRisk === "critical") return mn >= 0 && mn < 2;
        if (state.filterRisk === "low") return mn >= 2 && mn < 4;
        if (state.filterRisk === "excess") return mx > 14;
        if (state.filterRisk === "healthy") return mn >= 4 && mx <= 14;
        if (state.filterRisk === "bbd") return s.bbdRisk.some((b) => b.units > 0);
        if (state.filterRisk === "issues") return s.issues.length > 0;
        if (state.filterRisk === "notes") return !!state.skuNotes[s.id];
        return true;
      });
    }
    return sk;
  }

  function sumStats() {
    const s = state.computed;
    let so = 0, cr = 0, bbU = 0, bbV = 0, inv = 0, oV = 0, oU = 0, ic = 0, nc = Object.keys(state.skuNotes).length;
    s.forEach((sk) => {
      const mn = Math.min(...sk.weeksOnHand);
      if (mn < 0) so++; else if (mn < 2) cr++;
      sk.bbdRisk.forEach((b) => { bbU += b.units; bbV += b.value; });
      inv += sk.currentInvValue;
      sk.effectiveOrders.forEach((o, i) => { if (o > 0) { oU += o; oV += o * sk.pricePerUnit; } });
      ic += sk.issues.length;
    });
    return { so, cr, bbU, bbV, inv, oV, oU, count: s.length, ic, nc };
  }

  function handleOrd(sid, wi, val) {
    const next = { ...state.manualOrders };
    next[sid] = [...(next[sid] || Array(12).fill(0))];
    next[sid][wi] = parseInt(val, 10) || 0;
    state.manualOrders = next;
    apiCompute().then((computed) => { state.computed = computed; render(); });
  }

  function acceptAll(sid) {
    const sk = state.computed.find((x) => x.id === sid);
    if (!sk) return;
    const next = { ...state.manualOrders };
    next[sid] = sk.recommended.map((r, i) => (state.manualOrders[sid][i] > 0 ? state.manualOrders[sid][i] : r));
    state.manualOrders = next;
    apiCompute().then((computed) => { state.computed = computed; render(); });
  }

  function clearAll(sid) {
    const next = { ...state.manualOrders };
    next[sid] = Array(12).fill(0);
    state.manualOrders = next;
    apiCompute().then((computed) => { state.computed = computed; render(); });
  }

  function startEdit(id) {
    const n = state.skuNotes[id];
    state.editingNote = id;
    state.noteText = n ? n.text : "";
    state.noteTags = n ? [...n.tags] : [];
    render();
  }

  function saveNote(id) {
    if (!state.noteText.trim() && state.noteTags.length === 0) {
      const next = { ...state.skuNotes };
      delete next[id];
      state.skuNotes = next;
    } else {
      state.skuNotes = { ...state.skuNotes, [id]: { tags: [...state.noteTags], text: state.noteText.trim(), author: "You", date: "Feb 7" } };
    }
    state.editingNote = null;
    state.noteText = "";
    state.noteTags = [];
    render();
  }

  function deleteNote(id) {
    const next = { ...state.skuNotes };
    delete next[id];
    state.skuNotes = next;
    state.editingNote = null;
    render();
  }

  function toggleTag(t) {
    state.noteTags = state.noteTags.includes(t) ? state.noteTags.filter((x) => x !== t) : [...state.noteTags, t];
    render();
  }

  function sendChat() {
    const input = state.chatIn.trim();
    if (!input) return;
    state.chatMsgs = [...state.chatMsgs, { role: "user", text: input }];
    state.chatIn = "";
    render();
    apiCopilot(input, state.computed, state.skuNotes).then((text) => {
      state.chatMsgs = [...state.chatMsgs, { role: "ai", text }];
      render();
      const el = document.getElementById("chat-end");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    });
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function renderMarkdown(text) {
    return text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");
  }

  function render() {
    const root = document.getElementById("root");
    if (!root) return;

    const filtered = filteredSkus();
    const sum = sumStats();

    root.innerHTML = `
      <header class="header">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:26px;height:26px;border-radius:5px;background:linear-gradient(135deg,${C.brand},#7c3aed);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff">SF</div>
          <span style="font-size:14px;font-weight:700">SupplyFlow</span>
          <span style="font-size:10px;color:${C.textFaint}">MRP Planning Grid</span>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="pill">📅 CW07 · Feb 7, 2026</span>
          <button data-action="toggleChat" class="pill" style="cursor:pointer;background:${state.chatOpen ? C.brandLight : C.surfaceAlt};color:${state.chatOpen ? C.brand : C.textMuted};border:1px solid ${state.chatOpen ? C.brand + "44" : C.border};font-weight:600">💬 Copilot ${state.chatOpen ? "ON" : "OFF"}</button>
        </div>
      </header>

      <div class="summary">
        ${[
          { l: "Inventory", v: `$${(sum.inv / 1000).toFixed(1)}k`, bg: "#f0f4ff", c: C.blue },
          { l: "Stockouts", v: sum.so, bg: C.stockoutBg, c: C.stockoutText },
          { l: "Critical", v: sum.cr, bg: C.criticalBg, c: C.criticalText },
          { l: "BBD Risk", v: `${sum.bbU.toLocaleString()} ($${(sum.bbV / 1000).toFixed(1)}k)`, bg: C.bbdBg, c: C.bbdText },
          { l: "Issues", v: sum.ic, bg: "#fef2f2", c: "#b91c1c" },
          { l: "Notes", v: sum.nc, bg: C.noteBg, c: C.noteText },
          { l: "Orders", v: `$${(sum.oV / 1000).toFixed(1)}k`, bg: C.healthyBg, c: C.healthyText },
        ].map((c) => `<div class="summary-cell" style="background:${c.bg}"><div class="label">${escapeHtml(c.l)}</div><div class="value" style="color:${c.c}">${escapeHtml(String(c.v))}</div></div>`).join("")}
      </div>

      <div class="toolbar">
        <div style="display:flex;align-items:center;gap:6px">
          <div style="position:relative">
            <input type="text" placeholder="Search..." value="${escapeHtml(state.search)}" data-binding="search" style="background:${C.surfaceAlt};border:1px solid ${C.border};border-radius:5px;padding:4px 8px 4px 22px;font-size:10px;color:${C.text};width:140px" />
            <span style="position:absolute;left:6px;top:50%;transform:translateY(-50%);font-size:10px;color:${C.textFaint}">🔍</span>
          </div>
          <select data-binding="filterVendor" style="background:${C.surfaceAlt};border:1px solid ${C.border};border-radius:5px;padding:4px 6px;font-size:10px;color:${C.text};cursor:pointer">
            <option value="all">All Suppliers</option>
            ${vendors.map((v) => `<option value="${escapeHtml(v)}" ${state.filterVendor === v ? "selected" : ""}>${escapeHtml(v)}</option>`).join("")}
          </select>
          <div style="display:flex;gap:2px">
            ${[
              { k: "all", l: "All" }, { k: "stockout", l: "Stockout", c: C.stockoutText }, { k: "critical", l: "Critical", c: C.criticalText },
              { k: "low", l: "Low", c: C.lowText }, { k: "healthy", l: "Healthy", c: C.healthyText }, { k: "excess", l: "Excess", c: C.excessText },
              { k: "bbd", l: "BBD", c: C.bbdText }, { k: "issues", l: "Issues", c: "#b91c1c" }, { k: "notes", l: `Notes (${sum.nc})`, c: C.noteText },
            ].map((f) => `<button data-filter="${f.k}" style="padding:3px 7px;border-radius:3px;font-size:9px;font-weight:600;cursor:pointer;background:${state.filterRisk === f.k ? (f.c || C.textMuted) + "15" : "transparent"};color:${state.filterRisk === f.k ? (f.c || C.textMuted) : C.textFaint};border:1px solid ${state.filterRisk === f.k ? (f.c || C.textMuted) + "40" : "transparent"}">${escapeHtml(f.l)}</button>`).join("")}
          </div>
        </div>
        <button data-action="toggleRec" style="padding:4px 10px;border-radius:4px;font-size:9px;font-weight:600;cursor:pointer;background:${state.showRec ? C.blueLight : C.surfaceAlt};color:${state.showRec ? C.blue : C.textMuted};border:1px solid ${state.showRec ? C.blue + "40" : C.border}">⚡ Auto-Orders ${state.showRec ? "ON" : "OFF"}</button>
      </div>

      <div class="main">
        <div class="grid-wrap">
          <table>
            <thead>
              <tr>
                <th class="sticky-left" style="width:55px;left:0">Part</th>
                <th class="sticky-left" style="width:150px;left:55px">SKU Name</th>
                <th class="sticky-left" style="width:120px;left:205px;border-right:2px solid ${C.border}"></th>
                ${weekLabels.map((w, i) => `<th style="width:68px;text-align:right;padding:5px 6px"><div style="font-weight:600;color:${C.text};font-size:10px">${escapeHtml(w.date)}</div><div style="color:${C.textFaint};font-size:8px">${escapeHtml(w.cw)}</div></th>`).join("")}
                <th style="width:40px;text-align:center;border-left:2px solid ${C.border};font-size:8px">Lead</th>
                <th style="width:44px;text-align:center;font-size:8px">MOQ</th>
                <th style="width:36px;text-align:center;font-size:8px">$/U</th>
                <th style="width:40px;text-align:center;font-size:8px">Shelf</th>
                <th style="width:60px;text-align:center;font-size:8px">Status</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map((sku, si) => {
                const badge = riskBadge(sku.weeksOnHand);
                const bandBg = si % 2 === 0 ? C.band1 : C.band2;
                const hasRec = sku.recommended.some((r) => r > 0);
                const hasBbd = sku.bbdRisk.some((b) => b.units > 0);
                const note = state.skuNotes[sku.id];
                const isEditing = state.editingNote === sku.id;
                const rc = rowTypes.length;
                return rowTypes.map((row, ri) => {
                  const isFirst = ri === 0;
                  let data;
                  if (row.key === "beginningInventory") data = sku.beginningInventory;
                  else if (row.key === "incomingPOs") data = sku.incomingPOs;
                  else if (row.key === "newOrders") data = state.showRec ? sku.effectiveOrders : sku.manualOrders;
                  else if (row.key === "forecast") data = sku.forecast;
                  else if (row.key === "finalStock") data = sku.finalStock;
                  else if (row.key === "weeksOnHand") data = sku.weeksOnHand;
                  else if (row.key === "bbdRisk") data = sku.bbdRisk;
                  const rowBg = row.isOrderRow ? C.orderBg : row.isBbd ? (hasBbd ? C.bbdBg : bandBg) : bandBg;

                  const cellContent = (() => {
                    if (row.isBbd) return data.map((b, wi) => `<td style="padding:2px 5px;text-align:right;font-size:10px;background:${b.units > 0 && state.hlOn ? C.bbdBg : "transparent"};color:${b.units > 0 ? C.bbdText : C.borderLight};font-weight:${b.units > 0 ? 600 : 400}">${b.units > 0 ? b.units.toLocaleString() : "—"}</td>`).join("");
                    if (row.isOrderRow) return data.map((val, wi) => {
                      const isR = state.showRec && sku.recommended[wi] > 0 && sku.manualOrders[wi] === 0;
                      const dv = state.showRec ? sku.effectiveOrders[wi] : sku.manualOrders[wi];
                      return `<td style="padding:1px 3px;text-align:right;background:${dv > 0 && state.hlOn ? (isR ? C.blueLight : C.greenLight) : "transparent"}"><input type="number" data-ord="${sku.id},${wi}" value="${dv || ""}" placeholder="—" style="width:100%;text-align:right;font-size:10px;font-weight:700;color:${isR ? C.blue : C.green};background:transparent;border:none;border-bottom:1px dashed ${isR ? C.blue + "44" : C.green + "44"};padding:1px 2px" /></td>`;
                    }).join("");
                    if (row.isWoh) return data.map((v, wi) => {
                      const s = wohStyle(v);
                      return `<td style="padding:2px 5px;text-align:right;background:${state.hlOn ? s.bg : "transparent"};color:${s.color};font-weight:${s.fw};font-size:10px">${v.toFixed(1)}</td>`;
                    }).join("");
                    return data.map((v, wi) => {
                      const isPo = row.key === "incomingPOs", isFs = row.key === "finalStock";
                      return `<td style="padding:2px 5px;text-align:right;font-size:10px;color:${isPo ? (v > 0 ? C.green : C.borderLight) : isFs && v < 0 ? C.stockoutText : C.textMuted};font-weight:${(isPo && v > 0) || (isFs && v < 0) ? 600 : 400};background:${isFs && v < 0 && state.hlOn ? C.stockoutBg : "transparent"}">${isPo && v === 0 ? "—" : v.toLocaleString()}</td>`;
                    }).join("");
                  })();

                  const firstCells = isFirst ? `
                    <td rowspan="${rc}" class="sticky-left" style="left:0;width:55px;background:${bandBg};border-top:2px solid ${C.border};vertical-align:top;padding:6px 4px"><span style="font-size:9px;font-weight:600;color:${C.textMuted}">${escapeHtml(sku.id)}</span></td>
                    <td rowspan="${rc}" class="sticky-left" style="left:55px;width:150px;background:${bandBg};border-top:2px solid ${C.border};vertical-align:top;padding:6px 6px">
                      <div style="font-weight:600;color:${C.text};font-size:11px;line-height:1.3">${escapeHtml(sku.name)}</div>
                      <div style="font-size:8px;color:${C.textFaint};margin-top:1px">${escapeHtml(sku.vendor)}</div>
                      <div style="font-size:8px;color:${C.textMuted}">Inv: $${(sku.currentInvValue / 1000).toFixed(1)}k</div>
                      ${note && !isEditing ? `
                        <div data-edit-note="${sku.id}" style="margin-top:4px;background:${C.noteBg};border:1px solid ${C.noteBorder};border-radius:4px;padding:4px 6px;cursor:pointer">
                          <div style="display:flex;gap:2px;flex-wrap:wrap;margin-bottom:2px">${note.tags.map((t) => { const ts = getTagStyle(t); return `<span style="font-size:7px;font-weight:700;padding:1px 4px;border-radius:2px;background:${ts.bg};color:${ts.color};border:1px solid ${ts.border}">${ts.icon} ${escapeHtml(t)}</span>`; }).join("")}</div>
                          <div style="font-size:8px;color:${C.noteText};line-height:1.3">${escapeHtml(note.text)}</div>
                          <div style="font-size:7px;color:${C.textFaint};margin-top:2px">${escapeHtml(note.author)} · ${escapeHtml(note.date)}</div>
                        </div>
                      ` : ""}
                      ${isEditing ? `
                        <div style="margin-top:4px;background:#fff;border:1px solid ${C.brand}44;border-radius:5px;padding:6px;box-shadow:0 2px 8px #0001">
                          <div style="font-size:8px;font-weight:600;color:${C.textMuted};margin-bottom:3px">Tags:</div>
                          <div style="display:flex;gap:2px;flex-wrap:wrap;margin-bottom:4px">${noteTags.map((t) => `<button data-tag="${t.key}" style="font-size:7px;padding:2px 5px;border-radius:3px;cursor:pointer;background:${state.noteTags.includes(t.key) ? t.bg : "transparent"};color:${state.noteTags.includes(t.key) ? t.color : C.textFaint};border:1px solid ${state.noteTags.includes(t.key) ? t.border : C.borderLight};font-weight:600">${t.icon} ${escapeHtml(t.key)}</button>`).join("")}</div>
                          <textarea data-note-text rows="2" style="width:100%;font-size:9px;border:1px solid ${C.border};border-radius:3px;padding:4px;resize:vertical;min-height:36px;font-family:inherit;color:${C.text}">${escapeHtml(state.noteText)}</textarea>
                          <div style="display:flex;gap:3px;margin-top:3px">
                            <button data-save-note="${sku.id}" style="font-size:8px;padding:2px 8px;border-radius:3px;cursor:pointer;background:${C.brand};color:#fff;border:none;font-weight:600">Save</button>
                            <button data-cancel-note style="font-size:8px;padding:2px 8px;border-radius:3px;cursor:pointer;background:${C.surfaceAlt};color:${C.textMuted};border:1px solid ${C.border};font-weight:600">Cancel</button>
                            ${note ? `<button data-delete-note="${sku.id}" style="font-size:8px;padding:2px 8px;border-radius:3px;cursor:pointer;background:${C.stockoutBg};color:${C.stockoutText};border:1px solid ${C.stockoutBorder};font-weight:600">Delete</button>` : ""}
                          </div>
                        </div>
                      ` : ""}
                      ${!note && !isEditing ? `<button data-edit-note="${sku.id}" style="margin-top:4px;font-size:7px;padding:2px 5px;border-radius:3px;cursor:pointer;background:transparent;color:${C.textFaint};border:1px dashed ${C.border};font-weight:500">📝 Add note</button>` : ""}
                      ${sku.issues.length > 0 ? `<button data-toggle-issues="${sku.id}" style="margin-top:3px;font-size:7px;padding:2px 5px;border-radius:3px;cursor:pointer;background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;font-weight:600">⚠ ${sku.issues.length} issue${sku.issues.length > 1 ? "s" : ""}</button>` : ""}
                      ${state.showIssues === sku.id && sku.issues.length ? `<div style="margin-top:3px;font-size:8px;line-height:1.3">${sku.issues.map((iss) => { const sc = iss.severity === "high" ? { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" } : iss.severity === "medium" ? { bg: "#fffbeb", color: "#b45309", border: "#fde68a" } : { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" }; return `<div style="background:${sc.bg};border:1px solid ${sc.border};border-radius:3px;padding:3px 5px;margin-bottom:2px"><div style="font-weight:700;color:${sc.color};font-size:7px">${iss.icon} ${escapeHtml(iss.label)}</div><div style="color:${C.textMuted};font-size:7px">${escapeHtml(iss.detail)}</div></div>`; }).join("")}</div>` : ""}
                      ${hasRec && state.showRec ? `<div style="margin-top:3px;display:flex;gap:2px"><button data-accept-all="${sku.id}" style="font-size:7px;padding:2px 5px;border-radius:3px;cursor:pointer;background:#3b82f612;color:#3b82f6;border:1px solid #3b82f630;font-weight:600">✓ Accept</button><button data-clear-all="${sku.id}" style="font-size:7px;padding:2px 5px;border-radius:3px;cursor:pointer;background:#64748b12;color:#64748b;border:1px solid #64748b30;font-weight:600">✕ Clear</button></div>` : ""}
                    </td>
                    <td style="left:205px;width:120px;background:${rowBg};border-right:2px solid ${C.border};padding:2px 8px;font-size:9px;color:${row.isOrderRow ? C.blue : row.isWoh ? "#6d28d9" : row.isBbd ? C.bbdText : C.textMuted};font-weight:${(row.isOrderRow || row.isWoh || row.isBbd) ? 600 : 400}">${escapeHtml(row.label)}</td>
                    ${cellContent}
                    ${isFirst ? `
                      <td rowspan="${rc}" style="padding:4px;text-align:center;vertical-align:top;border-left:2px solid ${C.border};border-top:2px solid ${C.border}"><div style="font-size:10px;font-weight:700;color:${sku.leadTime > 35 ? C.criticalText : C.text}">${sku.leadTime}</div><div style="font-size:7px;color:${C.textFaint}">days</div></td>
                      <td rowspan="${rc}" style="padding:4px;text-align:center;vertical-align:top;border-top:2px solid ${C.border}"><div style="font-size:10px;font-weight:700;color:${C.text}">${sku.moq.toLocaleString()}</div><div style="font-size:7px;color:${C.textFaint}">${sku.moqWeeks}wk</div></td>
                      <td rowspan="${rc}" style="padding:4px;text-align:center;vertical-align:top;border-top:2px solid ${C.border}"><div style="font-size:10px;font-weight:700">$${sku.pricePerUnit}</div></td>
                      <td rowspan="${rc}" style="padding:4px;text-align:center;vertical-align:top;border-top:2px solid ${C.border}"><div style="font-size:10px;font-weight:700;color:${sku.shelfLife <= 150 ? C.bbdText : C.text}">${sku.shelfLife}</div><div style="font-size:7px;color:${C.textFaint}">days</div></td>
                      <td rowspan="${rc}" style="padding:4px;text-align:center;vertical-align:top;border-top:2px solid ${C.border}"><span style="font-size:7px;font-weight:700;padding:2px 5px;border-radius:3px;background:${badge.bg};color:${badge.color};border:1px solid ${badge.border}">${badge.label}</span></td>
                    ` : ""}
                  ` : `
                    <td colspan="2" style="padding:0;border:none;background:transparent"></td>
                    <td style="left:205px;width:120px;background:${rowBg};border-right:2px solid ${C.border};padding:2px 8px;font-size:9px;color:${row.isOrderRow ? C.blue : row.isWoh ? "#6d28d9" : row.isBbd ? C.bbdText : C.textMuted};font-weight:${(row.isOrderRow || row.isWoh || row.isBbd) ? 600 : 400}">${escapeHtml(row.label)}</td>
                    ${cellContent}
                  `;
                  return `<tr style="border-top:${isFirst ? "2px" : "1px"} solid ${isFirst ? C.border : C.borderLight}">${firstCells}</tr>`;
                }).join("");
              }).join("")}
            </tbody>
          </table>
        </div>

        ${state.chatOpen ? `
          <div class="copilot-panel">
            <div style="padding:8px 12px;border-bottom:1px solid ${C.border};background:${C.surface}">
              <div style="display:flex;align-items:center;gap:6px">
                <div style="width:22px;height:22px;border-radius:5px;background:linear-gradient(135deg,${C.brand},#7c3aed);display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff">✦</div>
                <div><div style="font-size:11px;font-weight:700">Planning Copilot</div><div style="font-size:8px;color:${C.textFaint}">SKUs · Suppliers · Trends · Notes</div></div>
              </div>
              <div style="display:flex;gap:2px;margin-top:6px;flex-wrap:wrap">
                ${["Show all notes", "Which SKUs are depleting?", "What issues exist?", "Sales trends", "BBD risk summary", "What should I order?"].map((q) => `<button data-quick-chat="${escapeHtml(q)}" style="font-size:7px;padding:2px 6px;border-radius:8px;cursor:pointer;background:${C.surfaceAlt};color:${C.textMuted};border:1px solid ${C.border};font-weight:500">${escapeHtml(q)}</button>`).join("")}
              </div>
            </div>
            <div style="flex:1;overflow:auto;padding:10px;display:flex;flex-direction:column;gap:8px">
              ${state.chatMsgs.map((m) => `<div class="chat-msg ${m.role}" style="background:${m.role === "user" ? C.brandLight : C.surface};border:1px solid ${m.role === "user" ? C.brand + "22" : C.border}"><div>${renderMarkdown(escapeHtml(m.text))}</div></div>`).join("")}
              <div id="chat-end"></div>
            </div>
            <div style="padding:8px 10px;border-top:1px solid ${C.border};background:${C.surface}">
              <div style="display:flex;gap:4px">
                <input type="text" data-binding="chatIn" value="${escapeHtml(state.chatIn)}" placeholder="Ask about SKUs, notes, trends..." style="flex:1;background:${C.surfaceAlt};border:1px solid ${C.border};border-radius:6px;padding:6px 8px;font-size:10px;color:${C.text}" />
                <button data-action="sendChat" style="background:linear-gradient(135deg,${C.brand},#7c3aed);color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:10px;font-weight:600;cursor:pointer">Send</button>
              </div>
            </div>
          </div>
        ` : ""}
      </div>

      <footer class="footer">
        <div style="display:flex;gap:8px">
          <span>${filtered.length}/${state.computed.length} SKUs</span>
          <span style="color:${C.stockoutText}">● ${sum.so} stockout</span>
          <span style="color:${C.criticalText}">● ${sum.cr} critical</span>
          <span style="color:${C.noteText}">📝 ${sum.nc} notes</span>
        </div>
        <div style="display:flex;gap:8px">
          <span><span style="color:${C.blue}">●</span> System</span>
          <span><span style="color:${C.green}">●</span> Planner</span>
          <span>📝 = planner note (click to edit)</span>
        </div>
      </footer>
    `;

    // Bindings
    root.querySelectorAll("[data-binding]").forEach((el) => {
      const key = el.getAttribute("data-binding");
      el.addEventListener("input", () => { state[key] = el.value; if (key === "search" || key === "filterVendor") render(); });
      el.addEventListener("change", () => { state[key] = el.value; render(); });
      if (el.tagName === "INPUT" && el.type === "text" && key === "chatIn") el.addEventListener("keydown", (e) => { if (e.key === "Enter") sendChat(); });
    });

    root.querySelectorAll("[data-filter]").forEach((el) => {
      el.addEventListener("click", () => { state.filterRisk = el.getAttribute("data-filter"); render(); });
    });

    root.querySelector("[data-action='toggleChat']")?.addEventListener("click", () => setState({ chatOpen: !state.chatOpen }));
    root.querySelector("[data-action='toggleRec']")?.addEventListener("click", () => setState({ showRec: !state.showRec }));
    root.querySelector("[data-action='sendChat']")?.addEventListener("click", sendChat);

    root.querySelectorAll("[data-ord]").forEach((el) => {
      el.addEventListener("change", () => {
        const [sid, wi] = el.getAttribute("data-ord").split(",");
        handleOrd(sid, parseInt(wi, 10), el.value);
      });
    });

    root.querySelectorAll("[data-edit-note]").forEach((el) => {
      el.addEventListener("click", () => startEdit(el.getAttribute("data-edit-note")));
    });
    root.querySelectorAll("[data-save-note]").forEach((el) => {
      el.addEventListener("click", () => { const id = el.getAttribute("data-save-note"); const ta = root.querySelector("[data-note-text]"); if (ta) state.noteText = ta.value; saveNote(id); });
    });
    root.querySelector("[data-cancel-note]")?.addEventListener("click", () => { state.editingNote = null; state.noteText = ""; state.noteTags = []; render(); });
    root.querySelector("[data-note-text]")?.addEventListener("input", (e) => { state.noteText = e.target.value; });
    root.querySelectorAll("[data-delete-note]").forEach((el) => {
      el.addEventListener("click", () => deleteNote(el.getAttribute("data-delete-note")));
    });
    root.querySelectorAll("[data-tag]").forEach((el) => {
      el.addEventListener("click", () => toggleTag(el.getAttribute("data-tag")));
    });

    root.querySelectorAll("[data-toggle-issues]").forEach((el) => {
      el.addEventListener("click", () => { state.showIssues = state.showIssues === el.getAttribute("data-toggle-issues") ? null : el.getAttribute("data-toggle-issues"); render(); });
    });
    root.querySelectorAll("[data-accept-all]").forEach((el) => {
      el.addEventListener("click", () => acceptAll(el.getAttribute("data-accept-all")));
    });
    root.querySelectorAll("[data-clear-all]").forEach((el) => {
      el.addEventListener("click", () => clearAll(el.getAttribute("data-clear-all")));
    });

    root.querySelectorAll("[data-quick-chat]").forEach((el) => {
      el.addEventListener("click", () => { state.chatIn = el.getAttribute("data-quick-chat"); render(); });
    });
  }

  // Initial load
  apiCompute().then((computed) => {
    state.computed = computed;
    render();
  });
})();
