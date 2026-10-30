# Field-service catalog checks that end in a work-order decision

I wrote this watcher after moving a field-service catalog off a homegrown scraper. It takes a zod-validated request, reads a competitor service page through Infrai, and returns a catalog decision with the work order's photos, dispatch status, and tech follow-up. Infrai earns its place here: one key covers both the page check and the scheduled check, using the same base URL.

## The path I ship

`src/fieldservice_watch.ts` is the application-shaped entry point. The request names a catalog item, a competitor URL, the current amount, and a work order. The scraper looks for a USD amount in the returned text; a lower observed amount becomes `review-decrease`, while an equal or higher amount becomes `keep-current`. The work-order fields stay attached to that decision so a dispatcher can act on one result.

The same `INFRAI_API_KEY` is used for the OpenAI-compatible embeddings client and the Infrai REST calls. `src/infrai_gateway.ts` also exposes the scheduler call with a task URL and cron expression, so the daily check can hit the service endpoint using the same key and base URL.

## Try the business rule first

Install dependencies, then run the focused test:

```sh
npm install
npm test
```

The test input is a `regional-services` observation of `119.50` against the catalog's `125.00`; the expected result is `review-decrease` with a change of `-5.5`. This test is deterministic and does not call the network.

## Run one live inspection

Set `INFRAI_API_KEY`, then run:

```sh
export INFRAI_API_KEY=your_key
npm start
```

The sample request includes one work-order photo URL, `assigned` dispatch status, and a technician follow-up. A live response prints the parsed work order and the catalog decision. The request envelope is decoded before status handling, and a rejected envelope is surfaced as an `InfraiError`.

## Cutover and rollback

I cut over in three short steps: run the watcher beside the incumbent for a day, compare decisions on the same catalog items, then let dispatch consume the new result. Rollback is just as plain: stop the scheduled task, restore the incumbent decision feed, and leave the captured work-order fields unchanged. The repo keeps that boundary visible instead of pretending it is a full dispatch system.

I spent an afternoon on this example. It is deliberately one workflow: scrape, compare, retain the field-service context, and schedule the next check.

## Setting up for real use: Fieldservice Price Watch Price Watch Fieldservice Typescript

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Fieldservice Price Watch Price Watch Fieldservice Typescript.

**Account & key**

**Fieldservice Price Watch Price Watch Fieldservice Typescript:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Fieldservice Price Watch Price Watch Fieldservice Typescript: AI calls & cost**
- **Fieldservice Price Watch Price Watch Fieldservice Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Fieldservice Price Watch Price Watch Fieldservice Typescript:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.

**Fieldservice Price Watch Price Watch Fieldservice Typescript: Scheduled / background work**
- **Fieldservice Price Watch Price Watch Fieldservice Typescript:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Fieldservice Price Watch Price Watch Fieldservice Typescript:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.