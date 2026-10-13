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

On 2026-10-13, the dedicated **AI Zombie Test 2026-10-13** key was created with
platform key retention disabled. Its RSA private key is stored only in ignored
local files. The local `.dev.vars` keeps `AIZOMBIE_WAFFO_TEST_ENABLED=false` by
default. No key was uploaded to Cloudflare or committed to GitHub.

All three real SDK Test checkout calls succeeded and repeated requests reused
the saved session. The Single hosted page visibly showed Test mode, AI Zombie
Video and USD 6.90. The initial URL-only check did not complete a purchase; the
later dedicated receiver verification below completed and refunded an official
Test payment.
The actual vendor URL format is
`https://pancake.waffo.ai/store/{slug}/checkout/cs_*`; client and server now share
one check restricting HTTPS, exact host, normal port and checkout path.

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
5. A publicly reachable **dedicated Test receiver** with isolated D1 must
   be confirmed and configured before registering an actual Waffo receiver.
   Do not register `aizombietrend.video` as a working callback yet: its public
   preview deliberately returns 503 for all payment requests.
6. Complete a real Waffo Test purchase, prove its signed callback changes one
   order to paid, replay it, and test a refund. Provider-delivered end-to-end
   verification is recorded below for the deployed dedicated Test receiver.

## Deployed dedicated Test receiver and provider evidence (2026-10-13)

- Confirmed Cloudflare account: `Duckweed1014@gmail.com`, account ID
  `7fd7ed1128ca3d125feaa279f4d4c547`.
- Worker and isolated D1: `aizombie-waffo-test`.
- D1 ID: `758e1a77-3f37-4c59-863e-f7343bbfd8ec`, bound by
  `wrangler.waffo-test.jsonc`. Its schema contains only synthetic Test users,
  the checkout table, its index and permanent-refund guard trigger.
- Initial deployed version: `2050d988-aaa5-4e0b-a8b1-f5bc262429da`.
- Health: `https://aizombie-waffo-test.duckweed1014.workers.dev/health`.
- Registered callback:
  `https://aizombie-waffo-test.duckweed1014.workers.dev/api/aizombie/payments/webhook`.
- Waffo Test webhook ID: `0c6a41a3-fab5-4aa9-8712-b6b243d11320`, subscribed
  to `order.completed`, `refund.succeeded` and `refund.failed` for this store.
  The store has no Production webhook.
- Entry: `src/aizombie/waffo-test-receiver.ts`. Only health and the signed Test
  callback are exposed. No login, e2e helper, checkout creation or public
  balance/history endpoint; no merchant private key or app login secret.
- New project-only Merchant Test private key is retained in ignored local files.
  It was used to create server-bound checkout sessions, never uploaded to this
  receiver, committed, or reused from another project.

Actual provider workflow used Waffo's official Test cashier and its Visa success
fixture. No real charge occurred. One server-created pending Single checkout
was seeded into isolated D1 before payment; paid/refunded status was changed
only by real signed provider callbacks, never by a manual SQL status update.

| Provider action | Verified isolated D1 result |
| --- | --- |
| Before payment | pending, 0 active Test credits |
| Test USD 6.90 payment and actual `order.completed` | paid, 100 active Test credits |
| Re-send the same completion in Waffo | 1 order, still 100 active Test credits |
| Official Test full refund and actual `refund.succeeded` | refunded, 0 active Test credits |
| Re-send the old completion after refund | refunded, still 0 active Test credits |

Reference checkout: `2600178d-f837-4b3d-b7da-4777e1c5bba8`.
Provider order: `ORD_4V9BQH0RruqprKl3eusoub`; payment:
`PAY_4IkuX2jPIsjT592YNvOesL`; refund: `REF_1psrVkWtaYkPNyrB6HoiRc`.
Normal HTTPS health returned 200; missing and forged callback signatures returned
400. Local screenshots/logs under ignored `outputs/` retain deployment, hosted
Test success, duplicate, and refund evidence. Token-bearing checkout URLs and
private keys stay in ignored `outputs/private/` and must not be shared.

Cloudflare Builds is linked to this same GitHub repository's `main`, with
`pnpm exec wrangler deploy --dry-run --config wrangler.waffo-test.jsonc` as build
and `pnpm exec wrangler deploy --config wrangler.waffo-test.jsonc` as deploy.
It uses the existing, already authorized AI Zombie build token. The root domain
remains a public preview with commerce and generation disabled.

## Verification and launch boundaries

Unit tests use SQLite and the installed SDK; checkout responses in unit/browser
tests are stubbed. They prove local validation, durable deduplication and
refund ordering. The separate live Test workflow above proves provider payment,
signed delivery, duplicate handling and refund revocation for one Single order.
It does not prove production charges, real authentication or video fulfillment.

Public preview deployments remain payment-disabled and require no key or D1.
`pnpm deploy` remains blocked until real video generation, private uploads,
queue, paid accounting, fulfillment and production merchant approval are verified.
The existing template subscription/lifetime provider is not used for these packs.

References: [Waffo SDK guide](https://docs.waffo.ai/zh/integrate/skill),
[current webhook fields](https://docs.waffo.ai/zh/api-reference/webhooks).
