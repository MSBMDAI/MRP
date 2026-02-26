"""MRP planning engine: compute SKU projections, risk badges, styles."""
import math
from copy import deepcopy

from data import RAW_SKUS, NOTE_TAGS


def compute_sku(sku, manual_orders=None):
    """Compute projected inventory, recommended orders, WOH, BBD risk, and issues for one SKU."""
    sku = deepcopy(sku)
    safety = 3
    lt_weeks = math.ceil(sku["leadTime"] / 7)
    shelf_weeks = math.floor(sku["shelfLife"] / 7)
    orders = list(manual_orders) if manual_orders else [0] * 12
    recommended = [0] * 12
    temp_stock = [sku["beginningInventory"][0]]

    for i in range(12):
        stock = temp_stock[i] + sku["incomingPOs"][i] - sku["forecast"][i]
        w = stock / sku["forecast"][i] if sku["forecast"][i] > 0 else 99
        if w < safety and orders[i] == 0:
            slice_end = min(i + 6, 12)
            avg_d = sum(sku["forecast"][i:slice_end]) / min(6, 12 - i)
            gap = avg_d * (safety + lt_weeks) - stock
            if gap > 0:
                recommended[i] = max(
                    sku["moq"],
                    math.ceil(gap / sku["unitsPerCase"]) * sku["unitsPerCase"],
                )
        if i < 11:
            temp_stock.append(stock)

    eff = [o if o > 0 else recommended[i] for i, o in enumerate(orders)]
    beg_inv = [sku["beginningInventory"][0]]
    final_stock = []
    woh = []
    bbd_risk = []

    for i in range(12):
        fs = beg_inv[i] + sku["incomingPOs"][i] + eff[i] - sku["forecast"][i]
        final_stock.append(fs)
        w = fs / sku["forecast"][i] if sku["forecast"][i] > 0 else 99
        woh.append(round(w * 10) / 10)
        weeks_to_expiry = shelf_weeks - (i if i > 0 else 0)
        consumable = sku["forecast"][i] * max(weeks_to_expiry, 0)
        at_risk = max(0, fs - consumable)
        bbd_risk.append({
            "units": round(at_risk),
            "value": round(at_risk * sku["pricePerUnit"]),
        })
        if i < 11:
            beg_inv.append(fs)

    issues = []
    avg_f = sum(sku["forecast"]) / 12
    moq_weeks = sku["moq"] / avg_f

    if moq_weeks > 6:
        issues.append({
            "type": "moq_demand", "severity": "high", "icon": "📦",
            "label": "MOQ / Demand Mismatch",
            "detail": f"MOQ ({sku['moq']:,}) = {moq_weeks:.1f} wks of demand (avg {round(avg_f)}/wk).",
        })
    elif moq_weeks > 4:
        issues.append({
            "type": "moq_demand", "severity": "medium", "icon": "📦",
            "label": "MOQ / Demand Mismatch",
            "detail": f"MOQ = {moq_weeks:.1f} wks coverage. Monitor overstock.",
        })
    if moq_weeks > shelf_weeks * 0.5:
        issues.append({
            "type": "bbd_usage", "severity": "high", "icon": "⏰",
            "label": "BBD / Usage Risk",
            "detail": f"MOQ stock ({moq_weeks:.1f} wks) vs shelf life ({shelf_weeks} wks). Expiry risk.",
        })
    if sku["leadTime"] > 35:
        issues.append({
            "type": "lead_time", "severity": "high" if sku["leadTime"] > 40 else "medium",
            "icon": "🚚", "label": "Long Lead Time",
            "detail": f"{sku['leadTime']}d ({lt_weeks} wks) — requires {round(lt_weeks * avg_f):,} units pipeline stock.",
        })
    if avg_f < sku["moq"] * 0.15:
        issues.append({
            "type": "low_velocity", "severity": "medium", "icon": "📉",
            "label": "Low Velocity SKU",
            "detail": f"Demand ~{round(avg_f)}/wk very low vs MOQ. Negotiate smaller MOQ.",
        })
    if sku["shelfLife"] <= 150 and sku["leadTime"] >= 35:
        issues.append({
            "type": "shelf_lead", "severity": "high", "icon": "⚠️",
            "label": "Short Shelf + Long Lead",
            "detail": f"{sku['shelfLife']}d shelf with {sku['leadTime']}d lead = {sku['shelfLife'] - sku['leadTime']}d effective window.",
        })

    sku["beginningInventory"] = beg_inv
    sku["effectiveOrders"] = eff
    sku["recommended"] = recommended
    sku["manualOrders"] = orders
    sku["finalStock"] = final_stock
    sku["weeksOnHand"] = woh
    sku["bbdRisk"] = bbd_risk
    sku["issues"] = issues
    sku["currentInvValue"] = round(sku["beginningInventory"][0] * sku["pricePerUnit"])
    sku["avgForecast"] = round(avg_f)
    sku["moqWeeks"] = round(moq_weeks * 10) / 10
    return sku


def woh_style(v):
    """Return background, color, font-weight for a weeks-on-hand value."""
    if v < 0:
        return {"bg": "#fef2f2", "color": "#b91c1c", "fw": 700}
    if v < 2:
        return {"bg": "#fff7ed", "color": "#c2410c", "fw": 700}
    if v < 4:
        return {"bg": "#fefce8", "color": "#a16207", "fw": 600}
    if v > 14:
        return {"bg": "#faf5ff", "color": "#7c3aed", "fw": 600}
    return {"bg": "#f0fdf4", "color": "#15803d", "fw": 600}


def risk_badge(woh):
    """Return label and colors for status badge from weeks-on-hand list."""
    mn, mx = min(woh), max(woh)
    if mn < 0:
        return {"label": "STOCKOUT", "bg": "#fef2f2", "color": "#b91c1c", "border": "#fecaca"}
    if mn < 2:
        return {"label": "CRITICAL", "bg": "#fff7ed", "color": "#c2410c", "border": "#fed7aa"}
    if mn < 4:
        return {"label": "LOW", "bg": "#fefce8", "color": "#a16207", "border": "#fef08a"}
    if mx > 14:
        return {"label": "EXCESS", "bg": "#faf5ff", "color": "#7c3aed", "border": "#ddd6fe"}
    return {"label": "HEALTHY", "bg": "#f0fdf4", "color": "#15803d", "border": "#bbf7d0"}


def issue_sev_color(severity):
    """Return bg, color, border for issue severity."""
    if severity == "high":
        return {"bg": "#fef2f2", "color": "#b91c1c", "border": "#fecaca"}
    if severity == "medium":
        return {"bg": "#fffbeb", "color": "#b45309", "border": "#fde68a"}
    return {"bg": "#f0fdf4", "color": "#15803d", "border": "#bbf7d0"}


def get_tag_style(tag_key):
    """Return style dict for a note tag key."""
    for t in NOTE_TAGS:
        if t["key"] == tag_key:
            return t
    return {"color": "#64748b", "bg": "#f1f5f9", "border": "#e2e8f0", "icon": "📝"}


def compute_all(sku_list=None, manual_orders_by_id=None):
    """Compute all SKUs; manual_orders_by_id is { sku_id: [12 ints] }."""
    sku_list = sku_list or RAW_SKUS
    manual_orders_by_id = manual_orders_by_id or {}
    return [
        compute_sku(s, manual_orders_by_id.get(s["id"], [0] * 12))
        for s in sku_list
    ]
