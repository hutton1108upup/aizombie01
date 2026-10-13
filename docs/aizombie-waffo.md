# AI Zombie Waffo Test integration

## Account and resources

Confirmed merchant login: `duckweed1014@gmail.com`.
Merchant: `MER_0Ca1DBngIQV3s35pRE1wcg`.
Independent store: `STO_1gfx0lwWHQDjgobmY2EziC` (AI Zombie Video).
Website: `https://aizombietrend.video`.
Waffo domain ownership verification passed via the dedicated
`_waffo-challenge` TXT record in the confirmed Cloudflare zone.

| Pack | USD | Sandbox credits | Test product |
| --- | --- | --- | --- |
| Single | 6.90 | 100 | PROD_10JcI98N2jEbfDyypVRfvZ |
| Starter | 9.90 | 300 | PROD_4GW2DUS6MxYg1NJ8wUiH8Q |
| Creator | 24.90 | 900 | PROD_26FJ6F9jgsj0Gduykf1mj2 |

These products were created only in Waffo Test mode. Do not use the dashboard's
Publish action, which copies a Test product to Production.

## Implementation

- Authenticated, verified users create a checkout at `POST /api/aizombie/payments`.
  Only `packId` and a UUID `requestId` are accepted. Price, product, credits,
  buyer identity and return URL are resolved on the server.
- Owner-only history and sandbox balance: `GET /api/aizombie/payments`.
- Protected, noindex test UI: `/dashboard/payments`. No public purchase buttons
  are enabled. A browser redirect never grants credits.
- Dedicated signed receiver: `POST /api/aizombie/payments/webhook`.
  Subscribe only to `order.completed`, `refund.succeeded`, `refund.failed`.
- SDK checkout and signature verification explicitly use `environment: 'test'`.
  The receiver rejects Production, another store/product/buyer, wrong USD list
  price or any order without a matching local checkout. Compare the modern
  `listPrice.subtotal` field; do not substitute deprecated `amount` or tax totals.
- Migration `0007_waffo_test_payments.sql` stores sandbox orders separately from
  `payment` and `video_credit_grants`. Duplicate delivery cannot grant twice.
  A successful refund freezes the entire sandbox grant (including partial
  refunds); a late completion cannot restore it. This is a Test policy, not
  a production refund policy.
- Raw callback bodies are limited to 64 KB. Invalid signatures return 400;
  failed persistence or unmatched signed orders return retryable 500. Disabled
  runtime returns 503. Hosted URLs/JWT fragments and raw event payloads are not logged.

## Local setup after a project-owned key exists

1. In Waffo **API 与开发**, select **测试模式**. Create a new key for AI Zombie,
   retaining its private key locally. Do not reuse a sibling site's key and do
   not paste the private key into chat.
2. Append the `AIZOMBIE_WAFFO_TEST_*` example block from `.env.example` to the
   existing ignored `.dev.vars`. Preserve the file's existing auth settings.
   Set the private key as one quoted line with escaped `\n` newlines and change
   `AIZOMBIE_WAFFO_TEST_ENABLED` to `true`.
3. In PowerShell at the repository root, run the isolated local authenticated
   harness: `$env:PORT='4253'; $env:PLAYWRIGHT_BASE_URL='http://localhost:4253'; pnpm.cmd exec tsx scripts/serve-e2e.ts`.
   It applies migrations to local D1 only. The e2e account helpers work only
   in local dev MODE=e2e and must never be exposed through a public tunnel.
4. Use a local verified test account and open `/dashboard/payments`. The three
   buttons must produce a Test checkout; returning alone leaves the order pending.
5. A publicly reachable **dedicated Test deployment** with D1 and real auth must
   be confirmed and configured before registering an actual Waffo receiver.
   Do not register `aizombietrend.video` as a working callback yet: its public
   preview deliberately returns 503 for all payment requests.
6. Complete a real Waffo Test purchase, prove its signed callback changes one
   order to paid, replay it, and test a refund. Provider-delivered end-to-end
   verification remains pending the private key and Test deployment.

## Verification and launch boundaries

Unit tests use SQLite and the installed SDK; checkout responses in unit/browser
tests are stubbed. They prove local validation, durable deduplication and
refund ordering, not Waffo's hosted payment completion.

Public preview deployments remain payment-disabled and require no key or D1.
`pnpm deploy` remains blocked until real video generation, private uploads,
queue, paid accounting, fulfillment and production merchant approval are verified.
The existing template subscription/lifetime provider is not used for these packs.

References: [Waffo SDK guide](https://docs.waffo.ai/zh/integrate/skill),
[current webhook fields](https://docs.waffo.ai/zh/api-reference/webhooks).
