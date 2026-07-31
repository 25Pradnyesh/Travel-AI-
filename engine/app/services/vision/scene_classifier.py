from pathlib import Path

import google.generativeai as genai


class SceneClassifier:

    def __init__(self):

        self.model = genai.GenerativeModel(
            "gemini-2.5-flash",
        )

    # ==================================================
    # Classify Scene
    # ==================================================

    def classify(
        self,
        image_path: str,
    ):

        image = Path(image_path)

        if not image.exists():

            return self.empty(
                "Image not found.",
            )

        prompt = """
You are an expert travel photographer.

Analyze ONLY the scene.

Return ONLY valid JSON.

Schema:

{
    "scene":"Mountain",
    "environment":"Natural",
    "terrain":"Rocky",
    "water_body":"Lake",
    "architecture":"European Village",
    "vegetation":"Pine Forest",
    "snow":true,
    "beach":false,
    "urban":false,
    "confidence":94
}

Rules:

- scene should be ONE of:

Mountain
Beach
Lake
Island
Village
City
Temple
Waterfall
Forest
Desert
Glacier
National Park
Countryside

If unknown use:

Destination

Do not explain.

Do not use markdown.

Only JSON.
"""

        try:

            uploaded = genai.upload_file(
                path=str(image),
            )

            response = self.model.generate_content(
                [
                    prompt,
                    uploaded,
                ]
            )

            return self.parse(
                response.text,
            )

        except Exception as e:

            return self.empty(
                str(e),
            )

    # ==================================================
    # Parse
    # ==================================================

    def parse(
        self,
        text: str,
    ):

        import json
        import re

        if not text:

            return self.empty()

        text = re.sub(
            r"^```(?:json)?",
            "",
            text.strip(),
            flags=re.IGNORECASE,
        )

        text = re.sub(
            r"```$",
            "",
            text,
        ).strip()

        try:

            data = json.loads(
                text,
            )

        except Exception:

            return self.empty(
                "Invalid JSON",
            )

        return {

            "scene": data.get(
                "scene",
                "Destination",
            ),

            "environment": data.get(
                "environment",
                "",
            ),

            "terrain": data.get(
                "terrain",
                "",
            ),

            "water_body": data.get(
                "water_body",
                "",
            ),

            "architecture": data.get(
                "architecture",
                "",
            ),

            "vegetation": data.get(
                "vegetation",
                "",
            ),

            "snow": bool(
                data.get(
                    "snow",
                    False,
                )
            ),

            "beach": bool(
                data.get(
                    "beach",
                    False,
                )
            ),

            "urban": bool(
                data.get(
                    "urban",
                    False,
                )
            ),

            "confidence": int(
                data.get(
                    "confidence",
                    0,
                )
            ),

        }

    # ==================================================
    # Empty
    # ==================================================

    def empty(
        self,
        reason="",
    ):

        return {

            "scene": "Destination",

            "environment": "",

            "terrain": "",

            "water_body": "",

            "architecture": "",

            "vegetation": "",

            "snow": False,

            "beach": False,

            "urban": False,

            "confidence": 0,

            "reason": reason,

        }