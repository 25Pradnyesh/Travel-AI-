"use client";

import { CheckCircle2, ShieldCheck, Sparkles, Navigation } from "lucide-react";

interface TravelTipsProps {
  tips?: string[] | Record<string, unknown> | null;
}

export default function TravelTips({ tips }: TravelTipsProps) {
  if (!tips) return null;

  // Normalize tips from either string[] or structured dict
  const tipList: { text: string; type: "general" | "safety" | "local" | "transport" }[] = [];

  if (Array.isArray(tips)) {
    tips.forEach((t) => {
      if (typeof t === "string" && t.trim()) {
        tipList.push({ text: t.trim(), type: "general" });
      }
    });
  } else if (typeof tips === "object") {
    const rawTips = tips as Record<string, unknown>;

    if (Array.isArray(rawTips.travel_tips)) {
      rawTips.travel_tips.forEach((t) => {
        if (typeof t === "string" && t.trim()) tipList.push({ text: t.trim(), type: "general" });
      });
    }

    if (Array.isArray(rawTips.local_tips)) {
      rawTips.local_tips.forEach((t) => {
        if (typeof t === "string" && t.trim()) tipList.push({ text: t.trim(), type: "local" });
      });
    }

    if (Array.isArray(rawTips.safety_tips)) {
      rawTips.safety_tips.forEach((t) => {
        if (typeof t === "string" && t.trim()) tipList.push({ text: t.trim(), type: "safety" });
      });
    }

    if (typeof rawTips.recommended_transport === "string" && rawTips.recommended_transport.trim()) {
      tipList.push({ text: `Transport: ${rawTips.recommended_transport.trim()}`, type: "transport" });
    }
  }

  if (tipList.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-metadata">LOCAL TRAVEL ADVICE</h3>
        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
          {tipList.length} TIPS
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tipList.map((item, index) => {
          const Icon =
            item.type === "safety"
              ? ShieldCheck
              : item.type === "local"
              ? Sparkles
              : item.type === "transport"
              ? Navigation
              : CheckCircle2;

          return (
            <div
              key={index}
              className="flex items-start gap-3 rounded-xl p-4 transition-all hover:bg-neutral-50"
              style={{
                backgroundColor: "var(--color-bg-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <Icon
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{
                  color:
                    item.type === "safety"
                      ? "var(--color-warning)"
                      : item.type === "transport"
                      ? "var(--color-text-primary)"
                      : "var(--color-success)",
                }}
                aria-hidden="true"
              />
              <p
                className="text-xs sm:text-sm leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {item.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
