"""Planning copilot: rule-based AI responses for SKU/supplier/notes queries."""
from data import WEEKS, WEEK_DATES, VENDORS, NOTE_TAGS
from engine import risk_badge


def get_tag_style(tag_key):
    for t in NOTE_TAGS:
        if t["key"] == tag_key:
            return t
    return {"color": "#64748b", "bg": "#f1f5f9", "border": "#e2e8f0", "icon": "📝"}


def generate_ai_response(q, skus, notes):
    """Generate copilot response from query, computed SKUs, and SKU notes dict."""
    ql = q.lower()
    matched = None
    for s in skus:
        if s["name"].lower() in ql or s["id"].lower() in ql:
            matched = s
            break

    # Notes queries
    if any(x in ql for x in ["note", "flag", "mark", "tag", "comment", "annotation"]):
        skus_with_notes = list(notes.items())
        if matched and matched["id"] in notes:
            n = notes[matched["id"]]
            tags_str = ", ".join(f"**{t}**" for t in n["tags"]) or "None"
            return f"**{matched['name']}** — Planner Notes:\n\n🏷️ Tags: {tags_str}\n📝 {n['text']}\n👤 {n['author']} · {n['date']}"
        if not skus_with_notes:
            return "No planner notes found on any SKU. Click the 📝 button on any SKU to add notes."
        lines = []
        for sid, n in skus_with_notes:
            s = next((x for x in skus if x["id"] == sid), None)
            name = s["name"] if s else sid
            text_preview = n["text"][:60] + "..." if len(n["text"]) > 60 else n["text"]
            tags = " ".join(f"[{t}]" for t in n["tags"])
            lines.append(f"• **{name}**: {tags} — {text_preview} _({n['author']}, {n['date']})_")
        return f"**Planner Notes Summary** ({len(skus_with_notes)} SKUs):\n\n" + "\n".join(lines)

    if any(x in ql for x in ["deplet", "phase out", "discontinu", "run down"]):
        depleting = [(sid, n) for sid, n in notes.items() if "Depleting" in n["tags"]]
        if depleting:
            lines = []
            for sid, n in depleting:
                s = next((x for x in skus if x["id"] == sid), None)
                name = s["name"] if s else sid
                lines.append(f"• **{name}** — {n['text']} _({n['author']}, {n['date']})_")
            return "**SKUs marked for depletion:**\n\n" + "\n".join(lines) + "\n\nThese SKUs have auto-ordering suppressed if marked as depleting."
        return "No SKUs currently marked for depletion. Use the 📝 note button on a SKU and add the 'Depleting' tag to flag one."

    if any(x in ql for x in ["issue", "problem", "concern"]):
        if matched:
            if not matched["issues"]:
                return f"**{matched['name']}** has no constraint issues."
            parts = [f"• **{i['label']}**: {i['detail']}" for i in matched["issues"]]
            return f"**{matched['name']}** — {len(matched['issues'])} issue(s):\n\n" + "\n\n".join(parts)
        all_issues = [s for s in skus if s["issues"]]
        lines = [f"• **{s['name']}** — {', '.join(i['label'] for i in s['issues'])}" for s in all_issues]
        return f"**{len(all_issues)}/{len(skus)} SKUs** have issues:\n\n" + "\n".join(lines)

    if any(x in ql for x in ["sales", "trend", "history", "historical", "year"]):
        if matched:
            g = ((matched["yearlySales2025"] - matched["yearlySales2024"]) / matched["yearlySales2024"] * 100)
            above = "above" if matched["avgForecast"] > matched["historicalAvgWeekly"] else "below"
            return (
                f"**{matched['name']}** — Sales:\n\n"
                f"• 2024: **{matched['yearlySales2024']:,}** units\n"
                f"• 2025: **{matched['yearlySales2025']:,}** units\n"
                f"• Growth: **{g:.1f}%** YoY\n"
                f"• Weekly avg: {matched['historicalAvgWeekly']}/wk (peak {matched['historicalPeak']}, low {matched['historicalLow']})\n"
                f"• Menu: {matched['menuFrequency']}\n"
                f"• Current forecast: {matched['avgForecast']}/wk ({above} historical)"
            )
        lines = []
        for s in skus:
            g = ((s["yearlySales2025"] - s["yearlySales2024"]) / s["yearlySales2024"] * 100)
            lines.append(f"• **{s['name']}**: {s['yearlySales2024']:,} → {s['yearlySales2025']:,} ({g:.1f}%)")
        return "Sales overview:\n\n" + "\n".join(lines)

    if any(x in ql for x in ["forecast", "demand", "usage", "projection"]):
        if matched:
            return (
                f"**{matched['name']}** — Forecast:\n\n"
                f"• 12-wk avg: **{matched['avgForecast']}/wk**\n"
                f"• Range: {min(matched['forecast'])}–{max(matched['forecast'])}/wk\n"
                f"• Menu: {matched['menuFrequency']}\n"
                f"• Historical avg: {matched['historicalAvgWeekly']}/wk"
            )
        lines = [f"• **{s['name']}**: {s['avgForecast']}/wk ({s['menuFrequency']})" for s in skus]
        return "Demand summary:\n\n" + "\n".join(lines)

    if "moq" in ql or "minimum order" in ql:
        if matched:
            pct = (matched["moqWeeks"] / (matched["shelfLife"] / 7) * 100) if matched["shelfLife"] else 0
            warn = "⚠️ MOQ forces excessive stock. Negotiate lower MOQ." if matched["moqWeeks"] > 6 else "Coverage is reasonable."
            return (
                f"**{matched['name']}** — MOQ:\n\n"
                f"• MOQ: **{matched['moq']:,}**\n"
                f"• Demand: {matched['avgForecast']}/wk\n"
                f"• Coverage: **{matched['moqWeeks']} weeks**\n"
                f"• Shelf: {matched['shelfLife']}d ({matched['shelfLife'] // 7}wk)\n"
                f"• MOQ/Shelf: **{pct:.0f}%**\n\n{warn}"
            )
        moq_skus = [s for s in skus if s["moqWeeks"] > 5]
        if not moq_skus:
            return "No major MOQ issues."
        lines = [f"• **{s['name']}**: MOQ {s['moq']:,} = {s['moqWeeks']} wks" for s in moq_skus]
        return "MOQ concerns:\n\n" + "\n".join(lines)

    if any(x in ql for x in ["supplier", "vendor", "lehi", "freshrealm"]):
        v = "FreshRealm" if "freshrealm" in ql else "Lehi Valley Trading Co" if "lehi" in ql else None
        if v:
            vs = [s for s in skus if s["vendor"] == v]
            tv = sum(s["currentInvValue"] for s in vs)
            lines = [f"  – {s['name']}: {risk_badge(s['weeksOnHand'])['label']} ({s['avgForecast']}/wk)" for s in vs]
            return f"**{v}**:\n\n• SKUs: **{len(vs)}**\n• Inv value: **${tv/1000:.1f}k**\n• Lead: **{vs[0]['leadTime']}d**\n• Issues: **{sum(len(s['issues']) for s in vs)}**\n" + "\n".join(lines)
        parts = []
        for v in VENDORS:
            vs = [s for s in skus if s["vendor"] == v]
            lead = vs[0]["leadTime"] if vs else 0
            lines = [f"  • {s['name']}: {risk_badge(s['weeksOnHand'])['label']}" for s in vs]
            parts.append(f"**{v}** — {len(vs)} SKUs, {lead}d lead\n" + "\n".join(lines))
        return "Suppliers:\n\n" + "\n\n".join(parts)

    if any(x in ql for x in ["bbd", "expir", "shelf", "waste"]):
        if matched:
            tr = sum(b["units"] for b in matched["bbdRisk"])
            bv = sum(b["value"] for b in matched["bbdRisk"])
            msg = "⚠️ Reduce order size or increase frequency." if tr > 0 else "✅ No expiry risk."
            return (
                f"**{matched['name']}** — BBD:\n\n"
                f"• Shelf: **{matched['shelfLife']}d** ({matched['shelfLife'] // 7}wk)\n"
                f"• At risk: **{tr:,} units** (${bv:,})\n"
                f"• Effective window: **{matched['shelfLife'] - matched['leadTime']}d**\n\n{msg}"
            )
        ar = [s for s in skus if any(b["units"] > 0 for b in s["bbdRisk"])]
        if not ar:
            return "BBD Risk:\n\n✅ No BBD risk."
        lines = [f"• **{s['name']}**: {sum(b['units'] for b in s['bbdRisk']):,} units" for s in ar]
        return "BBD Risk:\n\n" + "\n".join(lines)

    if "stockout" in ql or "shortage" in ql:
        ar = [s for s in skus if min(s["weeksOnHand"]) < 0]
        if matched:
            nw = [WEEK_DATES[i] for i, w in enumerate(matched["weeksOnHand"]) if w < 0]
            if nw:
                return f"**{matched['name']}**:\n\n⚠️ Stockout weeks: **{', '.join(nw)}**\n\nOrder {matched['moq']:,} units now ({matched['leadTime']}d lead)."
            return f"**{matched['name']}**:\n\n✅ No stockouts projected."
        if not ar:
            return "Stockouts:\n\n✅ None."
        lines = [f"• **{s['name']}**: {sum(1 for w in s['weeksOnHand'] if w < 0)} weeks" for s in ar]
        return "Stockouts:\n\n" + "\n".join(lines)

    if any(x in ql for x in ["order", "recommend", "buy"]):
        if matched:
            rw = [
                f"CW{WEEKS[i].split('-')[1]}: {r:,} (${(r * matched['pricePerUnit']):,.0f})"
                for i, r in enumerate(matched["recommended"]) if r > 0
            ]
            if not rw:
                return f"**{matched['name']}** orders:\n\n✅ No orders needed."
            return f"**{matched['name']}** orders:\n\n" + "\n".join(f"• {x}" for x in rw)
        wo = [s for s in skus if any(r > 0 for r in s["recommended"])]
        tv = sum(
            sum(r * s["pricePerUnit"] for r in s["recommended"])
            for s in wo
        )
        lines = [f"• **{s['name']}**: {sum(s['recommended']):,} units" for s in wo]
        return "Orders:\n\n" + "\n".join(lines) + f"\n\n**Total: ${tv/1000:.1f}k**"

    if matched:
        badge = risk_badge(matched["weeksOnHand"])
        issues_str = ", ".join(i["label"] for i in matched["issues"]) if matched["issues"] else "None"
        resp = (
            f"**{matched['name']}** ({matched['id']}):\n\n"
            f"• Vendor: {matched['vendor']}\n"
            f"• Demand: {matched['avgForecast']}/wk · Menu: {matched['menuFrequency']}\n"
            f"• MOQ: {matched['moq']:,} ({matched['moqWeeks']}wk)\n"
            f"• Lead: {matched['leadTime']}d · Shelf: {matched['shelfLife']}d\n"
            f"• Stock: {matched['beginningInventory'][0]:,} (${matched['currentInvValue']/1000:.1f}k)\n"
            f"• Status: {badge['label']}\n"
            f"• Issues: {issues_str}"
        )
        if matched["id"] in notes:
            n = notes[matched["id"]]
            resp += f"\n\n📝 **Planner Note**: {' '.join(f'[{t}]' for t in n['tags'])} {n['text']} _({n['author']}, {n['date']})_"
        return resp

    return (
        "I can help with:\n\n"
        "• **\"Sales trends for [SKU]\"**\n"
        "• **\"What issues exist?\"**\n"
        "• **\"MOQ analysis\"**\n"
        "• **\"BBD risk for [SKU]\"**\n"
        "• **\"Supplier overview\"**\n"
        "• **\"Show all notes\"**\n"
        "• **\"Which SKUs are depleting?\"**\n"
        "• **\"What should I order?\"**"
    )
