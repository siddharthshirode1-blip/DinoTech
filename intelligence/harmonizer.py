"""
Dataset Harmonization Engine
Ingests heterogeneous datasets:
1. Project execution records (60 central projects across 5 ministries)
2. District socio-economic deprivation and demographics index
3. Union Ministry scheme metadata and allocations
"""
import os
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

class DataHarmonizer:
    def __init__(self):
        self.projects_df = None
        self.demographics_df = None
        self.schemes_df = None
        self.harmonized_df = None
        self.load_and_harmonize()

    def load_and_harmonize(self):
        proj_path = os.path.join(DATA_DIR, "projects_data.csv")
        demo_path = os.path.join(DATA_DIR, "district_demographics.csv")
        scheme_path = os.path.join(DATA_DIR, "ministry_schemes.csv")

        self.projects_df = pd.read_csv(proj_path)
        self.demographics_df = pd.read_csv(demo_path)
        self.schemes_df = pd.read_csv(scheme_path)

        # Standardize strings
        self.projects_df["district"] = self.projects_df["district"].str.strip()
        self.demographics_df["district"] = self.demographics_df["district"].str.strip()
        self.projects_df["scheme_name"] = self.projects_df["scheme_name"].str.strip()
        self.schemes_df["scheme_name"] = self.schemes_df["scheme_name"].str.strip()

        # Derived project metrics
        self.projects_df["budget_allocated"] = pd.to_numeric(self.projects_df["budget_allocated"], errors="coerce").fillna(0)
        self.projects_df["amount_spent"] = pd.to_numeric(self.projects_df["amount_spent"], errors="coerce").fillna(0)
        self.projects_df["beneficiaries"] = pd.to_numeric(self.projects_df["beneficiaries"], errors="coerce").fillna(0)
        self.projects_df["progress_percent"] = pd.to_numeric(self.projects_df["progress_percent"], errors="coerce").fillna(0)

        self.projects_df["utilization_rate"] = np.where(
            self.projects_df["budget_allocated"] > 0,
            (self.projects_df["amount_spent"] / self.projects_df["budget_allocated"]) * 100,
            0
        ).round(1)

        self.projects_df["cost_per_beneficiary"] = np.where(
            self.projects_df["beneficiaries"] > 0,
            (self.projects_df["amount_spent"] / self.projects_df["beneficiaries"]).round(1),
            0
        )

        # Merge with Demographics on district
        merged = pd.merge(
            self.projects_df,
            self.demographics_df[["district", "population", "poverty_headcount_pct", "child_malnutrition_pct", "agri_workforce_pct", "healthcare_deficit_pct", "literacy_rate_pct", "composite_need_index"]],
            on="district",
            how="left"
        )

        # Merge with Schemes on scheme_name
        merged = pd.merge(
            merged,
            self.schemes_df[["scheme_name", "central_budget_cr", "target_sector", "sdg_goal", "mandate_description"]],
            on="scheme_name",
            how="left"
        )

        self.harmonized_df = merged
        return self.harmonized_df

    def get_district_summary(self):
        """Aggregate data by district including need index, total budget, spend, beneficiaries, and per capita spend"""
        grouped = self.harmonized_df.groupby("district").agg(
            state=("state", "first"),
            latitude=("latitude", "first"),
            longitude=("longitude", "first"),
            total_budget=("budget_allocated", "sum"),
            total_spent=("amount_spent", "sum"),
            avg_progress=("progress_percent", "mean"),
            total_beneficiaries=("beneficiaries", "sum"),
            project_count=("project_id", "count"),
            population=("population", "first"),
            composite_need_index=("composite_need_index", "first"),
            poverty_rate=("poverty_headcount_pct", "first"),
            malnutrition_rate=("child_malnutrition_pct", "first"),
            healthcare_deficit=("healthcare_deficit_pct", "first"),
            agri_workforce=("agri_workforce_pct", "first")
        ).reset_index()

        grouped["per_capita_spend"] = (grouped["total_spent"] / grouped["population"]).round(2)
        grouped["utilization_rate"] = ((grouped["total_spent"] / grouped["total_budget"]) * 100).round(1)
        grouped["avg_progress"] = grouped["avg_progress"].round(1)
        return grouped

    def get_ministry_summary(self):
        """Aggregate data by Union Ministry"""
        grouped = self.harmonized_df.groupby("ministry").agg(
            total_budget=("budget_allocated", "sum"),
            total_spent=("amount_spent", "sum"),
            total_beneficiaries=("beneficiaries", "sum"),
            avg_progress=("progress_percent", "mean"),
            project_count=("project_id", "count"),
            schemes=("scheme_name", lambda x: list(set(x)))
        ).reset_index()

        grouped["utilization_rate"] = ((grouped["total_spent"] / grouped["total_budget"]) * 100).round(1)
        grouped["avg_progress"] = grouped["avg_progress"].round(1)
        return grouped

harmonizer = DataHarmonizer()
