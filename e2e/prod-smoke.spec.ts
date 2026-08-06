import { test, expect } from '@playwright/test'
import { login } from './fixtures/auth'

/**
 * 生产构建冒烟（dist + vite preview + 代理真后端）。
 * 前置：`pnpm build` 且 `pnpm exec vite preview --port 4173 --mode development` 已启动；
 * 预览未启动时自动跳过（不影响默认 E2E 套件）。
 * 运行：E2E_BASE_URL=http://localhost:4173 pnpm exec playwright test e2e/prod-smoke.spec.ts
 */
let previewUp = false

test.beforeAll(async ({ request }) => {
  // 仅在明确指向预览实例时启用（默认套件跑 dev，本用例断言生产行为，须防误跑）
  if (!(process.env.E2E_BASE_URL || '').includes('4173')) {
    return
  }
  try {
    const resp = await request.get(process.env.E2E_BASE_URL as string, { timeout: 3_000 })
    previewUp = resp.ok()
  } catch {
    previewUp = false
  }
})

test('生产构建：登录→工作台渲染→无 mock 社交按钮', async ({ page }) => {
  test.skip(
    !previewUp,
    'vite preview 未启动（先 pnpm build && pnpm exec vite preview --port 4173 --mode development）'
  )

  const consoleErrors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text())
  })
  page.on('pageerror', (e) => consoleErrors.push(String(e)))

  await page.goto('/#/auth/login')
  // 生产构建绝不渲染 mock 社交登录（DEV 门控）
  await expect(page.getByRole('button', { name: '模拟第三方登录' })).toHaveCount(0)
  await login(page)
  await expect(page).toHaveURL(/#\/dashboard/)
  await expect(page.getByText('用户数').first()).toBeVisible({ timeout: 15_000 })
  // 用户页验证路由与数据链路
  await page.goto('/#/system/user')
  await expect(page.getByRole('row').nth(1)).toBeVisible({ timeout: 10_000 })
  const fatal = consoleErrors.filter((t) => !/Failed to load resource/.test(t))
  expect(fatal, '生产构建无 console 异常').toEqual([])
})
