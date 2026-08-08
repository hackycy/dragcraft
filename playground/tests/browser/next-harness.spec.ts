import { expect, test } from '@playwright/test'

const importedNextSchema = JSON.stringify({
  version: '1',
  globalConfig: { title: 'Imported' },
  page: { props: {} },
  nodes: [{ id: 'imported-next-title', type: 'text', props: { content: 'Imported Next' } }],
  structure: { root: ['imported-next-title'], containers: {} },
})

test('mounts the existing workbench with the Next backend selector', async ({ page }) => {
  await page.goto('/?backend=next')

  await expect(page.locator('[data-dc-component="node"][data-node-id="shop-title"]')).toBeVisible()
  await expect(page.locator('[data-dc-component="material-item"][title="文本"]')).toBeVisible()
})

test('switches templates using final Next fixtures', async ({ page }) => {
  await page.goto('/?backend=next')

  await page.locator('.playground-header__select').selectOption('content-detail')

  await expect(page.locator('[data-dc-component="node"][data-node-id="article-title"]')).toBeVisible()
  await expect(page.locator('[data-dc-component="node"][data-node-id="shop-title"]')).toHaveCount(0)
})

test('exports and imports final DocumentSchema through the Next host harness', async ({ page }) => {
  await page.goto('/?backend=next')

  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const exported = JSON.parse(await page.locator('.playground-modal__textarea').inputValue())
  expect(exported).toHaveProperty('nodes')
  expect(exported).toHaveProperty('structure')
  expect(exported).not.toHaveProperty('root')
  await page.getByRole('button', { name: 'Close', exact: true }).click()

  await page.getByRole('button', { name: 'Import', exact: true }).first().click()
  await page.getByPlaceholder('在此粘贴 JSON Schema...').fill(importedNextSchema)
  await page.getByRole('button', { name: 'Import', exact: true }).last().click()

  await expect(page.locator('[data-dc-component="node"][data-node-id="imported-next-title"]')).toBeVisible()
})
