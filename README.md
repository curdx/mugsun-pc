# mugsun-pc

Mugsun 平台 PC 管理端 —— Vue 3 + Vite + TypeScript + Element Plus。

## 特性

- 后端菜单驱动：角色授权/隐藏菜单一刷新生效，侧边栏由服务端菜单树渲染
- 字典运行时（useDict 并发去重 + 标签着色）、按钮级权限门控（v-perm / hasPerm）
- 组合式 CRUD 封装（useTable/useCrud）、表格自定义列持久化
- WebSocket 实时消息（铃铛角标、强制下线）、SM2 国密登录传输
- Playwright 真实浏览器端到端测试套件（登录验证码经 Redis 取码、全页面巡访、权限/租户/工作流矩阵）

## 环境要求

- Node.js >= 20.19
- pnpm >= 8.8

## 开发

```bash
pnpm install
pnpm dev        # 开发服务器（默认代理 /api 到 localhost:8080）
```

## 构建与生产冒烟

```bash
pnpm build      # vue-tsc 类型检查 + 生产构建
pnpm exec vite preview --port 4173 --mode development   # 预览产物（代理到本地后端）
```

## 端到端测试

```bash
# 前置：后端(8080)与 dev server(3007)已启动，mugsun-pg / blade-redis / powerjob-server 容器在跑
pnpm test:e2e                                   # 全量（巡访 + 功能矩阵）
E2E_BASE_URL=http://localhost:4173 pnpm exec playwright test e2e/prod-smoke.spec.ts   # 生产构建冒烟
```

## 许可

前端 UI 基座衍生自 [art-design-pro](https://github.com/Daymychen/art-design-pro)（MIT License），详见 `LICENSE` 与 `NOTICE`。
