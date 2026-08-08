import { expect, test } from '@playwright/test'

const emptySchema = JSON.stringify({
  version: '1.0.0',
  globalConfig: {},
  root: {
    id: 'root',
    type: 'root',
    props: {},
    children: [],
  },
})

const roundTripSchema = JSON.stringify({
  version: '1.0.0',
  globalConfig: {},
  root: {
    id: 'root',
    type: 'root',
    props: {},
    children: [{
      id: 'roundtrip-title',
      type: 'text',
      props: { content: '导入导出往返' },
    }],
  },
})

test('selects a masked root node through the canvas selection plane', async ({ page }) => {
  await page.goto('/')

  const node = page.locator('[data-dc-component="node"][data-node-id="shop-title"]')
  await expect(node).toHaveAttribute('data-dc-state', /masked root-owned/)
  await node.click()

  await expect(page.locator('[data-dc-selection-plane] [data-node-id="shop-title"]')).toBeVisible()
  await expect(page.locator('[data-dc-component="node-toolbar"]')).toHaveAttribute('data-dc-state', /vertical/)
})

test('selects a container owner from its external handle and a Region child from its bounds', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('combobox').first().selectOption('content-detail')

  await page.locator('[data-dc-node-handle-for="article-flow"] [data-dc-component="node-handle"]').click()
  await expect(page.locator('[data-dc-selection-plane] [data-node-id="article-flow"]')).toBeVisible()
  await expect(page.locator('[data-dc-component="node-toolbar"]')).toHaveAttribute('data-dc-state', /vertical/)

  await page.locator('[data-dc-component="node"][data-node-id="article-title"]').click()
  await expect(page.locator('[data-dc-selection-plane] [data-node-id="article-title"]')).toBeVisible()
  await expect(page.locator('[data-dc-component="node-toolbar"]')).toHaveAttribute('data-dc-state', /horizontal/)
})

test('creates the first material in an empty root canvas', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page.getByPlaceholder('在此粘贴 JSON Schema...').fill(emptySchema)
  await page.getByRole('button', { name: 'Import', exact: true }).last().click()

  await expect(page.locator('[data-dc-component="empty-state"]')).toBeVisible()
  await expect(page.locator('[data-dc-component="canvas-surface"] [data-dc-component="scroll-area"]')).toHaveCount(1)

  await page.locator('[data-dc-component="material-item"][title^="文本:"]').dragTo(page.locator('[data-dc-interaction-boundary]'))

  await expect(page.getByRole('button', { name: '撤销', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  await expect(page.locator('.playground-modal__textarea')).toHaveValue(/"type": "text"/)
})

test('moves a root node into a container Region', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('combobox').first().selectOption('content-detail')

  await page.locator('[data-dc-component="node"][data-node-id="cover-img"]').click()
  await page.locator('[data-dc-component="node-toolbar"] [data-dc-state~="drag"]').dragTo(page.locator('[data-dc-container-id="article-flow"][data-dc-container-region="default"]'))

  await expect(page.locator('[data-dc-container-id="article-flow"] [data-dc-component="node"][data-node-id="cover-img"]')).toBeVisible()
})

test('moves a Region child back to the root and preserves one owner', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('combobox').first().selectOption('content-detail')

  await page.locator('[data-dc-component="node"][data-node-id="article-title"]').click()
  await page.locator('[data-dc-component="node-toolbar"] [data-dc-state~="drag"]').dragTo(
    page.locator('[data-dc-component="node"][data-node-id="cover-img"]'),
  )

  await expect(page.locator('[data-dc-component="node"][data-node-id="article-title"]')).toHaveAttribute('data-dc-node-owner', 'root')
  await expect(page.locator('[data-dc-container-id="article-flow"] [data-node-id="article-title"]')).toHaveCount(0)
})

test('reorders Region children from start to end through before and after drop positions', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('combobox').first().selectOption('content-detail')

  const region = page.locator('[data-dc-container-id="article-flow"][data-dc-container-region="default"]')
  const childIds = () => region.locator(':scope > [data-node-id]').evaluateAll(nodes =>
    nodes.map(node => node.getAttribute('data-node-id')),
  )

  await page.locator('[data-dc-component="node"][data-node-id="body-2"]').click()
  await page.locator('[data-dc-component="node-toolbar"] [data-dc-state~="drag"]').dragTo(
    page.locator('[data-dc-component="node"][data-node-id="article-title"]'),
    { targetPosition: { x: 24, y: 2 } },
  )
  await expect.poll(childIds).toEqual([
    'body-2',
    'article-title',
    'author-info',
    'divider-1',
    'body-1',
    'inline-img',
  ])

  await page.locator('[data-dc-component="node"][data-node-id="body-2"]').click()
  const inlineImage = page.locator('[data-dc-component="node"][data-node-id="inline-img"]')
  const bounds = await inlineImage.boundingBox()
  if (!bounds)
    throw new Error('Expected the Region target to have layout bounds')
  await page.locator('[data-dc-component="node-toolbar"] [data-dc-state~="drag"]').dragTo(
    inlineImage,
    { targetPosition: { x: 24, y: bounds.height - 2 } },
  )
  await expect.poll(childIds).toEqual([
    'article-title',
    'author-info',
    'divider-1',
    'body-1',
    'inline-img',
    'body-2',
  ])
})

test('shows forbidden feedback before a rejected singleton material drop', async ({ page }) => {
  await page.goto('/')

  const source = page.locator('[data-dc-component="material-item"][title^="Tab 栏:"]')
  const target = page.locator('[data-dc-component="node"][data-node-id="shop-title"]')
  await expect(source).toBeVisible()
  const sourceBounds = await source.boundingBox()
  const targetBounds = await target.boundingBox()
  if (!sourceBounds || !targetBounds)
    throw new Error('Expected draggable material and root target bounds')

  await page.mouse.move(sourceBounds.x + sourceBounds.width / 2, sourceBounds.y + sourceBounds.height / 2)
  await page.mouse.down()
  try {
    await page.mouse.move(targetBounds.x + targetBounds.width / 2, targetBounds.y + targetBounds.height / 2, { steps: 12 })
    await expect(page.locator('[data-dc-component="canvas"]')).toHaveAttribute('data-dc-state', /forbidden/)
    await expect(page.locator('[data-dc-component="forbidden-overlay"]')).toBeVisible()
  }
  finally {
    await page.mouse.up()
  }
})

test('synchronizes Structure and Canvas selection before updating the selected preview', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '结构树', exact: true }).click()

  const titleInStructure = page.locator('[data-dc-component="structure-item"][data-node-id="shop-title"]')
  await titleInStructure.locator('[data-dc-part="select"]').click()
  await expect(titleInStructure).toHaveAttribute('data-dc-state', 'selected')
  await expect(page.locator('[data-dc-selection-plane] [data-node-id="shop-title"]')).toBeVisible()

  await page.locator('[data-dc-component="node"][data-node-id="shop-desc"]').click()
  await expect(page.locator('[data-dc-component="structure-item"][data-node-id="shop-desc"]')).toHaveAttribute('data-dc-state', 'selected')
  await expect(page.locator('[data-dc-selection-plane] [data-node-id="shop-desc"]')).toBeVisible()

  await titleInStructure.locator('[data-dc-part="select"]').click()
  const contentField = page.locator('[data-dc-component="form-field"]').filter({ hasText: '文本内容' })
  await contentField.locator('textarea').fill('可观察属性更新')
  await expect(page.locator('[data-dc-component="node"][data-node-id="shop-title"]')).toContainText('可观察属性更新')
})

test('keeps history commits atomic and truncates redo after a new branch', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '结构树', exact: true }).click()
  const undo = page.locator('[data-dc-workspace-control="undo"]')
  const redo = page.locator('[data-dc-workspace-control="redo"]')
  const contentField = page.locator('[data-dc-component="form-field"]').filter({ hasText: '文本内容' }).locator('textarea')
  const titleInStructure = page.locator('[data-dc-component="structure-item"][data-node-id="shop-title"] [data-dc-part="select"]')

  await titleInStructure.click()
  await expect(undo).toBeDisabled()
  await contentField.fill('好物精选商城')
  await expect(undo).toBeDisabled()

  await contentField.fill('历史第一次提交')
  await expect(undo).toBeEnabled()
  await expect(redo).toBeDisabled()

  await undo.click()
  await expect(page.locator('[data-dc-component="node"][data-node-id="shop-title"]')).toContainText('好物精选商城')
  await expect(undo).toBeDisabled()
  await expect(redo).toBeEnabled()

  await redo.click()
  await expect(page.locator('[data-dc-component="node"][data-node-id="shop-title"]')).toContainText('历史第一次提交')
  await expect(undo).toBeEnabled()
  await expect(redo).toBeDisabled()

  await undo.click()
  await contentField.fill('历史分支提交')
  await expect(undo).toBeEnabled()
  await expect(redo).toBeDisabled()
})

test('does not create history for a rejected material drop', async ({ page }) => {
  await page.goto('/')
  const undo = page.locator('[data-dc-workspace-control="undo"]')
  const source = page.locator('[data-dc-component="material-item"][title^="Tab 栏:"]')
  const target = page.locator('[data-dc-component="node"][data-node-id="shop-title"]')

  await expect(undo).toBeDisabled()
  await source.dragTo(target)
  await expect(undo).toBeDisabled()
  await expect(page.locator('[data-dc-component="node"][data-node-id="tabbar-main"]')).toHaveCount(1)
})

test('keeps Canvas pointer, hand, pan, scroll, and Frame sessions observable', async ({ page }) => {
  await page.goto('/')
  const canvas = page.locator('[data-dc-component="canvas"]')
  const viewport = page.locator('[data-dc-interaction-boundary]')
  const stage = page.locator('[data-dc-canvas-stage]')
  const scrollport = page.locator('.dc-canvas-surface__scrollport > [data-dc-part="viewport"]')
  const hand = page.locator('[data-dc-workspace-control="hand"]')
  const pointer = page.locator('[data-dc-workspace-control="pointer"]')
  const center = page.locator('[data-dc-workspace-control="center"]')

  await expect(pointer).toHaveAttribute('aria-pressed', 'true')
  await hand.click()
  await expect(hand).toHaveAttribute('aria-pressed', 'true')
  await expect(canvas).toHaveAttribute('data-dc-state', /hand/)

  const viewportBounds = await viewport.boundingBox()
  if (!viewportBounds)
    throw new Error('Expected the Canvas interaction boundary to have layout bounds')
  await page.mouse.move(viewportBounds.x + 50, viewportBounds.y + 200)
  await page.mouse.down()
  await page.mouse.move(viewportBounds.x + 120, viewportBounds.y + 260, { steps: 4 })
  await page.mouse.up()
  await expect(stage).toHaveAttribute('style', /--dc-internal-canvas-pan-x: 70px/)
  await expect(stage).toHaveAttribute('style', /--dc-internal-canvas-pan-y: 60px/)

  await center.click()
  await expect(stage).toHaveAttribute('style', /--dc-internal-canvas-pan-x: 0px/)
  await expect(stage).toHaveAttribute('style', /--dc-internal-canvas-pan-y: 0px/)

  await pointer.click()
  await expect(pointer).toHaveAttribute('aria-pressed', 'true')
  await expect(hand).toHaveAttribute('aria-pressed', 'false')
  await expect(canvas).not.toHaveAttribute('data-dc-state', /hand/)
  await viewport.hover()
  await page.keyboard.down('Space')
  await expect(canvas).toHaveAttribute('data-dc-state', /hand/)
  await page.keyboard.up('Space')
  await expect(canvas).not.toHaveAttribute('data-dc-state', /hand/)

  await scrollport.hover()
  await page.mouse.wheel(0, 800)
  await expect.poll(() => scrollport.evaluate(element => (element as HTMLElement).scrollTop)).toBeGreaterThan(0)

  await page.getByLabel('预览设备').selectOption('android')
  await expect(page.locator('.dc-device-frame')).toHaveClass(/android/)
  await expect(stage).toHaveAttribute('style', /--dc-internal-canvas-pan-x: 0px/)
})

test('coordinates template switching with host confirmation', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '结构树', exact: true }).click()
  await page.locator('[data-dc-component="structure-item"][data-node-id="shop-title"] [data-dc-part="select"]').click()
  await page.locator('[data-dc-component="form-field"]').filter({ hasText: '文本内容' }).locator('textarea').fill('切换前修改')

  const templatePicker = page.getByRole('combobox').first()
  await templatePicker.selectOption('content-detail')
  const confirmation = page.getByRole('dialog')
  await expect(confirmation).toContainText('确认切换模板')
  await confirmation.getByRole('button', { name: /取\s*消/ }).click()
  await expect(confirmation).toBeHidden()
  await expect(templatePicker).toHaveValue('ecommerce')
  await expect(page.locator('[data-dc-component="node"][data-node-id="shop-title"]')).toContainText('切换前修改')

  await templatePicker.selectOption('content-detail')
  await page.getByRole('dialog').last().getByRole('button', { name: /切\s*换/ }).click()
  await expect(templatePicker).toHaveValue('content-detail')
  await expect(page.locator('[data-dc-component="node"][data-node-id="article-flow"]')).toBeVisible()
})

test('switches locale without losing the active Designer session', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'English', exact: true }).click()
  await expect(page.getByRole('button', { name: '中文', exact: true })).toBeVisible()
  await expect(page.locator('[data-dc-component="material-panel"] [data-dc-part="heading"]')).toHaveText('Materials')

  await page.getByRole('button', { name: '中文', exact: true }).click()
  await expect(page.getByRole('button', { name: 'English', exact: true })).toBeVisible()
  await expect(page.locator('[data-dc-component="material-panel"] [data-dc-part="heading"]')).toHaveText('物料')
})

test('round-trips an imported Schema through export and import', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page.getByPlaceholder('在此粘贴 JSON Schema...').fill(roundTripSchema)
  await page.getByRole('button', { name: 'Import', exact: true }).last().click()
  await expect(page.locator('[data-dc-component="node"][data-node-id="roundtrip-title"]')).toContainText('导入导出往返')

  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const exported = await page.locator('.playground-modal__textarea').inputValue()
  expect(exported).toContain('roundtrip-title')
  expect(exported).toContain('导入导出往返')
  await page.locator('.playground-modal__close').click()

  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page.getByPlaceholder('在此粘贴 JSON Schema...').fill(exported)
  await page.getByRole('button', { name: 'Import', exact: true }).last().click()
  await expect(page.locator('[data-dc-component="node"][data-node-id="roundtrip-title"]')).toContainText('导入导出往返')
})
