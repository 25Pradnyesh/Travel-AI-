from .instagram_ytdlp import InstagramYtDlpProvider


class ProviderManager:

    def __init__(self):
        self.provider = InstagramYtDlpProvider()

    def extract(self, url: str):
        return self.provider.extract(url)