# MRP Planning Grid (SupplyFlow)

A **Python Flask** application that provides an MRP (Material Requirements Planning) planning grid: SKU inventory, forecasts, recommended orders, weeks-on-hand, BBD risk, and a rule-based planning copilot.

## Run the app

```bash
cd MRP
pip install -r requirements.txt
python app.py
```

Open **http://127.0.0.1:5000** in your browser.

## Structure

| Path | Purpose |
|------|--------|
| `app.py` | Flask app: `/` (HTML), `/api/compute` (POST), `/api/copilot` (POST) |
| `data.py` | Constants, week labels, raw SKU data, note tags, vendors |
| `engine.py` | `compute_sku()`, `compute_all()`, risk badges, WOH styles |
| `copilot.py` | Rule-based AI responses (notes, issues, sales, MOQ, BBD, orders, etc.) |
| `templates/index.html` | Single-page UI with config injected |
| `static/app.js` | Client-side state, table/copilot/notes UI, API calls |

## API

- **POST /api/compute**  
  Body: `{ "manualOrders": { "10-210": [0,0,...], ... } }`  
  Returns: `{ "computed": [ ... ] }` (full computed SKU list).

- **POST /api/copilot**  
  Body: `{ "query": "...", "computed": [ ... ], "notes": { "10-211": { "tags": [...], "text": "...", "author": "...", "date": "..." } } }`  
  Returns: `{ "text": "..." }`.

---

## Is this better suited for Next.js?

**For this kind of app, Next.js (or a React SPA) is often a better fit.**

| Aspect | Flask (current) | Next.js |
|--------|------------------|--------|
| **Interactivity** | Heavy client-side JS; table re-renders and state are manual. | React state and components; grid/copilot/notes are natural. |
| **Maintenance** | Duplicated logic (e.g. `riskBadge`, `wohStyle`) in JS and Python if you keep both. | Single front-end codebase; API can stay Flask or move to Next.js API routes. |
| **Performance** | Full innerHTML re-render on every change. | Virtual DOM and component-level updates. |
| **UX** | Same features, but more code and easier to introduce bugs when changing the grid. | Easier to add features (e.g. export, undo, real-time collaboration). |

**Recommendation**

- **Keep Flask** if you want a simple, single-server deploy with minimal tooling and no Node build step.
- **Use Next.js** if you plan to extend the UI (more filters, export, real-time updates, or a richer copilot). You can keep the same backend: call `POST /api/compute` and `POST /api/copilot` from a Next.js front end, or move the Python logic into Next.js API routes (or a separate service).

The original React component (`Index.jsx`) can be reused inside a Next.js page with minimal changes; the Flask version reproduces the same behavior with server-side compute and copilot.
