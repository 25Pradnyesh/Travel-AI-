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

    def rank(self, candidates, metadata):

        title = (metadata.get("title") or "").lower()
        caption = (metadata.get("caption") or "").lower()
        tags = [tag.lower() for tag in (metadata.get("tags") or [])]

        ranked = []

        for candidate in candidates:

            score = 0
            name = candidate.lower()

            if name in title:
                score += 30

            if name in caption:
                score += 50

            if name in tags:
                score += 40

            if f"{name} in" in caption:
                score += 30

            if len(candidate.split()) > 1:
                score += 20

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

            if name in COUNTRIES:
                score -= 15

            ranked.append({
                "name": candidate,
                "score": score
            })

        ranked.sort(
            key=lambda x: x["score"],
            reverse=True
        )

        return ranked