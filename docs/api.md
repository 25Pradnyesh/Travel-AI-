# API Documentation

## Base URL

```
http://localhost:8000
```

---

# GET /

Returns engine status.

### Response

```json
{
  "message": "Travel AI Engine Running 🚀"
}
```

---

# POST /analyze

Analyzes a public Instagram Reel.

### Request

```json
{
  "url": "https://www.instagram.com/reel/..."
}
```

---

### Success Response

```json
{
  "success": true,
  "metadata": {
    "platform": "instagram",
    "metadata": {
      "title": "...",
      "caption": "...",
      "thumbnail": "...",
      "creator": "...",
      "duration": 30
    }
  },
  "location_pipeline": {
    "best_guess": "Seebensee",
    "candidates": ["Seebensee", "Austria"]
  }
}
```

---

### Error Response

```json
{
  "success": false,
  "error": "Unable to extract metadata from provider."
}
```

---

## Future Endpoints

### POST /ocr

Extract text from images.

---

### POST /vision

Analyze extracted video frames.

---

### POST /maps/save

Save detected destination to Google Maps.

---

### GET /health

Health check endpoint.

---

## Version

Current Version

```
v0.1.0-alpha
```

The API is under active development and may change before the first stable release.
