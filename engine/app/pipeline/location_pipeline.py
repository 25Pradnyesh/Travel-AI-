import re


class LocationPipeline:

    def run(self, metadata):

        caption = metadata.get("caption") or ""
        title = metadata.get("title") or ""

        text = title + "\n" + caption

        candidates = self.extract_candidates(text)

        return {
            "input_text": text,
            "candidates": candidates,
            "best_guess": candidates[0] if candidates else None
        }

    def extract_candidates(self, text):

        pattern = r"[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*"

        matches = re.findall(pattern, text)

        return list(dict.fromkeys(matches))