from abc import ABC, abstractmethod


class BaseProvider(ABC):

    @abstractmethod
    def extract(self, url: str):
        pass