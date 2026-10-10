# AI Zombie Video — Pre-launch Preview

The local project currently provides private browser photo previews and an authenticated video/accounting foundation. Real video generation, private photo uploads and credit-pack checkout are not connected. Generation and purchase controls remain closed.

Public preview: https://aizombietrend.video. Authentication, uploads, generation and checkout remain closed in this deployment.

## Local checks

```powershell
Set-Location '.\aizombie01'
pnpm.cmd build
pnpm.cmd check
pnpm.cmd typecheck
pnpm.cmd e2e
pnpm.cmd e2e:production
```

For repository file classification, see [repository files](docs/repository-files.md). `pnpm build:preview` builds the public pre-launch site for https://aizombietrend.video with all stateful interfaces closed; `pnpm deploy:preview` additionally requires a confirmed, pinned Cloudflare account.

For production preparation, verified accounts, credentials and remaining work, see [launch preparation](docs/launch-preparation.md). `pnpm deploy` first runs `launch:check` and currently refuses deployment. E2E rebuilds only the isolated `.wrangler/e2e-state` directory using local D1.

The license and original template attribution below are retained.

---

# TanStarter

Ship Faster with TanStack, Cost Less with Cloudflare

TanStarter is the complete TanStack Start boilerplate for building profitable SaaS, packed with AI, auth, payments, storage, email, newsletter, blog, dashboard, i18n, SEO and more, fully deployed on Cloudflare Workers.

## Author

This project is created by [Fox](https://x.com/indie_maker_fox), the founder of [TanStarter](https://tanstarter.dev), [MkImage](https://mkimage.ai), [MkSaaS](https://mksaas.com) and [Mkdirs](https://mkdirs.com).

## Documentation

The documentation is available on the [website](https://docs.tanstarter.dev). It includes guides, tutorials, and detailed explanations of the code. I designed it to be as beginner-friendly as possible, so you can start making money from day one.

If you found anything that could be improved, please let me know.

## Links

- 🔥 website: [tanstarter.dev](https://tanstarter.dev)
- 🌐 demo: [demo.tanstarter.dev](https://demo.tanstarter.dev)
- 📚 documentation: [docs.tanstarter.dev](https://docs.tanstarter.dev)
- 📹 video tutorials: [youtube@TanStarter](https://www.youtube.com/@TanStarter)

## Notice

- If you have any questions, please contact me at [support@tanstarter.dev](mailto:support@tanstarter.dev), or join our [discord community](https://mksaas.link/discord) and ask for help there. If you want to receive notifications whenever code changes, please click `Watch` button in the top right.

- When submitting any content to the  issues of the repository, please use **English** as the main Language, so that everyone can read it and help you, thank you for your supports.

## License

For any details on the license, please refer to the [License](LICENSE) file.
