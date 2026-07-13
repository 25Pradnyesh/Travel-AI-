from yt_dlp import YoutubeDL
from engine.providers.base import BaseProvider


class InstagramYtDlpProvider(BaseProvider):

    def extract(self, url: str):

        options = {
            "quiet": True,
            "skip_download": True,
        }

        with YoutubeDL(options) as ydl:
            info = ydl.extract_info(url, download=False)

        # ---------- DEBUG ----------
        print("\n========== RAW INFO ==========")

        interesting_keys = [
            "title",
            "description",
            "tags",
            "categories",
            "location",
            "uploader",
            "uploader_id",
            "channel",
            "duration",
            "thumbnail",
            "webpage_url",
            "upload_date",
            "extractor",
        ]

        for key in interesting_keys:
            print(f"{key}: {info.get(key)}")

        print("==============================\n")

        # ---------- NORMALIZED ----------
        return {
            "platform": info.get("extractor"),
            "metadata": {
                "title": info.get("title"),
                "caption": info.get("description"),
                "tags": info.get("tags"),
                "categories": info.get("categories"),
                "location": info.get("location"),
                "creator": info.get("uploader"),
                "creator_id": info.get("uploader_id"),
                "duration": info.get("duration"),
                "thumbnail": info.get("thumbnail"),
                "url": info.get("webpage_url"),
                "upload_date": info.get("upload_date"),
            },
        }