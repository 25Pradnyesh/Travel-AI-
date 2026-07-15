import whisper


class SpeechService:

    def __init__(self):

        print("Loading Whisper model...")

        self.model = whisper.load_model("small")

        print("✅ Whisper model loaded.")

    def extract(self, video_path: str):

        print(f"🎤 Transcribing: {video_path}")

        result = self.model.transcribe(
            video_path,
            fp16=False,
            verbose=False,
        )

        return result["text"].strip()