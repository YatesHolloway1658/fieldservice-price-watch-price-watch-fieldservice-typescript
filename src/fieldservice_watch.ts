import { z } from "zod";
import { InfraiGateway } from "./infrai_gateway.ts";
import { chooseCatalogAction, type WorkOrder } from "./price_decision.ts";

const requestBody = z.object({
  catalogItem: z.string().min(1),
  competitorUrl: z.string().url(),
  currentAmount: z.number().nonnegative(),
  workOrder: z.object({
    id: z.string().min(1),
    photos: z.array(z.string().url()),
    dispatchStatus: z.enum(["queued", "assigned", "complete"]),
    technicianFollowUp: z.string().nullable()
  })
});

export async function inspectCatalog(input: unknown) {
  const parsed = requestBody.parse(input);
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY before running the watcher");
  const gateway = new InfraiGateway(key);
  const page = await gateway.scrape(parsed.competitorUrl);
  const amount = Number(page.match(/(?:USD|\$)\s*(\d+(?:\.\d{1,2})?)/i)?.[1] ?? parsed.currentAmount);
  const decision = chooseCatalogAction({ vendor: parsed.competitorUrl, amount, currency: "USD", observedAt: new Date().toISOString() }, parsed.currentAmount);
  const workOrder: WorkOrder = {
    id: parsed.workOrder.id,
    catalogItem: parsed.catalogItem,
    photos: parsed.workOrder.photos,
    dispatchStatus: parsed.workOrder.dispatchStatus,
    technicianFollowUp: parsed.workOrder.technicianFollowUp
  };
  return { workOrder, decision };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await inspectCatalog({
    catalogItem: "HVAC filter replacement",
    competitorUrl: "https://example.com/service-prices",
    currentAmount: 125,
    workOrder: { id: "wo-1042", photos: ["https://example.com/photo.jpg"], dispatchStatus: "assigned", technicianFollowUp: "Confirm access window" }
  });
  console.log(JSON.stringify(result, null, 2));
}
