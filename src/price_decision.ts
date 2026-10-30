export type CompetitorQuote = {
  vendor: string;
  amount: number;
  currency: string;
  observedAt: string;
};

export type WorkOrder = {
  id: string;
  catalogItem: string;
  photos: string[];
  dispatchStatus: "queued" | "assigned" | "complete";
  technicianFollowUp: string | null;
};

export function chooseCatalogAction(quote: CompetitorQuote, currentAmount: number) {
  const change = Number((quote.amount - currentAmount).toFixed(2));
  return {
    vendor: quote.vendor,
    currentAmount,
    observedAmount: quote.amount,
    change,
    action: quote.amount < currentAmount ? "review-decrease" : "keep-current"
  } as const;
}
