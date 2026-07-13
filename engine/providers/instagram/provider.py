from pathlib import Path
import uuid

from yt_dlp import YoutubeDL
from yt_dlp.utils import DownloadError

from engine.providers.base import BaseProvider


class InstagramYtDlpProvider(BaseProvider):

    def extract(self, url: str):

        downloads = Path("engine/assets/downloads")
        downloads.mkdir(parents=True, exist_ok=True)

        filename = f"{uuid.uuid4().hex}.%(ext)s"
        output_template = str(downloads / filename)

        # Keep the options identical to the CLI.
        options = {
            "quiet": True,
            "outtmpl": output_template,
        }

        try:

            with YoutubeDL(options) as ydl:

                info = ydl.extract_info(
                    url,
                    download=True,
                )

                # ---------- DEBUG ----------
                print("\n========== INFO KEYS ==========")
                print(info.keys())
                print("===============================\n")

                requested = info.get("requested_downloads")

                if requested:
                    video_path = requested[0]["filepath"]
                else:
                    video_path = ydl.prepare_filename(info)

        except DownloadError as e:
            raise Exception(
                f"Instagram download failed.\n\n{e}"
            )

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

        return {
            "platform": info.get("extractor"),
            "video_path": video_path,
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