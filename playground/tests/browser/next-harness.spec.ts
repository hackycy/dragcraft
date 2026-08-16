import { expect, test } from '@playwright/test'

const importedNextSchema = JSON.stringify({
  version: '1',
  globalConfig: { title: 'Imported' },
  page: { props: {} },
  nodes: [{ id: 'imported-next-title', type: 'text', props: { content: 'Imported Next' } }],
  structure: { root: ['imported-next-title'], containers: {} },
})

test('mounts the existing workbench with the public Next backend', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('[data-dc-component="node"][data-node-id="shop-title"]')).toBeVisible()
  await expect(page.locator('[data-dc-component="material-item"][title="文本"]')).toBeVisible()
})

test('mounts type-defined root materials in Schema order through the content plane', async ({ page }) => {
  await page.goto('/')

  const navbar = page.locator('[data-dc-component="node"][data-node-id="nav-ecommerce"]')
  const tabbar = page.locator('[data-dc-component="node"][data-node-id="tabbar-main"]')
  const floatingAction = page.locator('[data-dc-component="node"][data-node-id="floating-cart"]')
  const content = page.locator('.dc-canvas-surface__content')
  const rootIds = await content.locator(':scope > [data-dc-component="node"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-node-id')))

  await expect(navbar).toHaveAttribute('data-dc-layout-placement', 'chrome')
  await expect(tabbar).toHaveAttribute('data-dc-layout-placement', 'chrome')
  await expect(floatingAction).toHaveAttribute('data-dc-layout-placement', 'layer')
  expect(rootIds).toContain('nav-ecommerce')
  expect(rootIds).toContain('tabbar-main')
  expect(rootIds).toContain('floating-cart')
  expect(rootIds.indexOf('nav-ecommerce')).toBeLessThan(rootIds.indexOf('tabbar-main'))
})

test('reserves fixed Device Frame chrome before the first document node', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 })
  await page.goto('/')

  const devicePicker = page.locator('.dc-device-picker__select')
  const navbar = page.locator('[data-dc-component="node"][data-node-id="nav-ecommerce"]')
  const firstDocumentNode = page.locator('[data-dc-component="node"][data-node-id="swiper-banner"]')

  for (const device of ['iphone', 'iphone-x', 'iphone-8', 'android', 'android-waterdrop', 'tablet', 'desktop']) {
    await devicePicker.selectOption(device)
    await expect(page.locator(`.dc-device-frame--${device}`), `${device} Device Frame`).toBeVisible()
    await expect.poll(async () => {
      const [navbarBounds, firstDocumentNodeBounds] = await Promise.all([
        navbar.boundingBox(),
        firstDocumentNode.boundingBox(),
      ])
      return navbarBounds !== null
        && firstDocumentNodeBounds !== null
        && navbarBounds.y + navbarBounds.height <= firstDocumentNodeBounds.y
    }, { message: `${device} Navbar must not cover document content` }).toBe(true)
  }
})

test('prevents navigation and floating-action materials from reordering', async ({ page }) => {
  await page.goto('/')

  const toolbar = page.locator('[data-dc-component="node-toolbar"]')
  await page.getByRole('button', { name: '结构树', exact: true }).click()
  const assertSortingDisabled = async (nodeId: string) => {
    await page.locator(`[data-dc-component="structure-item"][data-node-id="${nodeId}"] [data-dc-part="select"]`).click()
    await expect(toolbar.locator('[data-dc-state~="drag"]')).toHaveAttribute('draggable', 'false')
    await expect(toolbar.getByTitle('上移')).toBeDisabled()
    await expect(toolbar.getByTitle('下移')).toBeDisabled()
  }

  await assertSortingDisabled('nav-ecommerce')
  await assertSortingDisabled('tabbar-main')
  await assertSortingDisabled('floating-cart')

  await page.locator('[data-dc-component="node"][data-node-id="shop-title"]').click()
  await expect(toolbar.locator('[data-dc-state~="drag"]')).toHaveAttribute('draggable', 'true')
})

test('disables Navbar duplication through its material authoring policy', async ({ page }) => {
  await page.goto('/')

  const toolbar = page.locator('[data-dc-component="node-toolbar"]')
  await page.locator('[data-dc-component="node"][data-node-id="nav-ecommerce"]').click()
  await expect(toolbar.getByTitle('复制')).toBeDisabled()

  await page.locator('[data-dc-component="node"][data-node-id="shop-title"]').click()
  await expect(toolbar.getByTitle('复制')).toBeEnabled()
})

test('renders inspector fields for image, chrome, and form materials', async ({ page }) => {
  await page.goto('/')

  const propertyPanel = page.locator('[data-dc-component="property-panel"]')
  const cases = [
    { nodeId: 'product-img', fieldLabel: '图片地址' },
    { nodeId: 'nav-ecommerce', fieldLabel: '标题' },
    { nodeId: 'tabbar-main', fieldLabel: 'Tab 列表' },
    { nodeId: 'form-name', fieldLabel: '标签' },
  ]

  for (const { nodeId, fieldLabel } of cases) {
    await page.locator(`[data-dc-component="node"][data-node-id="${nodeId}"]`).click()
    await expect(propertyPanel.locator('[data-dc-component="form-field"]').filter({ hasText: fieldLabel })).toBeVisible()
  }
})

test('switches templates using final Next fixtures', async ({ page }) => {
  await page.goto('/')

  await page.locator('.playground-header__select').selectOption('content-detail')

  await expect(page.locator('[data-dc-component="node"][data-node-id="article-title"]')).toBeVisible()
  await expect(page.locator('[data-dc-component="node"][data-node-id="shop-title"]')).toHaveCount(0)
})

test('keeps invisible Headless material out of the business preview', async ({ page }) => {
  await page.goto('/')
  await page.locator('.playground-header__select').selectOption('product-detail')

  await expect(page.locator('[data-dc-component="node"][data-node-id="product-seo"]')).toHaveCount(1)
  await expect(page.locator('[data-dc-component="node"][data-node-id="product-seo"]')).toHaveAttribute('data-dc-visible', 'false')
  await expect(page.getByText('Unknown widget: seo-meta', { exact: true })).toHaveCount(0)
})

test('creates one page SEO material without a persistent Designer notice', async ({ page }) => {
  await page.goto('/')

  const source = page.locator('[data-dc-component="material-item"][title^="页面 SEO"]')
  const boundary = page.locator('[data-dc-interaction-boundary]')
  const propertyPanel = page.locator('[data-dc-component="property-panel"]')

  await expect(source).toBeVisible()
  await expect(source).toHaveAttribute('data-dc-state', /headless/)
  await expect(source.locator('[data-dc-part="headless-feedback"]')).toHaveText('无画布预览')
  await source.dragTo(boundary)
  await expect(propertyPanel.locator('[data-dc-component="headless-material-notice"]')).toHaveCount(0)
  await expect(page.locator('[data-dc-component="headless-drop-overlay"]')).toHaveCount(0)
  await expect(propertyPanel.locator('[data-dc-component="form-field"]').filter({ hasText: '页面标题' })).toBeVisible()
  await expect(propertyPanel.locator('[data-dc-component="form-field"]').filter({ hasText: '页面描述' })).toBeVisible()

  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const firstExport = JSON.parse(await page.locator('.playground-modal__textarea').inputValue())
  expect(firstExport.nodes.filter((node: { type: string }) => node.type === 'seo-meta')).toHaveLength(1)
  await page.getByRole('button', { name: 'Close', exact: true }).click()

  await source.dragTo(boundary)
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const secondExport = JSON.parse(await page.locator('.playground-modal__textarea').inputValue())
  expect(secondExport.nodes.filter((node: { type: string }) => node.type === 'seo-meta')).toHaveLength(1)
})

test('clips Headless drop feedback inside the Device Frame', async ({ page }) => {
  await page.goto('/')

  const source = page.locator('[data-dc-component="material-item"][title^="页面 SEO"]')
  const boundary = page.locator('[data-dc-interaction-boundary]')
  const frame = page.locator('.dc-device-frame')
  const transfer = await page.evaluateHandle(() => new DataTransfer())

  await source.dispatchEvent('dragstart', { dataTransfer: transfer })
  await boundary.dispatchEvent('dragover', { dataTransfer: transfer })

  const overlay = page.locator('[data-dc-component="headless-drop-overlay"]')
  await expect(overlay).toBeVisible()
  await expect(frame.locator('[data-dc-component="headless-drop-overlay"]')).toHaveCount(1)
  await expect(page.locator('[data-dc-component="drop-indicator"]')).toHaveCount(0)

  const [overlayBounds, frameBounds] = await Promise.all([
    overlay.boundingBox(),
    frame.boundingBox(),
  ])
  if (!overlayBounds || !frameBounds)
    throw new Error('Expected Headless overlay and Device Frame bounds')

  expect(overlayBounds.x).toBeGreaterThanOrEqual(frameBounds.x)
  expect(overlayBounds.y).toBeGreaterThanOrEqual(frameBounds.y)
  expect(overlayBounds.x + overlayBounds.width).toBeLessThanOrEqual(frameBounds.x + frameBounds.width)
  expect(overlayBounds.y + overlayBounds.height).toBeLessThanOrEqual(frameBounds.y + frameBounds.height)
})

test('exports and imports final DocumentSchema through the public Designer', async ({ page }) => {
  await page.goto('/')

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
