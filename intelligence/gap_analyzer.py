"""
Investment Gap & Need Disparity Analyzer
Pinpoints where central funds are invested vs where critical local need exists,
revealing under-invested and over-invested districts across sectors.
"""
import pandas as pd
import numpy as np

class GapAnalyzer:
    def __init__(self, harmonizer):
        self.harmonizer = harmonizer

    def analyze_district_gaps(self):
        dist_df = self.harmonizer.get_district_summary()
        
        # Calculate percentiles for Need and Spending
        # Need index: Higher means more deprived / more needed (0 - 100)
        # Per capita spend: How much government money spent per citizen
        mean_spend = dist_df["per_capita_spend"].mean()
        std_spend = dist_df["per_capita_spend"].std() if dist_df["per_capita_spend"].std() > 0 else 1
        
        mean_need = dist_df["composite_need_index"].mean()
        std_need = dist_df["composite_need_index"].std() if dist_df["composite_need_index"].std() > 0 else 1

        # Z-scores
        dist_df["need_z"] = (dist_df["composite_need_index"] - mean_need) / std_need
        dist_df["spend_z"] = (dist_df["per_capita_spend"] - mean_spend) / std_spend

        # Disparity Gap Score = Need Z-Score - Spend Z-Score
        # If Positive and high: High need but received low spending -> CRITICALLY UNDER-INVESTED
        # If Negative and low: Low need but received high spending -> RELATIVELY SATURATED / OVER-INVESTED
        dist_df["disparity_score"] = (dist_df["need_z"] - dist_df["spend_z"]).round(2)

        def classify_investment_status(row):
            if row["disparity_score"] >= 0.7:
                return "Critically Under-Invested"
            elif row["disparity_score"] >= 0.2:
                return "Moderate Deficit"
            elif row["disparity_score"] >= -0.3:
                return "Balanced"
            elif row["disparity_score"] >= -0.8:
                return "Well Funded"
            else:
                return "Over-Invested / Saturated"

        dist_df["investment_status"] = dist_df.apply(classify_investment_status, axis=1)

        # Detailed Sector Deficit Analysis per district
        df_full = self.harmonizer.harmonized_df
        gaps_list = []
        for _, row in dist_df.iterrows():
            dname = row["district"]
            sub = df_full[df_full["district"] == dname]

            # Category spending
            cat_spend = sub.groupby("category")["amount_spent"].sum().to_dict()
            nutr_spend = cat_spend.get("Nutrition", 0)
            health_spend = cat_spend.get("Health", 0)
            agri_spend = cat_spend.get("Agriculture", 0)
            edu_spend = cat_spend.get("Education", 0)
            infra_spend = cat_spend.get("Infrastructure", 0)

            specific_gaps = []
            if row["malnutrition_rate"] > 30 and nutr_spend < 15000000:
                specific_gaps.append({
                    "sector": "Child Nutrition",
                    "severity": "CRITICAL" if row["malnutrition_rate"] > 35 else "HIGH",
                    "driver": f"Child malnutrition is high ({row['malnutrition_rate']}%), yet WCD nutrition spending is only Rs {nutr_spend:,}."
                })
            
            if row["healthcare_deficit"] > 30 and health_spend < 15000000:
                specific_gaps.append({
                    "sector": "Healthcare Access",
                    "severity": "HIGH",
                    "driver": f"Healthcare access deficit is {row['healthcare_deficit']}%, but MoHFW spending is restricted to Rs {health_spend:,}."
                })

            if row["agri_workforce"] > 35 and agri_spend < 15000000:
                specific_gaps.append({
                    "sector": "Agrarian Support",
                    "severity": "MEDIUM",
                    "driver": f"{row['agri_workforce']}% of workforce is in agriculture, with only Rs {agri_spend:,} allocated in direct farming projects."
                })

            gaps_list.append({
                "district": row["district"],
                "state": row["state"],
                "population": int(row["population"]),
                "composite_need_index": float(row["composite_need_index"]),
                "total_spent": float(row["total_spent"]),
                "total_budget": float(row["total_budget"]),
                "per_capita_spend": float(row["per_capita_spend"]),
                "disparity_score": float(row["disparity_score"]),
                "investment_status": row["investment_status"],
                "specific_gaps": specific_gaps,
                "project_count": int(row["project_count"]),
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"])
            })

        # Sort by most under-invested first
        gaps_list.sort(key=lambda x: x["disparity_score"], reverse=True)
        return gaps_list
