from yt_dlp import YoutubeDL


class MediaExtractor:

    def extract(self, url: str):

        options = {
            "quiet": True,
            "skip_download": True,
        }

        with YoutubeDL(options) as ydl:

            info = ydl.extract_info(
                url,
                download=False
            )

        return {
            "platform": info.get("extractor"),
            "title": info.get("title"),
            "uploader": info.get("uploader"),
            "duration": info.get("duration"),
            "thumbnail": info.get("thumbnail"),
            "description": info.get("description"),
        }