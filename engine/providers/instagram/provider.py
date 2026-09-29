import re
import time
import uuid
from pathlib import Path

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

            "format": "best[height<=720]/bestvideo[height<=720]+bestaudio/best[height<=1080]/best",

            "merge_output_format": "mp4",

            "noplaylist": True,

            "socket_timeout": 30,

            "retries": 3,

            "fragment_retries": 3,

            "extractor_retries": 3,

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
    # Metadata Extraction Without Video (Photo Posts)
    # ==================================================

    def _extract_metadata_without_video(
        self,
        url: str,
    ) -> dict | None:
        """
        Extracts metadata for Instagram posts that do not contain a video stream
        (e.g., static photo carousels or image-only posts).
        """
        captured = {}
        try:
            from yt_dlp.extractor.instagram import InstagramIE

            orig_extract_product = InstagramIE._extract_product
            orig_raise_no_formats = InstagramIE.raise_no_formats

            def capturing_extract_product(ie_self, *args, **kwargs):
                res = orig_extract_product(ie_self, *args, **kwargs)
                captured["info"] = res
                return res

            def suppressing_raise_no_formats(ie_self, msg, expected=True):
                if "no video" in str(msg).lower():
                    return
                return orig_raise_no_formats(ie_self, msg, expected=expected)

            InstagramIE._extract_product = capturing_extract_product
            InstagramIE.raise_no_formats = suppressing_raise_no_formats

            try:
                with YoutubeDL({"quiet": True, "no_warnings": True, "socket_timeout": 20}) as ydl:
                    try:
                        return ydl.extract_info(url, download=False)
                    except Exception:
                        return captured.get("info")
            finally:
                InstagramIE._extract_product = orig_extract_product
                InstagramIE.raise_no_formats = orig_raise_no_formats
        except Exception:
            return captured.get("info")

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

        download_attempts = 2
        for attempt in range(download_attempts):
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
                    break
            except DownloadError as e:
                err_msg = str(e).lower()
                if "no video" in err_msg or "no video formats" in err_msg:
                    info = self._extract_metadata_without_video(url)
                    if info:
                        video_path = None
                        break
                    else:
                        self._cleanup_partial_files(file_id)
                        raise RuntimeError(f"Instagram download failed.\n\n{e}")
                elif attempt < download_attempts - 1:
                    time.sleep(1.5)
                    continue
                else:
                    self._cleanup_partial_files(file_id)
                    raise RuntimeError(
                        f"Instagram download failed.\n\n{e}"
                    )
            except Exception:
                self._cleanup_partial_files(file_id)
                raise

        if video_path is not None:
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
            ) if video_path else None,

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