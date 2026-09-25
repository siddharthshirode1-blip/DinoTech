import sys
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from intelligence.harmonizer import harmonizer
from intelligence.gap_analyzer import GapAnalyzer
from intelligence.overlap_detector import OverlapDetector
from intelligence.anomaly_detector import AnomalyDetector
from intelligence.recommendations import Recommender
from intelligence.nlp_query import NLPQueryEngine

def test_all():
    print("Testing Data Harmonizer...")
    df = harmonizer.harmonized_df
    print(f"Loaded {len(df)} projects. Columns: {list(df.columns)}")
    assert len(df) == 60, "Expected 60 projects"

    dist_summary = harmonizer.get_district_summary()
    print(f"Districts summarized: {len(dist_summary)}")

    print("\nTesting Gap Analyzer...")
    ga = GapAnalyzer(harmonizer)
    gaps = ga.analyze_district_gaps()
    print(f"Evaluated gaps for {len(gaps)} districts.")
    print(f"Top 3 under-invested: {[g['district'] + ' (' + g['investment_status'] + ')' for g in gaps[:3]]}")

    print("\nTesting Overlap Detector...")
    od = OverlapDetector(harmonizer)
    overlaps = od.detect_overlaps()
    print(f"Detected {len(overlaps)} overlaps/synergies.")
    for o in overlaps[:2]:
        print(f"  Overlap domain: {o['domain']} in {o['district']} ({len(o['schemes'])} schemes)")

    print("\nTesting Anomaly Detector...")
    ad = AnomalyDetector(harmonizer)
    anomalies = ad.detect_anomalies()
    print(f"Detected {len(anomalies)} anomalies.")
    for a in anomalies[:3]:
        print(f"  Anomaly: {a['project_id']} | Severity: {a['severity']} | Type: {a['anomaly_type']}")

    print("\nTesting Recommender...")
    rec = Recommender(harmonizer, ga, ad, od)
    recs = rec.generate_recommendations()
    print(f"Generated {len(recs)} traceable recommendations.")
    for r in recs:
        print(f"  [{r['urgency']}] {r['title']}")

    print("\nTesting NLP Query Engine...")
    nlp = NLPQueryEngine(harmonizer, ga, ad, od, rec)
    res1 = nlp.process_query("Which districts have high malnutrition but low nutrition spend?")
    print(f"Query 1: {res1['headline']}")
    res2 = nlp.process_query("Show delayed projects with high spend")
    print(f"Query 2: {res2['headline']}")
    res3 = nlp.process_query("Show schemes in Patna")
    print(f"Query 3: {res3['headline']}")

    print("\nALL INTELLIGENCE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_all()
