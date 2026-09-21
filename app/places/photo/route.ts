import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json(
      { error: "Missing photo reference name parameter." },
      { status: 400 },
    );
  }

  const engineBaseUrl =
    process.env.ENGINE_API_URL ||
    process.env.PYTHON_ENGINE_URL ||
    "http://127.0.0.1:8000";

  const targetUrl = `${engineBaseUrl.replace(/\/+$/, "")}/places/photo?name=${encodeURIComponent(name)}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: "GET",
      signal: AbortSignal.timeout(10000),
    });

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: "Could not retrieve photo from backend." },
        { status: upstreamRes.status },
      );
    }

    const contentType = upstreamRes.headers.get("content-type") || "image/jpeg";
    const imageBuffer = await upstreamRes.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to backend photo proxy." },
      { status: 502 },
    );
  }
}
