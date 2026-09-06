import { NextRequest, NextResponse } from "next/server";
import type { AnalysisResponse, AnalyzeRequestBody } from "@/types/analysis";

const INSTAGRAM_REEL_REGEX =
  /^https?:\/\/(?:www\.)?instagram\.com\/(?:reel|reels)\/([A-Za-z0-9_-]+)/i;

export async function POST(request: NextRequest) {
  try {
    let body: AnalyzeRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON request body.",
        },
        { status: 400 },
      );
    }

    const reelUrl = (body.url || body.reel_url || "").trim();

    if (!reelUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Paste an Instagram Reel URL first.",
        },
        { status: 400 },
      );
    }

    if (!INSTAGRAM_REEL_REGEX.test(reelUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: "Enter a valid Instagram Reel URL.",
        },
        { status: 400 },
      );
    }

    const engineBaseUrl =
      process.env.ENGINE_API_URL ||
      process.env.PYTHON_ENGINE_URL ||
      "http://127.0.0.1:8000";

    const targetUrl = `${engineBaseUrl.replace(/\/+$/, "")}/analyze`;

    let engineResponse: Response;
    try {
      engineResponse = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ reel_url: reelUrl }),
        signal: AbortSignal.timeout(120000), // 120s timeout for video processing & verification
      });
    } catch (fetchError: unknown) {
      const err = fetchError as { name?: string; message?: string; cause?: { code?: string } };

      if (err?.name === "TimeoutError" || err?.name === "AbortError") {
        console.error("[ANALYZE PROXY] Engine request timed out after 120s");
        return NextResponse.json(
          {
            success: false,
            error: "The analysis took too long. Please try again.",
          },
          { status: 504 },
        );
      }

      console.error("[ANALYZE PROXY] Could not reach engine:", err?.message || err);
      return NextResponse.json(
        {
          success: false,
          error: "Travel AI couldn't reach the analysis engine. Try again.",
        },
        { status: 503 },
      );
    }

    if (!engineResponse.ok) {
      const errorText = await engineResponse.text().catch(() => "");
      console.error(
        `[ANALYZE PROXY] Engine returned status ${engineResponse.status}:`,
        errorText,
      );

      return NextResponse.json(
        {
          success: false,
          error: "We couldn't identify this Reel. Try another public Reel.",
        },
        { status: engineResponse.status >= 500 ? 502 : engineResponse.status },
      );
    }

    const data: AnalysisResponse = await engineResponse.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("[ANALYZE PROXY] Unhandled error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      },
      { status: 500 },
    );
  }
}
