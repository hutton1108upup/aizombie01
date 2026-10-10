# AI Zombie Video 上线准备

当前交付是本地基础修复与上线前预览，真实生成和收款尚未接通。不能将本地检查通过当成收费上线完成。

## 虾哥现在需要准备的材料

1. **视频服务**：服务商名称、具体模型名称、模型的官方文档链接、是否支持两张人物参考图、宠物、15 秒、声音及所选清晰度/比例。准备本项目专用测试密钥和少量测试额度。密钥不发到聊天里；确定变量名称后写入本项目的 `.dev.vars`，生产密钥后续写入经过确认的 Worker。还需要确认供应商对照片的保留、删除和训练政策。
2. **支付**：选择 Stripe、Creem 或 Waffo；提供商户/店铺名称及所属账号，先确认测试环境。准备测试商品 ID、测试 API 密钥与 webhook 验签材料。当前计划包为 Single（USD 6.90 / 100 credits）、Starter（USD 9.90 / 300 credits）、Creator（USD 24.90 / 900 credits）；需要最终确认成本、有效期、失败退积分与现金退款规则。不要创建订阅商品。未接通积分包回调之前保持 `VITE_PAYMENT_PROVIDER=''`。
3. **Cloudflare 与域名**：提供账户名称、Account ID、正式域名及该域名所在 Zone 的所属账户。wrangler.jsonc 保留本地占位绑定；公开预览使用独立的 wrangler.preview.jsonc，真实服务资源另行配置。确认归属后创建项目独立 D1、私有 R2、所需队列/任务调度资源，再替换 `wrangler.jsonc` 的占位标识；不复用别的项目资源或令牌。
4. **登录和邮件**：提供自有发件域名、客服邮箱和邮件服务选择；完成发件域名验证。若需要 Google 登录，在自己的 Google Cloud 项目中准备 Web OAuth 客户端，正式域名确定后配置授权来源与 `https://正式域名/api/auth/callback/google`。验证成功后才开启 `VITE_GOOGLE_LOGIN_ENABLED`。发件信息填入 `.env.local` 的 `VITE_MAIL_FROM`、`VITE_SUPPORT_EMAIL`；后端密钥写入 `.dev.vars`。
5. **GitHub**：提供仓库 URL 并确认所有者和使用的登录账号。目标仓库是 hutton1108upup/aizombie01，已初始化本地 main 分支。远程上传需核对所用登录账号；当前结果以交付说明和仓库实际提交为准。
6. **验证素材**：准备至少两组有授权的成年人物照片；如果首版做宠物，再提供自有宠物照片。真实生成后才能制作示例、评估成功率、耗时、每次成功产出的含重试成本，并最终决定首版支持的模式。

请先回复服务名称、账号/资源名称和链接；密码、支付私钥与 API 密钥不要粘贴在聊天里。

## 已准备的本地基础

- 生成器只在浏览器内校验、缩放并预览照片，不上传照片、不模拟生成成功、不扣积分。
- 生成 API 对游客返回 401，对未经验证的用户返回 403；合法请求也会返回 503，直到真实生成闭环接通。
- D1 迁移 `0006_video_foundation.sql` 提供持久化任务、按订单唯一的积分批次及消费/返还流水，并用数据库约束防止超扣、越权和重复返还。这只是数据基础，不是已接通的积分产品。
- `/dashboard` 为 My videos，查询个人历史，支持刷新、受保护的视频访问及成品删除。没有真实生成任务时显示空状态。
- `pnpm deploy` 先运行 `launch:check`。当前检查按预期阻止发布；新增密钥或改一个开关不能绕过尚未实现的业务闭环。

## 本地复验

在 PowerShell 中依次执行：

```powershell
Set-Location '.\aizombie01'
pnpm.cmd check
pnpm.cmd typecheck
pnpm.cmd build
pnpm.cmd exec playwright test tests/e2e/specs/aizombie.spec.ts
pnpm.cmd e2e:production
pnpm.cmd launch:check
```

前五步应成功；最后一步当前应显示 `BLOCKED`，不进行任何远程操作。发生检查失败时停在该步，先修复，不执行部署。

E2E 只重建 `.wrangler/e2e-state`，使用本地 D1 和测试账号。真实视频/支付测试不在上述检查内。

## 尚未完成的上线闭环

供应商确定后继续实现私有上传及真实图片字节校验、任务队列、供应商提交/回调/重试、原子积分预留、签名支付回调入账、照片定时清理及失败恢复。之后验证真实下载、账号删除的对象清理和用户退款场景。正式账号与资源确认后才能进行远程写入和上线。
