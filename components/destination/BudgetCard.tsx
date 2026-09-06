"use client";

import { DollarSign, Wallet } from "lucide-react";
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-emerald-400" aria-hidden="true" />
        <h3 className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
          Trip Budget
        </h3>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-4">
        {budgetLevel && (
          <span className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            {budgetLevel}
          </span>
        )}

        {dailyBudget && (
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-emerald-400">
              {dailyBudget}
            </span>
            <span className="text-xs text-zinc-400">
              / day {currency ? `(${currency})` : ""}
            </span>
          </div>
        )}
      </div>

      {tripDays && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
          <DollarSign className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
          <span>Estimated based on {tripDays} recommended stay</span>
        </div>
      )}
    </div>
  );
}
