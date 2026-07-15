import whisper


class SpeechService:

    def __init__(self):

        self.model = whisper.load_model("base")

    def extract(self, video_path: str):

        result = self.model.transcribe(video_path)

        return result["text"]