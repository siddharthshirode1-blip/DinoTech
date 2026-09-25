"""
Cross-Ministry Scheme Overlap & Synergies Detector
Identifies parallel schemes running in the same geography targeting identical beneficiary segments
or developmental objectives across different Union Ministries.
"""
import pandas as pd

class OverlapDetector:
    def __init__(self, harmonizer):
        self.harmonizer = harmonizer

    def detect_overlaps(self):
        df = self.harmonizer.harmonized_df

        # Define functional synergy domains that cut across ministries
        # 1. Nutrition & Child Health: MoE (Mid-Day Meal) vs WCD (Poshan Abhiyaan, ICDS) vs MoHFW (Mission Indradhanush)
        # 2. Rural Connectivity & Public Works: MoRD (MGNREGA, PMGSY) vs MoA (RKVY farm roads)
        # 3. Women Socioeconomic Empowerment: MoRD (NRLM SHGs) vs WCD (Beti Bachao Beti Padhao)
        # 4. Digital Delivery & Capacity: MoE (PM e-VIDYA) vs MoA (e-NAM) vs MoHFW (Telemedicine)

        overlaps = []

        # Group projects by district and identify co-occurring categories and schemes
        districts = df["district"].unique()
        for dist in districts:
            d_df = df[df["district"] == dist]
            
            # Nutrition convergence check
            nutrition_projs = d_df[d_df["scheme_name"].isin(["Mid-Day Meal", "Poshan Abhiyaan", "ICDS"])]
            if len(nutrition_projs) >= 2:
                ministries = list(nutrition_projs["ministry"].unique())
                if len(ministries) > 1:
                    overlaps.append({
                        "domain": "Child & Maternal Nutrition Convergence",
                        "district": dist,
                        "state": nutrition_projs["state"].iloc[0],
                        "ministries_involved": ministries,
                        "schemes": list(nutrition_projs["scheme_name"].unique()),
                        "project_ids": list(nutrition_projs["project_id"]),
                        "total_combined_budget": float(nutrition_projs["budget_allocated"].sum()),
                        "total_combined_spent": float(nutrition_projs["amount_spent"].sum()),
                        "total_beneficiaries": int(nutrition_projs["beneficiaries"].sum()),
                        "risk_level": "MODERATE",
                        "description": f"Multiple nutrition initiatives operated separately by {', '.join(ministries)}. Risk of duplicate beneficiary ration counting and fragmented supply chain procurement.",
                        "convergence_opportunity": "Consolidate Anganwadi and school meal kitchen grain procurement under a unified District Nutrition Logistics Cell."
                    })

            # Rural Infrastructure / Public Works check
            infra_projs = d_df[d_df["scheme_name"].isin(["MGNREGA", "PMGSY", "PMAY-G"])]
            if len(infra_projs) >= 2:
                overlaps.append({
                    "domain": "Rural Civil Works & Asset Construction",
                    "district": dist,
                    "state": infra_projs["state"].iloc[0],
                    "ministries_involved": list(infra_projs["ministry"].unique()),
                    "schemes": list(infra_projs["scheme_name"].unique()),
                    "project_ids": list(infra_projs["project_id"]),
                    "total_combined_budget": float(infra_projs["budget_allocated"].sum()),
                    "total_combined_spent": float(infra_projs["amount_spent"].sum()),
                    "total_beneficiaries": int(infra_projs["beneficiaries"].sum()),
                    "risk_level": "LOW",
                    "description": f"Synergistic rural development works ({', '.join(infra_projs['scheme_name'].unique())}) actively underway.",
                    "convergence_opportunity": "Leverage MGNREGA manual earthwork for PMGSY road foundations and PMAY-G plot level water drainage to reduce contracted civil costs."
                })

            # Women Empowerment check
            women_projs = d_df[d_df["category"] == "Women Empowerment"]
            if len(women_projs) >= 2:
                overlaps.append({
                    "domain": "Women Skill Development & Livelihood Mobilization",
                    "district": dist,
                    "state": women_projs["state"].iloc[0],
                    "ministries_involved": list(women_projs["ministry"].unique()),
                    "schemes": list(women_projs["scheme_name"].unique()),
                    "project_ids": list(women_projs["project_id"]),
                    "total_combined_budget": float(women_projs["budget_allocated"].sum()),
                    "total_combined_spent": float(women_projs["amount_spent"].sum()),
                    "total_beneficiaries": int(women_projs["beneficiaries"].sum()),
                    "risk_level": "MEDIUM",
                    "description": f"Overlapping women mobilization by {', '.join(women_projs['ministry'].unique())} (NRLM SHGs and Beti Bachao Beti Padhao).",
                    "convergence_opportunity": "Utilize existing NRLM SHG federations as field execution partners for WCD awareness camps to avoid establishing duplicate village committees."
                })

        return overlaps
