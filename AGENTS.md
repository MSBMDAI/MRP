# AGENTS.md

## Project Overview
This repository hosts a **Flask-based Material Requirements Planning (MRP) web application**.

### Purpose
- Provide an interactive planning grid for SKU-level inventory and replenishment workflows.
- Combine deterministic planning logic (compute engine) with a lightweight AI copilot endpoint.
- Serve a browser-based UI via Flask templates and static JavaScript assets.

### High-Level Architecture
- `app.py`: Flask entrypoint with route definitions for UI and API endpoints.
- `engine.py`: Core business logic for MRP calculations and SKU projections.
- `data.py`: Source-of-truth constants and baseline datasets used by the app.
- `copilot.py`: AI response adapter used by `/api/copilot`.
- `templates/index.html`: Main HTML template and foundational styles.
- `static/app.js`: Front-end application behavior and interaction logic.

---

## Coding Standards

### General Standards
- Prefer **clarity over cleverness**: straightforward, readable code with descriptive names.
- Keep functions focused and small; each function should have one clear responsibility.
- Minimize side effects and isolate business logic from request/response handling.
- Preserve backward compatibility for API response shapes unless explicitly changing contracts.

### Python / Flask Standards
- Follow **PEP 8** formatting and naming conventions.
- Add docstrings for modules, routes, and non-trivial functions.
- Use Flask route handlers as thin controllers:
  - Validate/parse input.
  - Delegate computation to `engine.py` or other service modules.
  - Return JSON/HTML responses.
- Avoid embedding complex computation directly in route functions.
- Use explicit HTTP status codes for error responses (e.g., 400 for invalid inputs).

### Front-End Standards
- Keep template-level CSS organized and grouped by component responsibility.
- Preserve existing visual hierarchy and spacing unless the task requires redesign.
- Favor small, targeted style/DOM changes over broad refactors.
- Ensure changes remain usable on standard desktop viewport sizes.

### Data and Business Logic
- Treat `data.py` as canonical static data for local development/demo behavior.
- Keep formulas and projection logic centralized in `engine.py`.
- When adding new planning rules, include clear comments and deterministic behavior.

---

## Workflow Guidelines

### 1) Understand Before Editing
- Read the relevant module(s) before patching.
- Identify whether the change belongs in routes (`app.py`), logic (`engine.py`), or UI (`templates/` + `static/`).

### 2) Implement Minimally
- Apply the smallest change that fully addresses the request.
- Avoid unrelated refactors in the same commit.

### 3) Validate Locally
- Run lightweight checks first:
  - `python -m py_compile app.py`
- If logic changed, run additional focused checks where applicable.

### 4) Commit Hygiene
- Use concise, imperative commit messages.
- Keep commits scoped to a single intent.

### 5) Pull Request Quality
- Summarize motivation, what changed, and why.
- List validation commands and outcomes.
- Call out any known limitations or environment constraints.

---

## Flask-Specific Implementation Notes
- Keep JSON APIs under `/api/*` and UI routes separate for clarity.
- Continue using `request.get_json(force=True, silent=True) or {}` pattern when appropriate for tolerant parsing.
- Validate required request fields early and return descriptive errors.
- Avoid long-running tasks in request handlers; keep endpoints responsive.

---

## Operational Context for Contributors/Agents
- Repository path in this environment: `/workspace/MRP`.
- Environment typically supports shell-based validation and git operations.
- If remote push is unavailable, document the exact git error in status updates.
- For visual UI changes, provide a screenshot when screenshot tooling is available.

---

## Definition of Done (DoD)
A change is considered complete when:
1. The requested behavior is implemented and scoped correctly.
2. Relevant files remain readable and consistent with the standards above.
3. Basic validation commands pass (or limitations are explicitly documented).
4. Commit and PR notes accurately describe the change.
