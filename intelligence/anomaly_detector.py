"""
Government Expenditure & Execution Anomaly Detector
Surfaces high-risk anomalies such as delayed projects with depleted budgets,
cost overruns exceeding sanctioned outlays, and capital blockage.
"""
import pandas as pd

class AnomalyDetector:
    def __init__(self, harmonizer):
        self.harmonizer = harmonizer

    def detect_anomalies(self):
        df = self.harmonizer.harmonized_df
        anomalies = []

        for _, row in df.iterrows():
            reasons = []
            severity = "LOW"
            anomaly_type = None

            budget = float(row["budget_allocated"])
            spent = float(row["amount_spent"])
            progress = float(row["progress_percent"])
            status = str(row["status"]).strip()
            utilization = float(row["utilization_rate"])

            # 1. Critical Cost Overrun
            if spent > budget and budget > 0:
                overrun_pct = round(((spent - budget) / budget) * 100, 1)
                severity = "HIGH"
                anomaly_type = "Sanctioned Budget Overrun"
                reasons.append(f"Expenditure (Rs {spent:,.0f}) exceeded sanctioned budget (Rs {budget:,.0f}) by {overrun_pct}%.")

            # 2. Delayed Project with Depleted or High Funds
            if status == "Delayed" and utilization >= 70:
                severity = "HIGH"
                anomaly_type = "Severe Delay with High Capital Depletion"
                reasons.append(f"Project is officially marked DELAYED despite {utilization}% of funds already spent.")
            elif status == "Delayed":
                severity = "MEDIUM" if severity != "HIGH" else "HIGH"
                anomaly_type = anomaly_type or "Implementation Stagnation"
                reasons.append(f"Project flagged as DELAYED with only {progress}% completion recorded.")

            # 3. Capital Leakage / Decoupling: High Funds Spent vs Low Progress
            if utilization >= 60 and progress <= 35:
                severity = "HIGH"
                anomaly_type = "Fund-to-Milestone Decoupling"
                reasons.append(f"Disproportionate capital consumption: {utilization}% budget expended but physical progress is only {progress}%.")

            # 4. Low Burn Rate / Capital Blockage nearing completion
            if status == "Ongoing" and utilization < 30 and progress < 30:
                severity = "MEDIUM" if severity != "HIGH" else "HIGH"
                anomaly_type = anomaly_type or "Sluggish Fund Absorption"
                reasons.append(f"Sluggish capital absorption rate: only {utilization}% utilized with low execution velocity ({progress}%).")

            if reasons:
                anomalies.append({
                    "project_id": row["project_id"],
                    "project_name": row["project_name"],
                    "scheme_name": row["scheme_name"],
                    "ministry": row["ministry"],
                    "state": row["state"],
                    "district": row["district"],
                    "status": status,
                    "budget_allocated": budget,
                    "amount_spent": spent,
                    "utilization_rate": utilization,
                    "progress_percent": progress,
                    "beneficiaries": int(row["beneficiaries"]),
                    "cost_per_beneficiary": float(row["cost_per_beneficiary"]),
                    "anomaly_type": anomaly_type,
                    "severity": severity,
                    "reasons": reasons
                })

        # Order by severity: HIGH first, then MEDIUM, then LOW
        sev_rank = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
        anomalies.sort(key=lambda x: (sev_rank.get(x["severity"], 3), -x["utilization_rate"]))
        return anomalies
