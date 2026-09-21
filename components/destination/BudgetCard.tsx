"use client";

import { Wallet, Clock } from "lucide-react";
import type { TravelIntelligence } from "@/types/analysis";

interface BudgetCardProps {
  travelIntelligence?: TravelIntelligence | Record<string, unknown> | null;
}

export default function BudgetCard({
  travelIntelligence,
}: BudgetCardProps) {
  if (!travelIntelligence) return null;

  const ti = travelIntelligence as TravelIntelligence;

  const budgetLevel = ti.budget_level;
  const dailyBudget = ti.estimated_daily_budget;
  const currency = ti.currency || "USD";
  const tripDays = ti.recommended_trip_days;

  const hasBudgetData = Boolean(budgetLevel) || Boolean(dailyBudget);

  if (!hasBudgetData) {
    return null;
  }

  // Format currency symbol
  const currencySymbol =
    currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency === "JPY" ? "¥" : "$";

  const rawDaily = dailyBudget != null ? String(dailyBudget).trim() : "";
  const formattedDaily = rawDaily
    ? rawDaily.startsWith("€") ||
      rawDaily.startsWith("$") ||
      rawDaily.startsWith("£") ||
      rawDaily.startsWith("¥")
      ? rawDaily
      : `${currencySymbol}${rawDaily}`
    : null;

  return (
    <div
      className="rounded-xl p-5 shadow-xs"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} aria-hidden="true" />
          <h3 className="text-metadata">ESTIMATED EXPENSES</h3>
        </div>
        {budgetLevel && (
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{
              backgroundColor: "var(--color-bg-primary)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
            }}
          >
            {budgetLevel} Tier
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-3">
        {formattedDaily && (
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
              style={{ color: "var(--color-text-primary)" }}
            >
              {formattedDaily}
            </span>
            <span
              className="text-xs font-mono"
              style={{ color: "var(--color-text-muted)" }}
            >
              / day avg ({currency})
            </span>
          </div>
        )}
      </div>

      {tripDays && (
        <div
          className="mt-3 flex items-center gap-1.5 text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Recommended duration: {tripDays}</span>
        </div>
      )}
    </div>
  );
}
