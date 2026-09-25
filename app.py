"""
AI-Powered Cross-Ministry Governance & Impact Intelligence Platform (EL-03)
Flask Web Application & REST API Server
"""
import os
import sys
from flask import Flask, jsonify, request, render_template, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from intelligence.harmonizer import harmonizer
from intelligence.gap_analyzer import GapAnalyzer
from intelligence.overlap_detector import OverlapDetector
from intelligence.anomaly_detector import AnomalyDetector
from intelligence.recommendations import Recommender
from intelligence.nlp_query import NLPQueryEngine

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates"),
    static_folder=os.path.join(BASE_DIR, "static")
)

gap_analyzer = GapAnalyzer(harmonizer)
overlap_detector = OverlapDetector(harmonizer)
anomaly_detector = AnomalyDetector(harmonizer)
recommender = Recommender(harmonizer, gap_analyzer, anomaly_detector, overlap_detector)
nlp_engine = NLPQueryEngine(harmonizer, gap_analyzer, anomaly_detector, overlap_detector, recommender)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/summary", methods=["GET"])
def get_summary():
    df = harmonizer.harmonized_df
    total_budget = float(df["budget_allocated"].sum())
    total_spent = float(df["amount_spent"].sum())
    total_beneficiaries = int(df["beneficiaries"].sum())
    avg_progress = round(float(df["progress_percent"].mean()), 1)
    utilization_rate = round((total_spent / total_budget) * 100, 1) if total_budget > 0 else 0
    
    anomalies = anomaly_detector.detect_anomalies()
    gaps = gap_analyzer.analyze_district_gaps()
    overlaps = overlap_detector.detect_overlaps()

    under_invested_count = sum(1 for g in gaps if "Under-Invested" in g["investment_status"] or "Deficit" in g["investment_status"])
    high_anomalies_count = sum(1 for a in anomalies if a["severity"] == "HIGH")

    return jsonify({
        "status": "success",
        "data": {
            "total_budget": total_budget,
            "total_spent": total_spent,
            "utilization_rate": utilization_rate,
            "total_beneficiaries": total_beneficiaries,
            "avg_progress": avg_progress,
            "total_projects": len(df),
            "ministries_count": int(df["ministry"].nunique()),
            "schemes_count": int(df["scheme_name"].nunique()),
            "districts_count": int(df["district"].nunique()),
            "under_invested_districts_count": under_invested_count,
            "anomalies_count": len(anomalies),
            "high_anomalies_count": high_anomalies_count,
            "overlaps_count": len(overlaps),
            "ministries": list(df["ministry"].unique()),
            "categories": list(df["category"].unique()),
            "states": sorted(list(df["state"].unique()))
        }
    })

@app.route("/api/projects", methods=["GET"])
def get_projects():
    df = harmonizer.harmonized_df
    filtered = df.copy()

    ministry = request.args.get("ministry")
    category = request.args.get("category")
    state = request.args.get("state")
    district = request.args.get("district")
    status = request.args.get("status")
    search = request.args.get("search", "").strip().lower()

    if ministry and ministry != "All":
        filtered = filtered[filtered["ministry"] == ministry]
    if category and category != "All":
        filtered = filtered[filtered["category"] == category]
    if state and state != "All":
        filtered = filtered[filtered["state"] == state]
    if district and district != "All":
        filtered = filtered[filtered["district"] == district]
    if status and status != "All":
        filtered = filtered[filtered["status"] == status]
    if search:
        filtered = filtered[
            filtered["project_name"].str.lower().str.contains(search) |
            filtered["scheme_name"].str.lower().str.contains(search) |
            filtered["project_id"].str.lower().str.contains(search) |
            filtered["district"].str.lower().str.contains(search)
        ]

    records = filtered.to_dict(orient="records")
    return jsonify({
        "status": "success",
        "count": len(records),
        "data": records
    })

@app.route("/api/districts", methods=["GET"])
def get_districts():
    gaps = gap_analyzer.analyze_district_gaps()
    return jsonify({
        "status": "success",
        "count": len(gaps),
        "data": gaps
    })

@app.route("/api/ministries", methods=["GET"])
def get_ministries():
    mins = harmonizer.get_ministry_summary().to_dict(orient="records")
    return jsonify({
        "status": "success",
        "data": mins
    })

@app.route("/api/analytics/gaps", methods=["GET"])
def get_gaps():
    gaps = gap_analyzer.analyze_district_gaps()
    return jsonify({
        "status": "success",
        "data": gaps
    })

@app.route("/api/analytics/overlaps", methods=["GET"])
def get_overlaps():
    overlaps = overlap_detector.detect_overlaps()
    return jsonify({
        "status": "success",
        "data": overlaps
    })

@app.route("/api/analytics/anomalies", methods=["GET"])
def get_anomalies():
    anomalies = anomaly_detector.detect_anomalies()
    return jsonify({
        "status": "success",
        "data": anomalies
    })

@app.route("/api/recommendations", methods=["GET"])
def get_recommendations():
    recs = recommender.generate_recommendations()
    return jsonify({
        "status": "success",
        "data": recs
    })

@app.route("/api/query", methods=["POST"])
def run_query():
    body = request.get_json(force=True) if request.is_json else request.form
    query_text = body.get("query", "")
    if not query_text:
        return jsonify({"status": "error", "message": "Query string is required"}), 400

    result = nlp_engine.process_query(query_text)
    return jsonify({
        "status": "success",
        "data": result
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
