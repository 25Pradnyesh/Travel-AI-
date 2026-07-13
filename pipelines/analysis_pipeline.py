import re

# Words that are NOT locations
STOPWORDS = {
    "save",
    "visit",
    "travel",
    "trip",
    "europe",
    "world",
    "hidden",
    "beautiful",
    "amazing",
    "place",
    "destination",
    "adventure",
    "vacation",
}

# Known countries (V1)
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
    "usa",
    "canada",
    "greece",
    "portugal",
    "thailand",
    "indonesia",
}


class LocationPipeline:

    def run(self, metadata: dict):

        text = self.build_text(metadata)

        candidates = self.extract_candidates(text)

        ranked = self.rank_candidates(candidates, metadata)

        return {
            "input_text": text,
            "candidates": candidates,
            "ranked_candidates": ranked,
            "best_guess": ranked[0] if ranked else None,
        }

    # --------------------------------------------------

    def build_text(self, metadata):

        parts = []

        # Title
        title = metadata.get("title")
        if title:
            parts.append(title)

        # Caption
        caption = metadata.get("caption")
        if caption:
            parts.append(caption)

        # Hashtags
        tags = metadata.get("tags") or []
        if tags:
            parts.append(" ".join(tags))

        return "\n".join(parts)

    # --------------------------------------------------

    def extract_candidates(self, text):

        pattern = r"[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*"

        matches = re.findall(pattern, text)

        filtered = []

        for word in matches:

            if word.lower() in STOPWORDS:
                continue

            if word not in filtered:
                filtered.append(word)

        return filtered

    # --------------------------------------------------

    def rank_candidates(self, candidates, metadata):

        title = (metadata.get("title") or "").lower()
        caption = (metadata.get("caption") or "").lower()
        tags = [tag.lower() for tag in (metadata.get("tags") or [])]

        ranked = []

        for candidate in candidates:

            name = candidate.lower()
            score = 0

            # Mentioned in title
            if name in title:
                score += 30

            # Mentioned in caption
            if name in caption:
                score += 50

            # Mentioned as hashtag
            if name in tags:
                score += 40

            # Appears before "in"
            # Example: "Seebensee in Austria"
            if f"{name} in" in caption:
                score += 30

            # Country penalty
            if name in COUNTRIES:
                score -= 15

            # Travel context bonus
            travel_keywords = [
                "hike",
                "lake",
                "beach",
                "mountain",
                "waterfall",
                "trek",
                "trail",
                "island",
                "viewpoint",
            ]

            for keyword in travel_keywords:
                if keyword in caption:
                    score += 10

            # Multi-word locations are usually more specific
            if len(candidate.split()) > 1:
                score += 20

            ranked.append(
                {
                    "name": candidate,
                    "score": score,
                }
            )

        ranked.sort(
            key=lambda x: x["score"],
            reverse=True,
        )

        return ranked