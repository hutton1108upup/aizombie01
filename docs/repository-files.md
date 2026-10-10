# 仓库文件分类

## 可以提交

- `src/`：应用源码、路由、数据库迁移与类型。
- `public/`：本项目运行所需的图标、字体和图片。
- `content/`、`docs/`：产品内容、模块说明与验收准备。
- `tests/`、`scripts/`：验证和项目工具；脚本不包含真实密钥。
- `project.inlang/settings.json` 和 `messages/*.json`：语言配置与原始文案。
- 根目录包清单、锁文件、框架/检查配置、Wrangler 配置、项目规范及许可证。
- `.github/workflows/ci.yml`：只执行安装、检查和构建，不自动部署。
- `.env.example`、`.env.production.example`：只包含公开参数和空凭据位的模板。

## 仅保留本地

- `.env`、`.env.*`（上述 example 除外）、`.dev.vars*` 和证书/私钥：运行凭据。
- `node_modules/`、`dist/`、`.wrangler/`、`.tanstack/`、`.content-collections/`、Paraglide 生成目录：依赖、构建产物和本地运行状态。
- `outputs/`：恢复副本、截图、检查记录与文件清单。
- `自用/`：私人素材和参考视频，不发布到公开仓库。
- `.workbuddy/`、`.vscode/`、`.cta.json`：本机工具、抓取缓存和脚手架元信息。
- `test-results/`、`playwright-report/`、日志：测试运行结果。
- 上游 issue 模板和上游 `deploy.yml`：未作为本项目的自动发布入口提交。
- `project.inlang/cache/`、`.meta.json`：语言工具生成的缓存和项目实例标识。

这些文件采用忽略规则与显式提交清单双重排除；不会为了上传而删除本地凭据、素材或恢复副本。

## 发布边界

`build:preview` 构建无需 D1/R2/KV 和 AI/支付凭据的公开预览，关闭账户、上传、生成、支付、webhook 及后台接口。`deploy:preview` 必须先在配置中固定经过确认的 Cloudflare Account ID。

`deploy` 仍经过 `launch:check`，真实付费闭环未接通时拒绝发布。不要将预览域名可访问当成付费生成已上线。
