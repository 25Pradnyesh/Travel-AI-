COUNTRIES = {
    "austria",
    "italy",
    "france",
    "switzerland",
    "india",
    "japan",
    "norway",
    "germany",
    "spain",
    "iceland",
}


class ScoringService:

    def rank(self, candidates, evidence):

        title = (evidence.get("title") or "").lower()
        caption = (evidence.get("caption") or "").lower()
        tags = [tag.lower() for tag in (evidence.get("hashtags") or [])]
        ocr_text = (evidence.get("ocr_text") or "").lower()

        ranked = []

        for candidate in candidates:

            score = 0
            name = candidate.lower()

            # Mentioned in title
            if name in title:
                score += 30

            # Mentioned in caption
            if name in caption:
                score += 50

            # Mentioned in hashtags
            if name in tags:
                score += 40

            # Mentioned in OCR
            if name in ocr_text:
                score += 60

            # "<location> in Country"
            if f"{name} in" in caption:
                score += 30

            # Multi-word locations are usually more specific
            if len(candidate.split()) > 1:
                score += 20

            # Travel context
            if "hike" in caption:
                score += 10

            if "lake" in caption:
                score += 10

            if "beach" in caption:
                score += 10

            if "waterfall" in caption:
                score += 10

            if "mountain" in caption:
                score += 10

            # Penalize country names slightly
            if name in COUNTRIES:
                score -= 15

            ranked.append({
                "name": candidate,
                "score": score,
            })

        ranked.sort(
            key=lambda x: x["score"],
            reverse=True,
        )

        return ranked