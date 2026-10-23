"""
Baseline evaluation of the 3 logged reels:
1. Varenna / Lake Como
2. Jeju Island
3. Korean-caption reel
"""

import time
import json
from engine.app.pipelines.location_pipeline import LocationPipeline
from engine.app.services.places.osm_provider import OsmProvider

reels = [
    {
        "id": "reel_1_varenna",
        "name": "Varenna / Lake Como",
        "url": "https://www.instagram.com/reel/DaAiVGUx7Cf/",
        "metadata": {
            "caption": "Found this secret paradise in Varenna, Lake Como! #travel #italy",
            "title": "",
            "tags": ["travel", "italy"],
            "owner_username": "traveler",
        },
        "video_path": None,
    },
    {
        "id": "reel_2_jeju",
        "name": "Jeju Island",
        "url": "https://www.instagram.com/reel/DbP7MQMxfcD/",
        "metadata": {
            "caption": "Exploring the volcanic landscapes of Jeju Island, South Korea. #jeju #korea",
            "title": "",
            "tags": ["jeju", "korea"],
            "owner_username": "traveler",
        },
        "video_path": None,
    },
    {
        "id": "reel_3_korean",
        "name": "Korean-caption reel",
        "url": "https://www.instagram.com/reel/KoreanReelSample/",
        "metadata": {
            "caption": "📍 제주도 서귀포시 외돌개 🌊 한국 여행 #제주도 #한국",
            "title": "",
            "tags": ["제주도", "한국"],
            "owner_username": "traveler",
        },
        "video_path": None,
    },
]

def run_baseline():
    provider = OsmProvider()
    pipeline = LocationPipeline(places_provider=provider)
    results = []

    for r in reels:
        t0 = time.perf_counter()
        print(f"\n==========================================")
        print(f"RUNNING BASELINE: {r['name']}")
        print(f"==========================================")
        try:
            res = pipeline.run(
                metadata=r["metadata"],
                video_path=r["video_path"],
                total_start=t0,
            )
        except Exception as e:
            res = {"success": False, "error": str(e), "error_type": type(e).__name__}
        dur = round(time.perf_counter() - t0, 3)

        bg = res.get("best_guess") or {}
        gem = res.get("gemini") or {}
        perf = res.get("performance") or {}
        stages = perf.get("stages", {})

        results.append({
            "name": r["name"],
            "success": res.get("success", False),
            "destination": bg.get("name") or bg.get("travel_name") or "None",
            "country": bg.get("country"),
            "confidence": bg.get("confidence"),
            "verification_status": bg.get("verification_status") or gem.get("status", "NONE"),
            "stage": res.get("stage"),
            "total_seconds": dur,
            "stages": stages,
            "error": res.get("error"),
        })

    print("\n\n" + "="*80)
    print("BASELINE MEASUREMENT RESULTS TABLE")
    print("="*80)
    print(f"{'Reel':<24} | {'Success':<7} | {'Destination':<22} | {'Conf':<5} | {'Verification':<12} | {'Time (s)':<8}")
    print("-" * 88)
    for r in results:
        print(f"{r['name']:<24} | {str(r['success']):<7} | {r['destination']:<22} | {str(r['confidence']):<5} | {r['verification_status']:<12} | {r['total_seconds']:<8.2f}")
    print("="*80)
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    run_baseline()
