class MetadataService:

    def build_text(self, metadata: dict) -> str:
        parts = []

        title = metadata.get("title")
        if title:
            parts.append(title)

        caption = metadata.get("caption")
        if caption:
            parts.append(caption)

        tags = metadata.get("tags") or []
        if tags:
            parts.append(" ".join(tags))

        return "\n".join(parts)