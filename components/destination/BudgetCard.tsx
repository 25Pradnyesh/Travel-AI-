"use client";

import { Wallet, DollarSign } from "lucide-react";
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
  const currency = ti.currency;
  const tripDays = ti.recommended_trip_days;

  const hasBudgetData = Boolean(budgetLevel) || Boolean(dailyBudget);

  if (!hasBudgetData) {
    return null;
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} aria-hidden="true" />
        <h3 className="text-metadata">TRIP BUDGET</h3>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-4">
        {budgetLevel && (
          <span
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ color: "var(--color-text-primary)" }}
          >
            {budgetLevel}
          </span>
        )}

        {dailyBudget && (
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-lg font-semibold"
              style={{ color: "var(--color-success)" }}
            >
              {dailyBudget}
            </span>
            <span
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              / day {currency ? `(${currency})` : ""}
            </span>
          </div>
        )}
      </div>

      {tripDays && (
        <div
          className="mt-3 flex items-center gap-1.5 text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          <DollarSign className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Estimated based on {tripDays} recommended stay</span>
        </div>
      )}
    </div>
  );
}
