import { NextResponse } from "next/server";

export async function GET() {
  const engineBaseUrl =
    process.env.ENGINE_API_URL ||
    process.env.PYTHON_ENGINE_URL ||
    "http://127.0.0.1:8000";

  const targetUrl = `${engineBaseUrl.replace(/\/+$/, "")}/health`;

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout for health check
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          status: "degraded",
          service: "Travel AI Next.js Proxy",
          engine_status: response.status,
        },
        { status: response.status >= 500 ? 502 : response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string };
    const isTimeout = err?.name === "TimeoutError" || err?.name === "AbortError";

    return NextResponse.json(
      {
        status: "unavailable",
        service: "Travel AI Next.js Proxy",
        error: isTimeout
          ? "Health check timed out."
          : "Travel AI is temporarily unavailable.",
      },
      { status: 503 },
    );
  }
}
