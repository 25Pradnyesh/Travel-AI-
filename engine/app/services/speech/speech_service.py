import whisper

print("Loading Whisper model...")
WHISPER_MODEL = whisper.load_model("small")
print("✅ Whisper model loaded.")


class SpeechService:

    def __init__(self):
        self.model = WHISPER_MODEL

    def extract(self, video_path: str):

        print(f"🎤 Transcribing: {video_path}")

        result = self.model.transcribe(
            video_path,
            fp16=False,
            verbose=False,
        )

        return result["text"].strip()