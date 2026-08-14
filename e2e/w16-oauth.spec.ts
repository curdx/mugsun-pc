import type { Page } from '@playwright/test'
import { test, expect } from '@playwright/test'
import { login } from './fixtures/auth'

/**
 * W16 开放平台·OAuth 客户端：新建客户端凭证模式 → 一次性密钥弹窗 → 列表可见 → 删除。
 */

test.describe.configure({ mode: 'serial' })

let page: Page
const clientName = `E2E客户端${Date.now() % 100000}`

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  await login(page)
})

test.afterAll(async () => {
  await page?.close()
})

test('W16-1 新建客户端并显示一次性密钥', async () => {
  await page.goto('/#/open-platform/oauth-client')
  const root = page.locator('.oauth-client-page')
  await expect(root.getByRole('button', { name: '新建客户端' })).toBeVisible({ timeout: 10_000 })

  await root.getByRole('button', { name: '新建客户端' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByPlaceholder('请输入名称')).toBeVisible()
  await dialog.getByPlaceholder('请输入名称').fill(clientName)
  // 默认已勾选客户端凭证
  await expect(dialog.getByText('客户端凭证')).toBeVisible()

  const saveResp = page.waitForResponse(
    (r) => r.url().includes('/system/oauth-client') && r.request().method() === 'POST'
  )
  await dialog.getByRole('button', { name: '保存' }).click()
  expect((await saveResp).status()).toBe(200)

  // 一次性密钥弹窗
  const secretDialog = page.getByRole('dialog').filter({ hasText: '客户端密钥' })
  await expect(secretDialog).toBeVisible({ timeout: 10_000 })
  await expect(secretDialog.getByText(/仅显示一次|妥善保存/)).toBeVisible()
  await secretDialog.getByRole('button', { name: '我已保存' }).click()
  await expect(secretDialog).toBeHidden({ timeout: 5_000 })

  await expect(root.getByRole('row', { name: new RegExp(clientName) }).first()).toBeVisible({
    timeout: 10_000
  })
})

test('W16-2 调试页可打开', async () => {
  await page.goto('/#/open-platform/oauth-debug')
  await expect(page.locator('.oauth-debug-page')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByPlaceholder('mc_xxxx')).toBeVisible()
})

test('W16-3 删除客户端', async () => {
  await page.goto('/#/open-platform/oauth-client')
  const root = page.locator('.oauth-client-page')
  const row = root.getByRole('row', { name: new RegExp(clientName) }).first()
  await expect(row).toBeVisible({ timeout: 10_000 })
  await row.getByRole('button', { name: '删除' }).click()
  await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click()
  await expect(root.getByRole('row', { name: new RegExp(clientName) })).toHaveCount(0, {
    timeout: 10_000
  })
})
