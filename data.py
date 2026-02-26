"""MRP planning grid constants and raw SKU data."""

WEEKS = [
    "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12",
    "2026-13", "2026-14", "2026-15", "2026-16", "2026-17", "2026-18",
]
WEEK_DATES = [
    "2/9", "2/16", "2/23", "3/2", "3/9", "3/16",
    "3/23", "3/30", "4/6", "4/13", "4/20", "4/27",
]
WEEK_LABELS = [
    {"cw": f"CW{w.split('-')[1]}", "date": WEEK_DATES[i]}
    for i, w in enumerate(WEEKS)
]

ROW_TYPES = [
    {"key": "beginningInventory", "label": "Beginning Inventory"},
    {"key": "incomingPOs", "label": "Incoming POs"},
    {"key": "newOrders", "label": "New Order Qty", "editable": True, "isOrderRow": True},
    {"key": "forecast", "label": "Forecast Demand"},
    {"key": "finalStock", "label": "Final Stock"},
    {"key": "weeksOnHand", "label": "Weeks on Hand", "isWoh": True},
    {"key": "bbdRisk", "label": "BBD Expiry Risk", "isBbd": True},
]

NOTE_TAGS = [
    {"key": "Depleting", "color": "#7c3aed", "bg": "#f5f3ff", "border": "#ddd6fe", "icon": "📉"},
    {"key": "Quality Hold", "color": "#dc2626", "bg": "#fef2f2", "border": "#fecaca", "icon": "🚫"},
    {"key": "Vendor Delay", "color": "#ea580c", "bg": "#fff7ed", "border": "#fed7aa", "icon": "🚚"},
    {"key": "Alt Supplier", "color": "#0284c7", "bg": "#f0f9ff", "border": "#bae6fd", "icon": "🔄"},
    {"key": "Menu Change", "color": "#0d9488", "bg": "#f0fdfa", "border": "#99f6e4", "icon": "🍽️"},
    {"key": "Price Change", "color": "#b45309", "bg": "#fffbeb", "border": "#fde68a", "icon": "💰"},
    {"key": "Reorder", "color": "#16a34a", "bg": "#f0fdf4", "border": "#bbf7d0", "icon": "✅"},
    {"key": "Follow Up", "color": "#6366f1", "bg": "#eef2ff", "border": "#c7d2fe", "icon": "📌"},
]

RAW_SKUS = [
    {
        "id": "10-210", "name": "Nuts About Chocolate", "vendor": "Lehi Valley Trading Co",
        "category": "Snack", "leadTime": 42, "moq": 2300, "unitsPerCase": 50,
        "pricePerUnit": 1.16, "shelfLife": 180,
        "beginningInventory": [2232, 1814, 1385, 953, 5013, 4564, 4116, 3662, 3236, 2794, 2317, 1838],
        "incomingPOs": [0, 0, 0, 4500, 0, 0, 0, 0, 0, 0, 0, 0],
        "forecast": [418, 429, 432, 440, 449, 448, 454, 426, 442, 477, 479, 481],
        "historicalAvgWeekly": 435, "historicalPeak": 610, "historicalLow": 290,
        "menuFrequency": "3x/week", "yearlySales2024": 22100, "yearlySales2025": 23400,
    },
    {
        "id": "10-211", "name": "Pick-Me-Up", "vendor": "Lehi Valley Trading Co",
        "category": "Snack", "leadTime": 42, "moq": 2250, "unitsPerCase": 50,
        "pricePerUnit": 0.94, "shelfLife": 150,
        "beginningInventory": [388, 138, -118, -376, 1611, 1343, 1076, 805, 550, 286, 1, -285],
        "incomingPOs": [0, 0, 2250, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "forecast": [250, 256, 258, 263, 268, 267, 271, 255, 264, 285, 286, 288],
        "historicalAvgWeekly": 265, "historicalPeak": 380, "historicalLow": 180,
        "menuFrequency": "2x/week", "yearlySales2024": 13500, "yearlySales2025": 14200,
    },
    {
        "id": "10-212", "name": "Raw Power Mix", "vendor": "Lehi Valley Trading Co",
        "category": "Snack", "leadTime": 42, "moq": 2250, "unitsPerCase": 50,
        "pricePerUnit": 1.30, "shelfLife": 240,
        "beginningInventory": [2107, 1913, 1714, 1514, 3561, 3353, 3146, 2936, 2739, 2534, 2313, 2091],
        "incomingPOs": [0, 0, 0, 2250, 0, 0, 0, 0, 0, 0, 0, 0],
        "forecast": [194, 199, 200, 203, 208, 207, 210, 197, 205, 221, 222, 223],
        "historicalAvgWeekly": 208, "historicalPeak": 310, "historicalLow": 145,
        "menuFrequency": "2x/week", "yearlySales2024": 10600, "yearlySales2025": 11100,
    },
    {
        "id": "10-216", "name": "Very Berry Boost", "vendor": "Lehi Valley Trading Co",
        "category": "Snack", "leadTime": 42, "moq": 2250, "unitsPerCase": 50,
        "pricePerUnit": 1.15, "shelfLife": 240,
        "beginningInventory": [1117, 900, 678, 454, 2476, 2244, 2012, 1777, 1556, 1327, 1080, 832],
        "incomingPOs": [0, 0, 0, 2250, 0, 0, 0, 0, 0, 0, 0, 0],
        "forecast": [217, 222, 224, 228, 232, 232, 235, 221, 229, 247, 248, 249],
        "historicalAvgWeekly": 232, "historicalPeak": 340, "historicalLow": 160,
        "menuFrequency": "2x/week", "yearlySales2024": 11800, "yearlySales2025": 12400,
    },
    {
        "id": "10-220", "name": "Crunchy Granola Bites", "vendor": "Lehi Valley Trading Co",
        "category": "Snack", "leadTime": 42, "moq": 2000, "unitsPerCase": 40,
        "pricePerUnit": 1.25, "shelfLife": 200,
        "beginningInventory": [1850, 1520, 1190, 860, 2530, 2180, 1830, 1490, 1150, 820, 490, 160],
        "incomingPOs": [0, 0, 0, 2000, 0, 0, 0, 0, 0, 0, 0, 0],
        "forecast": [330, 330, 330, 330, 350, 350, 340, 340, 330, 330, 330, 340],
        "historicalAvgWeekly": 336, "historicalPeak": 450, "historicalLow": 240,
        "menuFrequency": "3x/week", "yearlySales2024": 17100, "yearlySales2025": 17900,
    },
    {
        "id": "10-225", "name": "Trail Mix Supreme", "vendor": "Lehi Valley Trading Co",
        "category": "Snack", "leadTime": 42, "moq": 2500, "unitsPerCase": 50,
        "pricePerUnit": 1.45, "shelfLife": 210,
        "beginningInventory": [3200, 2850, 2500, 2150, 4300, 3920, 3540, 3160, 2780, 2400, 2020, 1640],
        "incomingPOs": [0, 0, 0, 2500, 0, 0, 0, 0, 0, 0, 0, 0],
        "forecast": [350, 350, 350, 350, 380, 380, 380, 380, 380, 380, 380, 380],
        "historicalAvgWeekly": 370, "historicalPeak": 490, "historicalLow": 260,
        "menuFrequency": "3x/week", "yearlySales2024": 18700, "yearlySales2025": 19800,
    },
    {
        "id": "10-230", "name": "Protein Power Crunch", "vendor": "FreshRealm",
        "category": "Snack", "leadTime": 21, "moq": 1500, "unitsPerCase": 30,
        "pricePerUnit": 1.80, "shelfLife": 120,
        "beginningInventory": [800, 520, 240, -40, 1160, 880, 600, 320, 40, -240, -520, -800],
        "incomingPOs": [0, 0, 0, 1500, 0, 0, 0, 0, 0, 0, 0, 0],
        "forecast": [280, 280, 280, 300, 280, 280, 280, 280, 280, 280, 280, 280],
        "historicalAvgWeekly": 282, "historicalPeak": 400, "historicalLow": 200,
        "menuFrequency": "2x/week", "yearlySales2024": 14300, "yearlySales2025": 15100,
    },
    {
        "id": "10-235", "name": "Dried Mango Slices", "vendor": "FreshRealm",
        "category": "Snack", "leadTime": 21, "moq": 1800, "unitsPerCase": 36,
        "pricePerUnit": 2.10, "shelfLife": 160,
        "beginningInventory": [1400, 1180, 960, 740, 2340, 2100, 1860, 1620, 1380, 1140, 900, 660],
        "incomingPOs": [0, 0, 0, 1800, 0, 0, 0, 0, 0, 0, 0, 0],
        "forecast": [220, 220, 220, 200, 240, 240, 240, 240, 240, 240, 240, 240],
        "historicalAvgWeekly": 230, "historicalPeak": 330, "historicalLow": 155,
        "menuFrequency": "2x/week", "yearlySales2024": 11700, "yearlySales2025": 12300,
    },
]

VENDORS = list({s["vendor"] for s in RAW_SKUS})
