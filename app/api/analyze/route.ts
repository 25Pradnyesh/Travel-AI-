import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = await fetch(process.env.PYTHON_ENGINE_URL!);

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Python Engine Offline",
      },
      {
        status: 500,
      },
    );
  }
}
