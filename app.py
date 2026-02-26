"""Flask app for MRP Planning Grid."""
from flask import Flask, request, jsonify, render_template

from data import RAW_SKUS, WEEK_LABELS, ROW_TYPES, VENDORS, NOTE_TAGS
from engine import compute_all
from copilot import generate_ai_response

app = Flask(__name__, static_folder="static", template_folder="templates")


@app.route("/")
def index():
    """Serve the MRP planning grid UI."""
    return render_template(
        "index.html",
        week_labels=WEEK_LABELS,
        row_types=ROW_TYPES,
        vendors=VENDORS,
        note_tags=NOTE_TAGS,
        raw_skus=RAW_SKUS,
    )


@app.route("/api/compute", methods=["POST"])
def api_compute():
    """Compute SKU projections from raw SKUs and manual orders."""
    data = request.get_json(force=True, silent=True) or {}
    manual_orders = data.get("manualOrders") or {}
    computed = compute_all(RAW_SKUS, manual_orders)
    return jsonify(computed=computed)


@app.route("/api/copilot", methods=["POST"])
def api_copilot():
    """Get copilot response for a query given computed SKUs and notes."""
    data = request.get_json(force=True, silent=True) or {}
    query = (data.get("query") or "").strip()
    computed = data.get("computed") or []
    notes = data.get("notes") or {}
    if not query:
        return jsonify(error="Missing query"), 400
    text = generate_ai_response(query, computed, notes)
    return jsonify(text=text)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
