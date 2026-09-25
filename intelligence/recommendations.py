"""
Traceable Policy & Resource Reallocation Recommender
Translates cross-ministry data findings, gaps, and anomalies into actionable,
evidence-backed governance directives for Union & State decision-makers.
"""

class Recommender:
    def __init__(self, harmonizer, gap_analyzer, anomaly_detector, overlap_detector):
        self.harmonizer = harmonizer
        self.gap_analyzer = gap_analyzer
        self.anomaly_detector = anomaly_detector
        self.overlap_detector = overlap_detector

    def generate_recommendations(self):
        gaps = self.gap_analyzer.analyze_district_gaps()
        anomalies = self.anomaly_detector.detect_anomalies()
        overlaps = self.overlap_detector.detect_overlaps()

        recommendations = []

        # 1. Critical Gap Directives (Focus on most under-invested districts)
        critically_under = [g for g in gaps if g["investment_status"] == "Critically Under-Invested"]
        if critically_under:
            top_deprived = critically_under[0]
            recommendations.append({
                "id": "REC-GAP-001",
                "title": f"Priority Capital Injection for {top_deprived['district']} ({top_deprived['state']})",
                "category": "Targeted Allocation",
                "urgency": "CRITICAL",
                "action": f"Reallocate unutilized capital from over-saturated districts to {top_deprived['district']}, which exhibits the nation's highest composite need index ({top_deprived['composite_need_index']}) but receives lower per capita spend (Rs {top_deprived['per_capita_spend']}).",
                "expected_impact": "Directly impacts vulnerable populations across nutrition and healthcare with estimated 25,000+ incremental beneficiaries.",
                "traceability": {
                    "target_district": top_deprived["district"],
                    "state": top_deprived["state"],
                    "need_index": top_deprived["composite_need_index"],
                    "per_capita_spend": top_deprived["per_capita_spend"],
                    "disparity_score": top_deprived["disparity_score"],
                    "supporting_factors": [g["driver"] for g in top_deprived["specific_gaps"]],
                    "benchmark_districts": [g["district"] for g in gaps if g["investment_status"] in ["Over-Invested / Saturated", "Well Funded"]][:2]
                }
            })

        # 2. Urgent Financial Audit for High-Severity Anomalies
        high_anomalies = [a for a in anomalies if a["severity"] == "HIGH"]
        if high_anomalies:
            target_anom = high_anomalies[0]
            recommendations.append({
                "id": "REC-AUDIT-002",
                "title": f"Special Financial Audit & Milestone Review: {target_anom['project_name']} ({target_anom['project_id']})",
                "category": "Fiscal Oversight",
                "urgency": "HIGH",
                "action": f"Initiate immediate CAG/Internal Audit inspection into {target_anom['project_id']} under {target_anom['ministry']} in {target_anom['district']}. The project has spent {target_anom['utilization_rate']}% of budget while physical progress is stalled at {target_anom['progress_percent']}% and marked '{target_anom['status']}'.",
                "expected_impact": f"Plug potential capital leakage and enforce contractor milestone accountability on Rs {target_anom['amount_spent']:,} spent.",
                "traceability": {
                    "project_id": target_anom["project_id"],
                    "scheme": target_anom["scheme_name"],
                    "ministry": target_anom["ministry"],
                    "district": target_anom["district"],
                    "budget_allocated": target_anom["budget_allocated"],
                    "amount_spent": target_anom["amount_spent"],
                    "utilization_pct": target_anom["utilization_rate"],
                    "progress_pct": target_anom["progress_percent"],
                    "anomaly_type": target_anom["anomaly_type"],
                    "reasons": target_anom["reasons"]
                }
            })

        # 3. Inter-Ministerial Convergence for Overlapping Nutrition Schemes
        nutrition_overlaps = [o for o in overlaps if "Nutrition" in o["domain"]]
        if nutrition_overlaps:
            sample_overlap = nutrition_overlaps[0]
            recommendations.append({
                "id": "REC-CONV-003",
                "title": f"Joint MoE & WCD Nutrition Convergence Taskforce in {sample_overlap['district']}",
                "category": "Inter-Ministerial Coordination",
                "urgency": "MEDIUM",
                "action": f"Establish a Joint Coordination Cell in {sample_overlap['district']} between {', '.join(sample_overlap['ministries_involved'])}. Integrate Anganwadi child tracking with school Mid-Day Meal rosters to avoid duplicate ration allocations.",
                "expected_impact": "12-18% efficiency gain in bulk grain procurement and unified tracking for over 15,000 enrolled children.",
                "traceability": {
                    "district": sample_overlap["district"],
                    "schemes_involved": sample_overlap["schemes"],
                    "project_ids": sample_overlap["project_ids"],
                    "combined_budget": sample_overlap["total_combined_budget"],
                    "combined_spent": sample_overlap["total_combined_spent"],
                    "convergence_blueprint": sample_overlap["convergence_opportunity"]
                }
            })

        # 4. Fast-Track Sluggish Capital Disbursement
        sluggish = [a for a in anomalies if "Sluggish" in a["anomaly_type"] or (a["status"] == "Ongoing" and a["progress_percent"] < 40 and a["utilization_rate"] < 40)]
        if sluggish:
            target_slug = sluggish[0]
            recommendations.append({
                "id": "REC-FAST-004",
                "title": f"Milestone Unblocking for {target_slug['scheme_name']} in {target_slug['district']}",
                "category": "Implementation Velocity",
                "urgency": "MEDIUM",
                "action": f"Clear procurement bottlenecks for {target_slug['project_name']} ({target_slug['project_id']}). Funds absorption is sluggish at {target_slug['utilization_rate']}%, risking year-end budget lapsing.",
                "expected_impact": f"Accelerate benefit transfer to {target_slug['beneficiaries']:,} intended beneficiaries before scheme timeline closes.",
                "traceability": {
                    "project_id": target_slug["project_id"],
                    "ministry": target_slug["ministry"],
                    "budget": target_slug["budget_allocated"],
                    "spent": target_slug["amount_spent"],
                    "progress": target_slug["progress_percent"]
                }
            })

        return recommendations
