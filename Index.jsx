import { useState, useMemo, useRef, useEffect } from "react";

const WEEKS = ["2026-07","2026-08","2026-09","2026-10","2026-11","2026-12","2026-13","2026-14","2026-15","2026-16","2026-17","2026-18"];
const WEEK_DATES = ["2/9","2/16","2/23","3/2","3/9","3/16","3/23","3/30","4/6","4/13","4/20","4/27"];
const WEEK_LABELS = WEEKS.map((w,i)=>({cw:`CW${w.split("-")[1]}`,date:WEEK_DATES[i]}));

const ROW_TYPES = [
  { key:"beginningInventory", label:"Beginning Inventory" },
  { key:"incomingPOs", label:"Incoming POs" },
  { key:"newOrders", label:"New Order Qty", editable:true, isOrderRow:true },
  { key:"forecast", label:"Forecast Demand" },
  { key:"finalStock", label:"Final Stock" },
  { key:"weeksOnHand", label:"Weeks on Hand", isWoh:true },
  { key:"bbdRisk", label:"BBD Expiry Risk", isBbd:true },
];

const RAW_SKUS = [
  { id:"10-210", name:"Nuts About Chocolate", vendor:"Lehi Valley Trading Co", category:"Snack",
    leadTime:42, moq:2300, unitsPerCase:50, pricePerUnit:1.16, shelfLife:180,
    beginningInventory:[2232,1814,1385,953,5013,4564,4116,3662,3236,2794,2317,1838],
    incomingPOs:[0,0,0,4500,0,0,0,0,0,0,0,0],
    forecast:[418,429,432,440,449,448,454,426,442,477,479,481],
    historicalAvgWeekly:435,historicalPeak:610,historicalLow:290,menuFrequency:"3x/week",
    yearlySales2024:22100,yearlySales2025:23400 },
  { id:"10-211", name:"Pick-Me-Up", vendor:"Lehi Valley Trading Co", category:"Snack",
    leadTime:42, moq:2250, unitsPerCase:50, pricePerUnit:0.94, shelfLife:150,
    beginningInventory:[388,138,-118,-376,1611,1343,1076,805,550,286,1,-285],
    incomingPOs:[0,0,2250,0,0,0,0,0,0,0,0,0],
    forecast:[250,256,258,263,268,267,271,255,264,285,286,288],
    historicalAvgWeekly:265,historicalPeak:380,historicalLow:180,menuFrequency:"2x/week",
    yearlySales2024:13500,yearlySales2025:14200 },
  { id:"10-212", name:"Raw Power Mix", vendor:"Lehi Valley Trading Co", category:"Snack",
    leadTime:42, moq:2250, unitsPerCase:50, pricePerUnit:1.30, shelfLife:240,
    beginningInventory:[2107,1913,1714,1514,3561,3353,3146,2936,2739,2534,2313,2091],
    incomingPOs:[0,0,0,2250,0,0,0,0,0,0,0,0],
    forecast:[194,199,200,203,208,207,210,197,205,221,222,223],
    historicalAvgWeekly:208,historicalPeak:310,historicalLow:145,menuFrequency:"2x/week",
    yearlySales2024:10600,yearlySales2025:11100 },
  { id:"10-216", name:"Very Berry Boost", vendor:"Lehi Valley Trading Co", category:"Snack",
    leadTime:42, moq:2250, unitsPerCase:50, pricePerUnit:1.15, shelfLife:240,
    beginningInventory:[1117,900,678,454,2476,2244,2012,1777,1556,1327,1080,832],
    incomingPOs:[0,0,0,2250,0,0,0,0,0,0,0,0],
    forecast:[217,222,224,228,232,232,235,221,229,247,248,249],
    historicalAvgWeekly:232,historicalPeak:340,historicalLow:160,menuFrequency:"2x/week",
    yearlySales2024:11800,yearlySales2025:12400 },
  { id:"10-220", name:"Crunchy Granola Bites", vendor:"Lehi Valley Trading Co", category:"Snack",
    leadTime:42, moq:2000, unitsPerCase:40, pricePerUnit:1.25, shelfLife:200,
    beginningInventory:[1850,1520,1190,860,2530,2180,1830,1490,1150,820,490,160],
    incomingPOs:[0,0,0,2000,0,0,0,0,0,0,0,0],
    forecast:[330,330,330,330,350,350,340,340,330,330,330,340],
    historicalAvgWeekly:336,historicalPeak:450,historicalLow:240,menuFrequency:"3x/week",
    yearlySales2024:17100,yearlySales2025:17900 },
  { id:"10-225", name:"Trail Mix Supreme", vendor:"Lehi Valley Trading Co", category:"Snack",
    leadTime:42, moq:2500, unitsPerCase:50, pricePerUnit:1.45, shelfLife:210,
    beginningInventory:[3200,2850,2500,2150,4300,3920,3540,3160,2780,2400,2020,1640],
    incomingPOs:[0,0,0,2500,0,0,0,0,0,0,0,0],
    forecast:[350,350,350,350,380,380,380,380,380,380,380,380],
    historicalAvgWeekly:370,historicalPeak:490,historicalLow:260,menuFrequency:"3x/week",
    yearlySales2024:18700,yearlySales2025:19800 },
  { id:"10-230", name:"Protein Power Crunch", vendor:"FreshRealm", category:"Snack",
    leadTime:21, moq:1500, unitsPerCase:30, pricePerUnit:1.80, shelfLife:120,
    beginningInventory:[800,520,240,-40,1160,880,600,320,40,-240,-520,-800],
    incomingPOs:[0,0,0,1500,0,0,0,0,0,0,0,0],
    forecast:[280,280,280,300,280,280,280,280,280,280,280,280],
    historicalAvgWeekly:282,historicalPeak:400,historicalLow:200,menuFrequency:"2x/week",
    yearlySales2024:14300,yearlySales2025:15100 },
  { id:"10-235", name:"Dried Mango Slices", vendor:"FreshRealm", category:"Snack",
    leadTime:21, moq:1800, unitsPerCase:36, pricePerUnit:2.10, shelfLife:160,
    beginningInventory:[1400,1180,960,740,2340,2100,1860,1620,1380,1140,900,660],
    incomingPOs:[0,0,0,1800,0,0,0,0,0,0,0,0],
    forecast:[220,220,220,200,240,240,240,240,240,240,240,240],
    historicalAvgWeekly:230,historicalPeak:330,historicalLow:155,menuFrequency:"2x/week",
    yearlySales2024:11700,yearlySales2025:12300 },
];

const VENDORS=[...new Set(RAW_SKUS.map(s=>s.vendor))];

const NOTE_TAGS = [
  { key:"Depleting",     color:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe", icon:"📉" },
  { key:"Quality Hold",  color:"#dc2626", bg:"#fef2f2", border:"#fecaca", icon:"🚫" },
  { key:"Vendor Delay",  color:"#ea580c", bg:"#fff7ed", border:"#fed7aa", icon:"🚚" },
  { key:"Alt Supplier",  color:"#0284c7", bg:"#f0f9ff", border:"#bae6fd", icon:"🔄" },
  { key:"Menu Change",   color:"#0d9488", bg:"#f0fdfa", border:"#99f6e4", icon:"🍽️" },
  { key:"Price Change",  color:"#b45309", bg:"#fffbeb", border:"#fde68a", icon:"💰" },
  { key:"Reorder",       color:"#16a34a", bg:"#f0fdf4", border:"#bbf7d0", icon:"✅" },
  { key:"Follow Up",     color:"#6366f1", bg:"#eef2ff", border:"#c7d2fe", icon:"📌" },
];

function getTagStyle(tagKey) {
  return NOTE_TAGS.find(t => t.key === tagKey) || { color:"#64748b", bg:"#f1f5f9", border:"#e2e8f0", icon:"📝" };
}

// ─── ENGINE ─────────────────────────────────────────────────────────────────
function computeSku(sku,manualOrders){
  const safety=3,ltWeeks=Math.ceil(sku.leadTime/7),shelfWeeks=Math.floor(sku.shelfLife/7);
  const orders=[...(manualOrders||new Array(12).fill(0))];
  const recommended=new Array(12).fill(0);
  let tempStock=[sku.beginningInventory[0]];
  for(let i=0;i<12;i++){
    const stock=tempStock[i]+sku.incomingPOs[i]-sku.forecast[i];
    const w=sku.forecast[i]>0?stock/sku.forecast[i]:99;
    if(w<safety&&orders[i]===0){
      const avgD=sku.forecast.slice(i,Math.min(i+6,12)).reduce((a,b)=>a+b,0)/Math.min(6,12-i);
      const gap=avgD*(safety+ltWeeks)-stock;
      if(gap>0) recommended[i]=Math.max(sku.moq,Math.ceil(gap/sku.unitsPerCase)*sku.unitsPerCase);
    }
    if(i<11) tempStock.push(stock);
  }
  const eff=orders.map((o,i)=>o>0?o:recommended[i]);
  const begInv=[sku.beginningInventory[0]],finalStock=[],woh=[],bbdRisk=[];
  for(let i=0;i<12;i++){
    const fs=begInv[i]+sku.incomingPOs[i]+eff[i]-sku.forecast[i];
    finalStock.push(fs);
    const w=sku.forecast[i]>0?fs/sku.forecast[i]:99;
    woh.push(Math.round(w*10)/10);
    const weeksToExpiry=shelfWeeks-(i>0?i:0);
    const consumable=sku.forecast[i]*Math.max(weeksToExpiry,0);
    const atRisk=Math.max(0,fs-consumable);
    bbdRisk.push({units:Math.round(atRisk),value:Math.round(atRisk*sku.pricePerUnit)});
    if(i<11) begInv.push(fs);
  }
  const issues=[];
  const avgF=sku.forecast.reduce((a,b)=>a+b,0)/12;
  const moqWeeks=sku.moq/avgF;
  if(moqWeeks>6) issues.push({type:"moq_demand",severity:"high",icon:"📦",label:"MOQ / Demand Mismatch",detail:`MOQ (${sku.moq.toLocaleString()}) = ${moqWeeks.toFixed(1)} wks of demand (avg ${Math.round(avgF)}/wk).`});
  else if(moqWeeks>4) issues.push({type:"moq_demand",severity:"medium",icon:"📦",label:"MOQ / Demand Mismatch",detail:`MOQ = ${moqWeeks.toFixed(1)} wks coverage. Monitor overstock.`});
  if(moqWeeks>shelfWeeks*0.5) issues.push({type:"bbd_usage",severity:"high",icon:"⏰",label:"BBD / Usage Risk",detail:`MOQ stock (${moqWeeks.toFixed(1)} wks) vs shelf life (${shelfWeeks} wks). Expiry risk.`});
  if(sku.leadTime>35) issues.push({type:"lead_time",severity:sku.leadTime>40?"high":"medium",icon:"🚚",label:"Long Lead Time",detail:`${sku.leadTime}d (${ltWeeks} wks) — requires ${Math.round(ltWeeks*avgF).toLocaleString()} units pipeline stock.`});
  if(avgF<sku.moq*0.15) issues.push({type:"low_velocity",severity:"medium",icon:"📉",label:"Low Velocity SKU",detail:`Demand ~${Math.round(avgF)}/wk very low vs MOQ. Negotiate smaller MOQ.`});
  if(sku.shelfLife<=150&&sku.leadTime>=35) issues.push({type:"shelf_lead",severity:"high",icon:"⚠️",label:"Short Shelf + Long Lead",detail:`${sku.shelfLife}d shelf with ${sku.leadTime}d lead = ${sku.shelfLife-sku.leadTime}d effective window.`});
  return {...sku,beginningInventory:begInv,effectiveOrders:eff,recommended,manualOrders:orders,finalStock,weeksOnHand:woh,bbdRisk,issues,
    currentInvValue:Math.round(sku.beginningInventory[0]*sku.pricePerUnit),avgForecast:Math.round(avgF),moqWeeks:Math.round(moqWeeks*10)/10};
}

// ─── COLORS ─────────────────────────────────────────────────────────────────
const C={bg:"#fff9c4",surface:"#ffffff",surfaceAlt:"#f1f3f6",border:"#e0e3ea",borderLight:"#eceef3",
  text:"#1e293b",textMuted:"#64748b",textFaint:"#94a3b8",headerBg:"#f0f1f5",
  band1:"#ffffff",band2:"#fafbfc",orderBg:"#f0f4ff",
  stockoutBg:"#fef2f2",stockoutText:"#b91c1c",stockoutBorder:"#fecaca",
  criticalBg:"#fff7ed",criticalText:"#c2410c",criticalBorder:"#fed7aa",
  lowBg:"#fefce8",lowText:"#a16207",lowBorder:"#fef08a",
  healthyBg:"#f0fdf4",healthyText:"#15803d",healthyBorder:"#bbf7d0",
  excessBg:"#faf5ff",excessText:"#7c3aed",excessBorder:"#ddd6fe",
  blue:"#3b82f6",blueLight:"#dbeafe",green:"#10b981",greenLight:"#d1fae5",
  bbdText:"#b45309",bbdBg:"#fffbeb",brand:"#4f46e5",brandLight:"#eef2ff",
  noteBg:"#fefce8",noteBorder:"#fef08a",noteText:"#854d0e"};

function wohStyle(v){
  if(v<0) return{bg:C.stockoutBg,color:C.stockoutText,fw:700};
  if(v<2) return{bg:C.criticalBg,color:C.criticalText,fw:700};
  if(v<4) return{bg:C.lowBg,color:C.lowText,fw:600};
  if(v>14) return{bg:C.excessBg,color:C.excessText,fw:600};
  return{bg:C.healthyBg,color:C.healthyText,fw:600};
}
function riskBadge(woh){
  const mn=Math.min(...woh);
  if(mn<0) return{label:"STOCKOUT",bg:C.stockoutBg,color:C.stockoutText,border:C.stockoutBorder};
  if(mn<2) return{label:"CRITICAL",bg:C.criticalBg,color:C.criticalText,border:C.criticalBorder};
  if(mn<4) return{label:"LOW",bg:C.lowBg,color:C.lowText,border:C.lowBorder};
  if(Math.max(...woh)>14) return{label:"EXCESS",bg:C.excessBg,color:C.excessText,border:C.excessBorder};
  return{label:"HEALTHY",bg:C.healthyBg,color:C.healthyText,border:C.healthyBorder};
}
function issueSevColor(s){
  if(s==="high") return{bg:"#fef2f2",color:"#b91c1c",border:"#fecaca"};
  if(s==="medium") return{bg:"#fffbeb",color:"#b45309",border:"#fde68a"};
  return{bg:"#f0fdf4",color:"#15803d",border:"#bbf7d0"};
}

// ─── AI CHAT ────────────────────────────────────────────────────────────────
function generateAiResponse(q, skus, notes) {
  const ql = q.toLowerCase();
  const matched = skus.find(s => ql.includes(s.name.toLowerCase()) || ql.includes(s.id.toLowerCase()));

  // Notes queries
  if (ql.includes("note") || ql.includes("flag") || ql.includes("mark") || ql.includes("tag") || ql.includes("comment") || ql.includes("annotation")) {
    const skusWithNotes = Object.entries(notes);
    if (matched && notes[matched.id]) {
      const n = notes[matched.id];
      return `**${matched.name}** — Planner Notes:\n\n🏷️ Tags: ${n.tags.map(t=>`**${t}**`).join(", ") || "None"}\n📝 ${n.text}\n👤 ${n.author} · ${n.date}`;
    }
    if (skusWithNotes.length === 0) return "No planner notes found on any SKU. Click the 📝 button on any SKU to add notes.";
    return `**Planner Notes Summary** (${skusWithNotes.length} SKUs):\n\n${skusWithNotes.map(([id, n]) => {
      const s = skus.find(x => x.id === id);
      return `• **${s?.name || id}**: ${n.tags.map(t=>`[${t}]`).join(" ")} — ${n.text.slice(0, 60)}${n.text.length > 60 ? "..." : ""} _(${n.author}, ${n.date})_`;
    }).join("\n")}`;
  }

  if (ql.includes("deplet") || ql.includes("phase out") || ql.includes("discontinu") || ql.includes("run down")) {
    const depleting = Object.entries(notes).filter(([_, n]) => n.tags.includes("Depleting"));
    if (depleting.length > 0) {
      return `**SKUs marked for depletion:**\n\n${depleting.map(([id, n]) => {
        const s = skus.find(x => x.id === id);
        return `• **${s?.name || id}** — ${n.text} _(${n.author}, ${n.date})_`;
      }).join("\n")}\n\nThese SKUs have auto-ordering suppressed if marked as depleting.`;
    }
    return "No SKUs currently marked for depletion. Use the 📝 note button on a SKU and add the 'Depleting' tag to flag one.";
  }

  if(ql.includes("issue")||ql.includes("problem")||ql.includes("concern")){
    if(matched){
      if(matched.issues.length===0) return `**${matched.name}** has no constraint issues.`;
      return `**${matched.name}** — ${matched.issues.length} issue(s):\n\n${matched.issues.map(i=>`• **${i.label}**: ${i.detail}`).join("\n\n")}`;
    }
    const all=skus.filter(s=>s.issues.length>0);
    return `**${all.length}/${skus.length} SKUs** have issues:\n\n${all.map(s=>`• **${s.name}** — ${s.issues.map(i=>i.label).join(", ")}`).join("\n")}`;
  }

  if(ql.includes("sales")||ql.includes("trend")||ql.includes("history")||ql.includes("historical")||ql.includes("year")){
    if(matched){
      const g=((matched.yearlySales2025-matched.yearlySales2024)/matched.yearlySales2024*100).toFixed(1);
      return `**${matched.name}** — Sales:\n\n• 2024: **${matched.yearlySales2024.toLocaleString()}** units\n• 2025: **${matched.yearlySales2025.toLocaleString()}** units\n• Growth: **${g}%** YoY\n• Weekly avg: ${matched.historicalAvgWeekly}/wk (peak ${matched.historicalPeak}, low ${matched.historicalLow})\n• Menu: ${matched.menuFrequency}\n• Current forecast: ${matched.avgForecast}/wk (${matched.avgForecast>matched.historicalAvgWeekly?"above":"below"} historical)`;
    }
    return `Sales overview:\n\n${skus.map(s=>{const g=((s.yearlySales2025-s.yearlySales2024)/s.yearlySales2024*100).toFixed(1);return `• **${s.name}**: ${s.yearlySales2024.toLocaleString()} → ${s.yearlySales2025.toLocaleString()} (${g}%)`;}).join("\n")}`;
  }

  if(ql.includes("forecast")||ql.includes("demand")||ql.includes("usage")||ql.includes("projection")){
    if(matched) return `**${matched.name}** — Forecast:\n\n• 12-wk avg: **${matched.avgForecast}/wk**\n• Range: ${Math.min(...matched.forecast)}–${Math.max(...matched.forecast)}/wk\n• Menu: ${matched.menuFrequency}\n• Historical avg: ${matched.historicalAvgWeekly}/wk`;
    return `Demand summary:\n\n${skus.map(s=>`• **${s.name}**: ${s.avgForecast}/wk (${s.menuFrequency})`).join("\n")}`;
  }

  if(ql.includes("moq")||ql.includes("minimum order")){
    if(matched) return `**${matched.name}** — MOQ:\n\n• MOQ: **${matched.moq.toLocaleString()}**\n• Demand: ${matched.avgForecast}/wk\n• Coverage: **${matched.moqWeeks} weeks**\n• Shelf: ${matched.shelfLife}d (${Math.floor(matched.shelfLife/7)}wk)\n• MOQ/Shelf: **${(matched.moqWeeks/(matched.shelfLife/7)*100).toFixed(0)}%**\n\n${matched.moqWeeks>6?"⚠️ MOQ forces excessive stock. Negotiate lower MOQ.":"Coverage is reasonable."}`;
    return `MOQ concerns:\n\n${skus.filter(s=>s.moqWeeks>5).map(s=>`• **${s.name}**: MOQ ${s.moq.toLocaleString()} = ${s.moqWeeks} wks`).join("\n")||"No major MOQ issues."}`;
  }

  if(ql.includes("supplier")||ql.includes("vendor")||ql.includes("lehi")||ql.includes("freshrealm")){
    const v=ql.includes("freshrealm")?"FreshRealm":ql.includes("lehi")?"Lehi Valley Trading Co":null;
    if(v){const vs=skus.filter(s=>s.vendor===v);const tv=vs.reduce((a,s)=>a+s.currentInvValue,0);
      return `**${v}**:\n\n• SKUs: **${vs.length}**\n• Inv value: **$${(tv/1000).toFixed(1)}k**\n• Lead: **${vs[0].leadTime}d**\n• Issues: **${vs.reduce((a,s)=>a+s.issues.length,0)}**\n${vs.map(s=>`  – ${s.name}: ${riskBadge(s.weeksOnHand).label} (${s.avgForecast}/wk)`).join("\n")}`;}
    return `Suppliers:\n\n${VENDORS.map(v=>{const vs=skus.filter(s=>s.vendor===v);return `**${v}** — ${vs.length} SKUs, ${vs[0].leadTime}d lead\n${vs.map(s=>`  • ${s.name}: ${riskBadge(s.weeksOnHand).label}`).join("\n")}`;}).join("\n\n")}`;
  }

  if(ql.includes("bbd")||ql.includes("expir")||ql.includes("shelf")||ql.includes("waste")){
    if(matched){const tr=matched.bbdRisk.reduce((a,b)=>a+b.units,0);return `**${matched.name}** — BBD:\n\n• Shelf: **${matched.shelfLife}d** (${Math.floor(matched.shelfLife/7)}wk)\n• At risk: **${tr.toLocaleString()} units** ($${matched.bbdRisk.reduce((a,b)=>a+b.value,0).toLocaleString()})\n• Effective window: **${matched.shelfLife-matched.leadTime}d**\n\n${tr>0?"⚠️ Reduce order size or increase frequency.":"✅ No expiry risk."}`;}
    const ar=skus.filter(s=>s.bbdRisk.some(b=>b.units>0));
    return `BBD Risk:\n\n${ar.length>0?ar.map(s=>`• **${s.name}**: ${s.bbdRisk.reduce((a,b)=>a+b.units,0).toLocaleString()} units`).join("\n"):"✅ No BBD risk."}`;
  }

  if(ql.includes("stockout")||ql.includes("shortage")){
    const ar=skus.filter(s=>Math.min(...s.weeksOnHand)<0);
    if(matched){const nw=matched.weeksOnHand.map((w,i)=>w<0?WEEK_DATES[i]:null).filter(Boolean);
      return `**${matched.name}**:\n\n${nw.length>0?`⚠️ Stockout weeks: **${nw.join(", ")}**\n\nOrder ${matched.moq.toLocaleString()} units now (${matched.leadTime}d lead).`:"✅ No stockouts projected."}`;}
    return `Stockouts:\n\n${ar.length>0?ar.map(s=>`• **${s.name}**: ${s.weeksOnHand.filter(w=>w<0).length} weeks`).join("\n"):"✅ None."}`;
  }

  if(ql.includes("order")||ql.includes("recommend")||ql.includes("buy")){
    if(matched){const rw=matched.recommended.map((r,i)=>r>0?`CW${WEEKS[i].split("-")[1]}: ${r.toLocaleString()} ($${(r*matched.pricePerUnit).toLocaleString()})`:null).filter(Boolean);
      return `**${matched.name}** orders:\n\n${rw.length>0?rw.map(w=>`• ${w}`).join("\n"):"✅ No orders needed."}`;}
    const wo=skus.filter(s=>s.recommended.some(r=>r>0));
    const tv=wo.reduce((a,s)=>a+s.recommended.reduce((x,r)=>x+r*s.pricePerUnit,0),0);
    return `Orders:\n\n${wo.map(s=>`• **${s.name}**: ${s.recommended.reduce((a,b)=>a+b,0).toLocaleString()} units`).join("\n")}\n\n**Total: $${(tv/1000).toFixed(1)}k**`;
  }

  if(matched){
    const n = notes[matched.id];
    let resp = `**${matched.name}** (${matched.id}):\n\n• Vendor: ${matched.vendor}\n• Demand: ${matched.avgForecast}/wk · Menu: ${matched.menuFrequency}\n• MOQ: ${matched.moq.toLocaleString()} (${matched.moqWeeks}wk)\n• Lead: ${matched.leadTime}d · Shelf: ${matched.shelfLife}d\n• Stock: ${matched.beginningInventory[0].toLocaleString()} ($${(matched.currentInvValue/1000).toFixed(1)}k)\n• Status: ${riskBadge(matched.weeksOnHand).label}\n• Issues: ${matched.issues.length>0?matched.issues.map(i=>i.label).join(", "):"None"}`;
    if (n) resp += `\n\n📝 **Planner Note**: ${n.tags.map(t=>`[${t}]`).join(" ")} ${n.text} _(${n.author}, ${n.date})_`;
    return resp;
  }

  return `I can help with:\n\n• **"Sales trends for [SKU]"**\n• **"What issues exist?"**\n• **"MOQ analysis"**\n• **"BBD risk for [SKU]"**\n• **"Supplier overview"**\n• **"Show all notes"**\n• **"Which SKUs are depleting?"**\n• **"What should I order?"**`;
}

// ─── COMPONENT ──────────────────────────────────────────────────────────────
export default function App() {
  const [manualOrders,setManualOrders]=useState(()=>{const i={};RAW_SKUS.forEach(s=>{i[s.id]=new Array(12).fill(0)});return i;});
  const [showRec,setShowRec]=useState(true);
  const [filterRisk,setFilterRisk]=useState("all");
  const [filterVendor,setFilterVendor]=useState("all");
  const [search,setSearch]=useState("");
  const [hlOn,setHlOn]=useState(true);
  const [chatOpen,setChatOpen]=useState(true);
  const [chatMsgs,setChatMsgs]=useState([{role:"ai",text:"Hi! I'm your planning copilot. Ask about SKUs, suppliers, trends, issues, notes — or try the quick prompts above."}]);
  const [chatIn,setChatIn]=useState("");
  const [showIssues,setShowIssues]=useState(null);

  // Notes state
  const [skuNotes, setSkuNotes] = useState({
    "10-211": { tags:["Depleting","Menu Change"], text:"Running down inventory. Menu removal planned CW12. Do not reorder after current PO arrives.", author:"Sarah", date:"Feb 5" },
    "10-230": { tags:["Vendor Delay"], text:"FreshRealm confirmed 1-week delay on next PO. Monitor closely for stockout risk.", author:"Prajwal", date:"Feb 6" },
  });
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [noteTags, setNoteTags] = useState([]);

  const chatEndRef=useRef(null);

  const startEdit = (id) => {
    const n = skuNotes[id];
    setEditingNote(id);
    setNoteText(n ? n.text : "");
    setNoteTags(n ? [...n.tags] : []);
  };
  const saveNote = (id) => {
    if (!noteText.trim() && noteTags.length === 0) {
      const next = {...skuNotes}; delete next[id]; setSkuNotes(next);
    } else {
      setSkuNotes(p => ({...p, [id]: { tags:[...noteTags], text:noteText.trim(), author:"You", date:"Feb 7" }}));
    }
    setEditingNote(null); setNoteText(""); setNoteTags([]);
  };
  const deleteNote = (id) => { const n={...skuNotes}; delete n[id]; setSkuNotes(n); setEditingNote(null); };
  const toggleTag = (t) => setNoteTags(p => p.includes(t) ? p.filter(x=>x!==t) : [...p, t]);

  const computed=useMemo(()=>RAW_SKUS.map(s=>computeSku(s,manualOrders[s.id])),[manualOrders]);
  const filtered=useMemo(()=>{
    let sk=computed;
    if(search){const t=search.toLowerCase();sk=sk.filter(s=>s.name.toLowerCase().includes(t)||s.id.includes(t)||s.vendor.toLowerCase().includes(t));}
    if(filterVendor!=="all") sk=sk.filter(s=>s.vendor===filterVendor);
    if(filterRisk!=="all") sk=sk.filter(s=>{
      const mn=Math.min(...s.weeksOnHand),mx=Math.max(...s.weeksOnHand);
      if(filterRisk==="stockout") return mn<0;
      if(filterRisk==="critical") return mn>=0&&mn<2;
      if(filterRisk==="low") return mn>=2&&mn<4;
      if(filterRisk==="excess") return mx>14;
      if(filterRisk==="healthy") return mn>=4&&mx<=14;
      if(filterRisk==="bbd") return s.bbdRisk.some(b=>b.units>0);
      if(filterRisk==="issues") return s.issues.length>0;
      if(filterRisk==="notes") return !!skuNotes[s.id];
      return true;
    });
    return sk;
  },[computed,search,filterRisk,filterVendor,skuNotes]);

  const handleOrd=(sid,wi,val)=>{setManualOrders(p=>{const n={...p};n[sid]=[...n[sid]];n[sid][wi]=parseInt(val)||0;return n;});};
  const acceptAll=(sid)=>{const s=computed.find(x=>x.id===sid);if(s)setManualOrders(p=>({...p,[sid]:s.recommended.map((r,i)=>p[sid][i]>0?p[sid][i]:r)}));};
  const clearAll=(sid)=>setManualOrders(p=>({...p,[sid]:new Array(12).fill(0)}));

  const sum=useMemo(()=>{
    let so=0,cr=0,bbU=0,bbV=0,inv=0,oV=0,oU=0,ic=0,nc=Object.keys(skuNotes).length;
    computed.forEach(s=>{
      const mn=Math.min(...s.weeksOnHand);
      if(mn<0)so++;else if(mn<2)cr++;
      s.bbdRisk.forEach(b=>{bbU+=b.units;bbV+=b.value;});
      inv+=s.currentInvValue;
      s.effectiveOrders.forEach(o=>{if(o>0){oU+=o;oV+=o*s.pricePerUnit;}});
      ic+=s.issues.length;
    });
    return{so,cr,bbU,bbV,inv,oV,oU,count:computed.length,ic,nc};
  },[computed,skuNotes]);

  const sendChat=()=>{
    if(!chatIn.trim()) return;
    setChatMsgs(p=>[...p,{role:"user",text:chatIn.trim()}]);
    const input = chatIn.trim();
    setChatIn("");
    setTimeout(()=>{setChatMsgs(p=>[...p,{role:"ai",text:generateAiResponse(input,computed,skuNotes)}]);},350);
  };
  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[chatMsgs]);

  return (
    <div style={{fontFamily:"'Source Sans 3','Segoe UI',system-ui,sans-serif",background:C.bg,color:C.text,height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>

      {/* HEADER */}
      <header style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"7px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:26,height:26,borderRadius:5,background:`linear-gradient(135deg,${C.brand},#7c3aed)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff"}}>SF</div>
          <span style={{fontSize:14,fontWeight:700}}>SupplyFlow</span>
          <span style={{fontSize:10,color:C.textFaint}}>MRP Planning Grid</span>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span style={pill}>📅 CW07 · Feb 7, 2026</span>
          <button onClick={()=>setChatOpen(!chatOpen)} style={{...pill,cursor:"pointer",background:chatOpen?C.brandLight:C.surfaceAlt,color:chatOpen?C.brand:C.textMuted,border:`1px solid ${chatOpen?C.brand+"44":C.border}`,fontWeight:600}}>
            💬 Copilot {chatOpen?"ON":"OFF"}
          </button>
        </div>
      </header>

      {/* SUMMARY */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"5px 16px",display:"flex",gap:6,flexShrink:0}}>
        {[
          {l:"Inventory",v:`$${(sum.inv/1000).toFixed(1)}k`,bg:"#f0f4ff",c:C.blue},
          {l:"Stockouts",v:sum.so,bg:C.stockoutBg,c:C.stockoutText},
          {l:"Critical",v:sum.cr,bg:C.criticalBg,c:C.criticalText},
          {l:"BBD Risk",v:`${sum.bbU.toLocaleString()} ($${(sum.bbV/1000).toFixed(1)}k)`,bg:C.bbdBg,c:C.bbdText},
          {l:"Issues",v:sum.ic,bg:"#fef2f2",c:"#b91c1c"},
          {l:"Notes",v:sum.nc,bg:C.noteBg,c:C.noteText},
          {l:"Orders",v:`$${(sum.oV/1000).toFixed(1)}k`,bg:C.healthyBg,c:C.healthyText},
        ].map(c=>(
          <div key={c.l} style={{background:c.bg,borderRadius:5,padding:"5px 10px",flex:1,minWidth:0}}>
            <div style={{fontSize:8,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.04em",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.l}</div>
            <div style={{fontSize:14,fontWeight:700,color:c.c,marginTop:1}}>{c.v}</div>
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"5px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{position:"relative"}}>
            <input type="text" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:5,padding:"4px 8px 4px 22px",fontSize:10,color:C.text,width:140,outline:"none"}} />
            <span style={{position:"absolute",left:6,top:"50%",transform:"translateY(-50%)",fontSize:10,color:C.textFaint}}>🔍</span>
          </div>
          <select value={filterVendor} onChange={e=>setFilterVendor(e.target.value)}
            style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:5,padding:"4px 6px",fontSize:10,color:C.text,outline:"none",cursor:"pointer"}}>
            <option value="all">All Suppliers</option>
            {VENDORS.map(v=><option key={v} value={v}>{v}</option>)}
          </select>
          <div style={{display:"flex",gap:2}}>
            {[
              {k:"all",l:"All"},{k:"stockout",l:`Stockout`,c:C.stockoutText},{k:"critical",l:"Critical",c:C.criticalText},
              {k:"low",l:"Low",c:C.lowText},{k:"healthy",l:"Healthy",c:C.healthyText},{k:"excess",l:"Excess",c:C.excessText},
              {k:"bbd",l:"BBD",c:C.bbdText},{k:"issues",l:"Issues",c:"#b91c1c"},{k:"notes",l:`Notes (${sum.nc})`,c:C.noteText},
            ].map(f=>(
              <button key={f.k} onClick={()=>setFilterRisk(f.k)} style={{
                padding:"3px 7px",borderRadius:3,fontSize:9,fontWeight:600,cursor:"pointer",
                background:filterRisk===f.k?(f.c||C.textMuted)+"15":"transparent",
                color:filterRisk===f.k?(f.c||C.text):C.textFaint,
                border:filterRisk===f.k?`1px solid ${f.c||C.textMuted}40`:"1px solid transparent",
              }}>{f.l}</button>
            ))}
          </div>
        </div>
        <button onClick={()=>setShowRec(!showRec)} style={{
          padding:"4px 10px",borderRadius:4,fontSize:9,fontWeight:600,cursor:"pointer",
          background:showRec?C.blueLight:C.surfaceAlt,color:showRec?C.blue:C.textMuted,
          border:`1px solid ${showRec?C.blue+"40":C.border}`,
        }}>⚡ Auto-Orders {showRec?"ON":"OFF"}</button>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* GRID */}
        <div style={{flex:1,overflow:"auto"}}>
          <table style={{borderCollapse:"collapse",fontSize:11,minWidth:1100}}>
            <thead>
              <tr style={{background:C.headerBg,position:"sticky",top:0,zIndex:50}}>
                <th style={{...thS,width:55,position:"sticky",left:0,zIndex:60,background:C.headerBg}}>Part</th>
                <th style={{...thS,width:150,position:"sticky",left:55,zIndex:60,background:C.headerBg}}>SKU Name</th>
                <th style={{...thS,width:120,position:"sticky",left:205,zIndex:60,background:C.headerBg,borderRight:`2px solid ${C.border}`}}></th>
                {WEEK_LABELS.map((w,i)=>(
                  <th key={i} style={{...thS,width:68,textAlign:"right",padding:"5px 6px"}}>
                    <div style={{fontWeight:600,color:C.text,fontSize:10}}>{w.date}</div>
                    <div style={{color:C.textFaint,fontSize:8}}>{w.cw}</div>
                  </th>
                ))}
                <th style={{...thS,width:40,textAlign:"center",borderLeft:`2px solid ${C.border}`,fontSize:8}}>Lead</th>
                <th style={{...thS,width:44,textAlign:"center",fontSize:8}}>MOQ</th>
                <th style={{...thS,width:36,textAlign:"center",fontSize:8}}>$/U</th>
                <th style={{...thS,width:40,textAlign:"center",fontSize:8}}>Shelf</th>
                <th style={{...thS,width:60,textAlign:"center",fontSize:8}}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sku,si)=>{
                const badge=riskBadge(sku.weeksOnHand);
                const bandBg=si%2===0?C.band1:C.band2;
                const hasRec=sku.recommended.some(r=>r>0);
                const hasBbd=sku.bbdRisk.some(b=>b.units>0);
                const note=skuNotes[sku.id];
                const isEditing=editingNote===sku.id;
                const rc=ROW_TYPES.length;

                return ROW_TYPES.map((row,ri)=>{
                  const isFirst=ri===0;
                  let data;
                  if(row.key==="beginningInventory") data=sku.beginningInventory;
                  else if(row.key==="incomingPOs") data=sku.incomingPOs;
                  else if(row.key==="newOrders") data=showRec?sku.effectiveOrders:sku.manualOrders;
                  else if(row.key==="forecast") data=sku.forecast;
                  else if(row.key==="finalStock") data=sku.finalStock;
                  else if(row.key==="weeksOnHand") data=sku.weeksOnHand;
                  else if(row.key==="bbdRisk") data=sku.bbdRisk;
                  const rowBg=row.isOrderRow?C.orderBg:row.isBbd?(hasBbd?C.bbdBg:bandBg):bandBg;

                  return (
                    <tr key={`${sku.id}-${row.key}`} style={{borderTop:isFirst?`2px solid ${C.border}`:`1px solid ${C.borderLight}`}}>
                      {isFirst&&<td rowSpan={rc} style={{...fzS,left:0,width:55,background:bandBg,borderTop:`2px solid ${C.border}`,verticalAlign:"top",padding:"6px 4px"}}>
                        <span style={{fontSize:9,fontWeight:600,color:C.textMuted}}>{sku.id}</span>
                      </td>}
                      {isFirst&&<td rowSpan={rc} style={{...fzS,left:55,width:150,background:bandBg,borderTop:`2px solid ${C.border}`,verticalAlign:"top",padding:"6px 6px"}}>
                        <div style={{fontWeight:600,color:C.text,fontSize:11,lineHeight:1.3}}>{sku.name}</div>
                        <div style={{fontSize:8,color:C.textFaint,marginTop:1}}>{sku.vendor}</div>
                        <div style={{fontSize:8,color:C.textMuted}}>Inv: ${(sku.currentInvValue/1000).toFixed(1)}k</div>

                        {/* Note display / edit */}
                        {note && !isEditing && (
                          <div onClick={()=>startEdit(sku.id)} style={{
                            marginTop:4,background:C.noteBg,border:`1px solid ${C.noteBorder}`,borderRadius:4,
                            padding:"4px 6px",cursor:"pointer",
                          }}>
                            <div style={{display:"flex",gap:2,flexWrap:"wrap",marginBottom:2}}>
                              {note.tags.map(t=>{const ts=getTagStyle(t);return(
                                <span key={t} style={{fontSize:7,fontWeight:700,padding:"1px 4px",borderRadius:2,background:ts.bg,color:ts.color,border:`1px solid ${ts.border}`}}>{ts.icon} {t}</span>
                              );})}
                            </div>
                            <div style={{fontSize:8,color:C.noteText,lineHeight:1.3}}>{note.text}</div>
                            <div style={{fontSize:7,color:C.textFaint,marginTop:2}}>{note.author} · {note.date}</div>
                          </div>
                        )}

                        {isEditing && (
                          <div style={{marginTop:4,background:"#fff",border:`1px solid ${C.brand}44`,borderRadius:5,padding:6,boxShadow:"0 2px 8px #0001"}}>
                            <div style={{fontSize:8,fontWeight:600,color:C.textMuted,marginBottom:3}}>Tags:</div>
                            <div style={{display:"flex",gap:2,flexWrap:"wrap",marginBottom:4}}>
                              {NOTE_TAGS.map(t=>(
                                <button key={t.key} onClick={()=>toggleTag(t.key)} style={{
                                  fontSize:7,padding:"2px 5px",borderRadius:3,cursor:"pointer",
                                  background:noteTags.includes(t.key)?t.bg:"transparent",
                                  color:noteTags.includes(t.key)?t.color:C.textFaint,
                                  border:`1px solid ${noteTags.includes(t.key)?t.border:C.borderLight}`,
                                  fontWeight:600,
                                }}>{t.icon} {t.key}</button>
                              ))}
                            </div>
                            <textarea value={noteText} onChange={e=>setNoteText(e.target.value)}
                              placeholder="Add note for next week..."
                              style={{width:"100%",fontSize:9,border:`1px solid ${C.border}`,borderRadius:3,
                                padding:4,resize:"vertical",minHeight:36,outline:"none",fontFamily:"inherit",color:C.text}} />
                            <div style={{display:"flex",gap:3,marginTop:3}}>
                              <button onClick={()=>saveNote(sku.id)} style={{fontSize:8,padding:"2px 8px",borderRadius:3,cursor:"pointer",background:C.brand,color:"#fff",border:"none",fontWeight:600}}>Save</button>
                              <button onClick={()=>setEditingNote(null)} style={{fontSize:8,padding:"2px 8px",borderRadius:3,cursor:"pointer",background:C.surfaceAlt,color:C.textMuted,border:`1px solid ${C.border}`,fontWeight:600}}>Cancel</button>
                              {note && <button onClick={()=>deleteNote(sku.id)} style={{fontSize:8,padding:"2px 8px",borderRadius:3,cursor:"pointer",background:C.stockoutBg,color:C.stockoutText,border:`1px solid ${C.stockoutBorder}`,fontWeight:600}}>Delete</button>}
                            </div>
                          </div>
                        )}

                        {!note && !isEditing && (
                          <button onClick={()=>startEdit(sku.id)} style={{
                            marginTop:4,fontSize:7,padding:"2px 5px",borderRadius:3,cursor:"pointer",
                            background:"transparent",color:C.textFaint,border:`1px dashed ${C.border}`,fontWeight:500,
                          }}>📝 Add note</button>
                        )}

                        {/* Issues */}
                        {sku.issues.length>0&&(
                          <button onClick={()=>setShowIssues(showIssues===sku.id?null:sku.id)} style={{
                            marginTop:3,fontSize:7,padding:"2px 5px",borderRadius:3,cursor:"pointer",
                            background:"#fef2f2",color:"#b91c1c",border:"1px solid #fecaca",fontWeight:600,
                          }}>⚠ {sku.issues.length} issue{sku.issues.length>1?"s":""}</button>
                        )}
                        {showIssues===sku.id&&(
                          <div style={{marginTop:3,fontSize:8,lineHeight:1.3}}>
                            {sku.issues.map((iss,idx)=>{const sc=issueSevColor(iss.severity);return(
                              <div key={idx} style={{background:sc.bg,border:`1px solid ${sc.border}`,borderRadius:3,padding:"3px 5px",marginBottom:2}}>
                                <div style={{fontWeight:700,color:sc.color,fontSize:7}}>{iss.icon} {iss.label}</div>
                                <div style={{color:C.textMuted,fontSize:7}}>{iss.detail}</div>
                              </div>
                            );})}
                          </div>
                        )}
                        {hasRec&&showRec&&(
                          <div style={{marginTop:3,display:"flex",gap:2}}>
                            <button onClick={()=>acceptAll(sku.id)} style={mBtn("#3b82f6")}>✓ Accept</button>
                            <button onClick={()=>clearAll(sku.id)} style={mBtn("#64748b")}>✕ Clear</button>
                          </div>
                        )}
                      </td>}

                      <td style={{...fzS,left:205,width:120,background:rowBg,borderRight:`2px solid ${C.border}`,padding:"2px 8px",fontSize:9,
                        color:row.isOrderRow?C.blue:row.isWoh?"#6d28d9":row.isBbd?C.bbdText:C.textMuted,
                        fontWeight:(row.isOrderRow||row.isWoh||row.isBbd)?600:400}}>
                        {row.label}
                      </td>

                      {row.isBbd?data.map((b,wi)=>(
                        <td key={wi} style={{padding:"2px 5px",textAlign:"right",fontSize:10,
                          background:b.units>0&&hlOn?C.bbdBg:"transparent",
                          color:b.units>0?C.bbdText:C.borderLight,fontWeight:b.units>0?600:400,
                          fontFamily:"'Source Code Pro',monospace"}}>{b.units>0?b.units.toLocaleString():"—"}</td>
                      )):row.isOrderRow?data.map((val,wi)=>{
                        const isR=showRec&&sku.recommended[wi]>0&&sku.manualOrders[wi]===0;
                        const dv=showRec?sku.effectiveOrders[wi]:sku.manualOrders[wi];
                        return(
                          <td key={wi} style={{padding:"1px 3px",textAlign:"right",background:dv>0&&hlOn?(isR?C.blueLight:C.greenLight):"transparent"}}>
                            {dv>0?(<div style={{position:"relative"}}>
                              <input type="number" value={dv||""} onChange={e=>handleOrd(sku.id,wi,e.target.value)}
                                style={{width:"100%",textAlign:"right",fontSize:10,fontWeight:700,color:isR?C.blue:C.green,background:"transparent",border:"none",borderBottom:`1px dashed ${isR?C.blue+"44":C.green+"44"}`,outline:"none",padding:"1px 2px",fontFamily:"'Source Code Pro',monospace"}} />
                              {isR&&<div style={{position:"absolute",top:0,right:0,width:4,height:4,borderRadius:"50%",background:C.blue}} />}
                            </div>):(<input type="number" value="" placeholder="—" onChange={e=>handleOrd(sku.id,wi,e.target.value)}
                              style={{width:"100%",textAlign:"right",fontSize:10,color:C.borderLight,background:"transparent",border:"none",outline:"none",padding:"1px 2px",fontFamily:"'Source Code Pro',monospace"}} />)}
                          </td>
                        );
                      }):row.isWoh?data.map((v,wi)=>{const s=wohStyle(v);return(
                        <td key={wi} style={{padding:"2px 5px",textAlign:"right",background:hlOn?s.bg:"transparent",color:s.color,fontWeight:s.fw,fontSize:10,fontFamily:"'Source Code Pro',monospace"}}>{v.toFixed(1)}</td>
                      );}):data.map((v,wi)=>{
                        const isPo=row.key==="incomingPOs",isFs=row.key==="finalStock";
                        return(<td key={wi} style={{padding:"2px 5px",textAlign:"right",fontSize:10,
                          color:isPo?(v>0?C.green:C.borderLight):isFs&&v<0?C.stockoutText:C.textMuted,
                          fontWeight:(isPo&&v>0)||(isFs&&v<0)?600:400,
                          background:isFs&&v<0&&hlOn?C.stockoutBg:"transparent",
                          fontFamily:"'Source Code Pro',monospace"}}>{isPo&&v===0?"—":v.toLocaleString()}</td>);
                      })}

                      {isFirst&&<>
                        <td rowSpan={rc} style={{...dtS,borderLeft:`2px solid ${C.border}`,borderTop:`2px solid ${C.border}`}}>
                          <div style={{fontSize:10,fontWeight:700,color:sku.leadTime>35?C.criticalText:C.text}}>{sku.leadTime}</div>
                          <div style={{fontSize:7,color:C.textFaint}}>days</div>
                        </td>
                        <td rowSpan={rc} style={{...dtS,borderTop:`2px solid ${C.border}`}}>
                          <div style={{fontSize:10,fontWeight:700,color:C.text}}>{sku.moq.toLocaleString()}</div>
                          <div style={{fontSize:7,color:C.textFaint}}>{sku.moqWeeks}wk</div>
                        </td>
                        <td rowSpan={rc} style={{...dtS,borderTop:`2px solid ${C.border}`}}>
                          <div style={{fontSize:10,fontWeight:700}}>${sku.pricePerUnit}</div>
                        </td>
                        <td rowSpan={rc} style={{...dtS,borderTop:`2px solid ${C.border}`}}>
                          <div style={{fontSize:10,fontWeight:700,color:sku.shelfLife<=150?C.bbdText:C.text}}>{sku.shelfLife}</div>
                          <div style={{fontSize:7,color:C.textFaint}}>days</div>
                        </td>
                        <td rowSpan={rc} style={{...dtS,textAlign:"center",borderTop:`2px solid ${C.border}`}}>
                          <span style={{fontSize:7,fontWeight:700,padding:"2px 5px",borderRadius:3,background:badge.bg,color:badge.color,border:`1px solid ${badge.border}`}}>{badge.label}</span>
                          {note&&<div style={{marginTop:2}}>
                            {note.tags.slice(0,1).map(t=>{const ts=getTagStyle(t);return <span key={t} style={{fontSize:6,fontWeight:700,padding:"1px 3px",borderRadius:2,background:ts.bg,color:ts.color,border:`1px solid ${ts.border}`,display:"inline-block"}}>{ts.icon}</span>;})}
                            {note.tags.length>1&&<span style={{fontSize:6,color:C.textFaint}}> +{note.tags.length-1}</span>}
                          </div>}
                        </td>
                      </>}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>

        {/* AI COPILOT */}
        {chatOpen&&(
          <div style={{width:320,minWidth:320,borderLeft:`1px solid ${C.border}`,background:C.bg,display:"flex",flexDirection:"column",flexShrink:0}}>
            <div style={{padding:"8px 12px",borderBottom:`1px solid ${C.border}`,background:C.surface}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:22,height:22,borderRadius:5,background:`linear-gradient(135deg,${C.brand},#7c3aed)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff"}}>✦</div>
                <div>
                  <div style={{fontSize:11,fontWeight:700}}>Planning Copilot</div>
                  <div style={{fontSize:8,color:C.textFaint}}>SKUs · Suppliers · Trends · Notes</div>
                </div>
              </div>
              <div style={{display:"flex",gap:2,marginTop:6,flexWrap:"wrap"}}>
                {["Show all notes","Which SKUs are depleting?","What issues exist?","Sales trends","BBD risk summary","What should I order?"].map(q=>(
                  <button key={q} onClick={()=>setChatIn(q)} style={{fontSize:7,padding:"2px 6px",borderRadius:8,cursor:"pointer",background:C.surfaceAlt,color:C.textMuted,border:`1px solid ${C.border}`,fontWeight:500}}>{q}</button>
                ))}
              </div>
            </div>
            <div style={{flex:1,overflow:"auto",padding:10,display:"flex",flexDirection:"column",gap:8}}>
              {chatMsgs.map((m,i)=>(
                <div key={i} style={{maxWidth:"92%",alignSelf:m.role==="user"?"flex-end":"flex-start",
                  background:m.role==="user"?C.brandLight:C.surface,
                  border:`1px solid ${m.role==="user"?C.brand+"22":C.border}`,
                  borderRadius:m.role==="user"?"10px 10px 2px 10px":"10px 10px 10px 2px",padding:"8px 10px"}}>
                  <div style={{fontSize:10,color:C.text,lineHeight:1.5,whiteSpace:"pre-wrap"}}>
                    {m.text.split(/(\*\*[^*]+\*\*)/).map((p,j)=>
                      p.startsWith("**")&&p.endsWith("**")?<strong key={j}>{p.slice(2,-2)}</strong>:<span key={j}>{p}</span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{padding:"8px 10px",borderTop:`1px solid ${C.border}`,background:C.surface}}>
              <div style={{display:"flex",gap:4}}>
                <input type="text" value={chatIn} onChange={e=>setChatIn(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter")sendChat();}}
                  placeholder="Ask about SKUs, notes, trends..."
                  style={{flex:1,background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 8px",fontSize:10,color:C.text,outline:"none"}} />
                <button onClick={sendChat} style={{background:`linear-gradient(135deg,${C.brand},#7c3aed)`,color:"#fff",border:"none",borderRadius:6,padding:"6px 12px",fontSize:10,fontWeight:600,cursor:"pointer"}}>Send</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer style={{background:C.surface,borderTop:`1px solid ${C.border}`,padding:"4px 16px",display:"flex",justifyContent:"space-between",fontSize:9,color:C.textFaint,flexShrink:0}}>
        <div style={{display:"flex",gap:8}}>
          <span>{filtered.length}/{computed.length} SKUs</span>
          <span style={{color:C.stockoutText}}>● {sum.so} stockout</span>
          <span style={{color:C.criticalText}}>● {sum.cr} critical</span>
          <span style={{color:C.noteText}}>📝 {sum.nc} notes</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <span><span style={{color:C.blue}}>●</span> System</span>
          <span><span style={{color:C.green}}>●</span> Planner</span>
          <span>📝 = planner note (click to edit)</span>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:7px;height:7px;}
        ::-webkit-scrollbar-track{background:${C.bg};}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px;}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;}
        input[type=number]{-moz-appearance:textfield;}
        textarea{font-family:inherit;}
      `}</style>
    </div>
  );
}

const thS={padding:"5px 5px",textAlign:"left",fontSize:9,fontWeight:600,color:"#475569",borderBottom:`2px solid #d1d5db`,whiteSpace:"nowrap"};
const fzS={position:"sticky",zIndex:10,whiteSpace:"nowrap"};
const dtS={padding:"4px 4px",textAlign:"center",verticalAlign:"top",borderLeft:"1px solid #e0e3ea"};
const pill={background:"#f0f2f7",borderRadius:5,padding:"4px 10px",fontSize:10,color:"#64748b",border:"1px solid #e0e3ea"};
const mBtn=(c)=>({fontSize:7,padding:"2px 5px",borderRadius:3,cursor:"pointer",background:c+"12",color:c,border:`1px solid ${c}30`,fontWeight:600});
