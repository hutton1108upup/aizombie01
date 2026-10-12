# Production analytics

Public IDs are in `analytics.config.json`; they are not API credentials. `build:preview` forwards them to Vite; environment overrides are supported. Payment and generation preview guards remain enabled.

- GA4: `G-6WGLE9Y3W0`, Web stream `16109567750`, https://aizombietrend.video.
- Clarity: `ywe0xiieko`, https://clarity.microsoft.com/projects/view/ywe0xiieko.
- GSC: domain property `aizombietrend.video`, verified separately with DNS TXT. No tracking script is needed.

GA4 enhanced measurement must remain disabled: TanStack Router page views are sent explicitly, and `send_page_view` is false to prevent duplicate initial views. Custom page URLs omit query strings and fragments; referrers are reduced to their origin. Local/platform hosts and routes outside the public-page allowlist do not start analytics. Clarity also does not start on URLs with query parameters. The photo form is explicitly masked. The current preview cannot enter private/account routes; reassess recording boundaries before opening accounts.

Verify one GA4 page view on initial load and one on an internal navigation, Clarity tag loading, provider receipt, GSC ownership and sitemap processing separately. A build alone does not prove provider receipt.
