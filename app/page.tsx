"use client";

import { useState } from "react";

export default function Home() {
  const [response, setResponse] = useState("");

  async function handleAnalyze() {
    const res = await fetch("/api/analyze", {
      method: "POST",
    });

    const data = await res.json();

    setResponse(JSON.stringify(data, null, 2));
  }

  return (
    <main className="min-h-screen flex flex-col justify-center items-center gap-6">
      <h1 className="text-5xl font-bold">Travel AI 🚀</h1>

      <button
        onClick={handleAnalyze}
        className="bg-black text-white px-6 py-3 rounded-xl"
      >
        Analyze
      </button>

      <pre className="bg-gray-100 p-4 rounded-xl">{response}</pre>
    </main>
  );
}
