from pathlib import Path
import uuid

from yt_dlp import YoutubeDL
from yt_dlp.utils import DownloadError

from engine.providers.base import BaseProvider


class InstagramYtDlpProvider(BaseProvider):

    def __init__(self):

        self.download_dir = Path(
            "engine/assets/downloads",
        )

        self.download_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

    # ==================================================
    # yt-dlp Options
    # ==================================================

    def build_options(
        self,
        output_template: str,
    ):

        return {

            "quiet": True,

            "no_warnings": True,

            "outtmpl": output_template,

            "format": "bestvideo+bestaudio/best",

            "merge_output_format": "mp4",

            "noplaylist": True,

            "socket_timeout": 30,

        }

    # ==================================================
    # Cleanup Partial Downloads
    # ==================================================

    def _cleanup_partial_files(
        self,
        file_id: str,
    ) -> None:
        """
        Removes any leftover partial files or chunks matching the unique download ID.
        """
        try:
            for p in self.download_dir.glob(f"{file_id}*"):
                if p.is_file():
                    try:
                        p.unlink(missing_ok=True)
                    except Exception:
                        pass
        except Exception:
            pass

    # ==================================================
    # Download Reel
    # ==================================================

    def extract(
        self,
        url: str,
    ):

        file_id = uuid.uuid4().hex
        filename = f"{file_id}.%(ext)s"

        output_template = str(
            self.download_dir / filename
        )

        options = self.build_options(
            output_template,
        )

        try:

            with YoutubeDL(options) as ydl:

                info = ydl.extract_info(

                    url,

                    download=True,

                )

                requested = info.get(
                    "requested_downloads",
                    [],
                )

                if requested:

                    video_path = requested[0].get(
                        "filepath",
                    )

                else:

                    video_path = ydl.prepare_filename(
                        info,
                    )

        except DownloadError as e:

            self._cleanup_partial_files(file_id)
            raise RuntimeError(

                f"Instagram download failed.\n\n{e}"

            )
        except Exception:
            self._cleanup_partial_files(file_id)
            raise

        video_path = Path(
            video_path,
        )

        if not video_path.exists():

            self._cleanup_partial_files(file_id)
            raise FileNotFoundError(

                "Downloaded video not found."

            )

        print(
            "\n========== INSTAGRAM PROVIDER ==========\n"
        )

        print(
            f"Creator      : {info.get('uploader')}"
        )

        print(
            f"Title        : {info.get('title')}"
        )

        print(
            f"Duration     : {info.get('duration')} sec"
        )

        print(
            f"Resolution   : "
            f"{info.get('width')}x{info.get('height')}"
        )

        print(
            f"Likes        : {info.get('like_count')}"
        )

        print(
            f"Views        : {info.get('view_count')}"
        )

        print(
            f"Comments     : {info.get('comment_count')}"
        )

        print(
            f"Saved Video  : {video_path}"
        )

        print(
            "\n========================================\n"
        )

        metadata = {

            "title": info.get(
                "title",
                "",
            ),

            "caption": info.get(
                "description",
                "",
            ),

            "hashtags": info.get(
                "tags",
                [],
            ),

            "categories": info.get(
                "categories",
                [],
            ),

            "location": info.get(
                "location",
            ),

            "creator": info.get(
                "uploader",
            ),

            "creator_id": info.get(
                "uploader_id",
            ),

            "duration": info.get(
                "duration",
            ),

            "thumbnail": info.get(
                "thumbnail",
            ),

            "url": info.get(
                "webpage_url",
                url,
            ),

            "upload_date": info.get(
                "upload_date",
            ),

            "like_count": info.get(
                "like_count",
                0,
            ),

            "view_count": info.get(
                "view_count",
                0,
            ),

            "comment_count": info.get(
                "comment_count",
                0,
            ),

            "width": info.get(
                "width",
            ),

            "height": info.get(
                "height",
            ),

        }

        return {

            "success": True,

            "platform": "instagram",

            "provider": "yt-dlp",

            "video_path": str(
                video_path,
            ),

            "thumbnail_path": metadata.get(
                "thumbnail",
            ),

            "duration": metadata.get(
                "duration",
            ),

            "width": metadata.get(
                "width",
            ),

            "height": metadata.get(
                "height",
            ),

            "metadata": metadata,

        }