import { expect, test } from '@playwright/test'

const importedNextSchema = JSON.stringify({
  version: '1',
  globalConfig: { title: 'Imported' },
  page: { props: {} },
  nodes: [{ id: 'imported-next-title', type: 'text', props: { content: 'Imported Next' } }],
  structure: { root: ['imported-next-title'], containers: {} },
})

const viewportGeometrySchema = JSON.stringify({
  version: '1',
  globalConfig: { title: 'Viewport geometry' },
  page: { props: {} },
  nodes: [
    {
      id: 'viewport-margin-button',
      type: 'floating-button',
      props: { label: '+', side: 'right', bottom: 16, sideOffset: 16, size: 52, backgroundColor: '#07C160', textColor: '#ffffff' },
      style: { container: { marginTop: 17, marginRight: 19, marginBottom: 23, marginLeft: 29 } },
    },
    {
      id: 'viewport-container',
      type: 'viewport-flex-container',
      props: { direction: 'column', wrap: false, gap: 12, align: 'stretch' },
    },
    {
      id: 'viewport-container-child',
      type: 'text',
      props: { content: 'Viewport container child', fontSize: 16, fontWeight: 'normal', color: '#333333', textAlign: 'left' },
    },
  ],
  structure: {
    root: ['viewport-margin-button', 'viewport-container'],
    containers: {
      'viewport-container': { regions: { default: ['viewport-container-child'] } },
    },
  },
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
  const documentIds = await content.locator('[data-dc-component="node"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-node-id')))
  const viewportIds = await page.locator('.dc-canvas-surface__viewport-plane [data-dc-component="node"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-node-id')))

  await expect(navbar.locator('xpath=ancestor::*[contains(@class, "sticky-navigation")]')).toHaveCount(1)
  await expect(tabbar.locator('xpath=ancestor::*[contains(@class, "bottom-navigation")]')).toHaveCount(1)
  await expect(floatingAction.locator('xpath=ancestor::*[contains(@class, "floating-action")]')).toHaveCount(1)
  await expect(navbar).not.toHaveAttribute('data-dc-layout-placement', /.*/)
  expect(documentIds).not.toContain('nav-ecommerce')
  expect(viewportIds).toContain('nav-ecommerce')
  expect(viewportIds).toContain('tabbar-main')
  expect(viewportIds).toContain('floating-cart')
})

test('keeps special Frames positioned against the scroll viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/')

  const scrollViewport = page.locator('.dc-canvas-surface__scrollport > [data-dc-part="viewport"]')
  const viewportPlane = page.locator('.dc-canvas-surface__viewport-plane')
  const navbar = page.locator('[data-dc-component="node"][data-node-id="nav-ecommerce"]')
  const tabbar = page.locator('[data-dc-component="node"][data-node-id="tabbar-main"]')
  const navbarFrame = navbar.locator('xpath=ancestor::*[contains(@class, "sticky-navigation")]')
  const tabbarFrame = tabbar.locator('xpath=ancestor::*[contains(@class, "bottom-navigation")]')
  const floatingButton = page.locator('.pg-widget-floating-button[data-dc-node-surface-for="floating-cart"]')

  const [viewportBox, tabbarBox, floatingBox] = await Promise.all([
    viewportPlane.boundingBox(),
    tabbar.boundingBox(),
    floatingButton.boundingBox(),
  ])
  if (!viewportBox || !tabbarBox || !floatingBox)
    throw new Error('Expected viewport, Tab, and floating button bounds')

  await expect(tabbarFrame).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  const reservationGeometry = await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('[data-dc-canvas-stage]')
    const content = document.querySelector<HTMLElement>('.dc-canvas-surface__content')
    if (!stage || !content)
      return null
    const transform = getComputedStyle(stage).transform
    const scale = transform.startsWith('matrix(') ? Number.parseFloat(transform.split(',')[0].slice(7)) : 1
    return {
      scale,
      contentPaddingBlockStart: Number.parseFloat(getComputedStyle(content).paddingBlockStart),
      contentPaddingBlockEnd: Number.parseFloat(getComputedStyle(content).paddingBlockEnd),
    }
  })
  if (!reservationGeometry)
    throw new Error('Expected stage and content geometry')
  expect(Math.abs(reservationGeometry.contentPaddingBlockEnd * reservationGeometry.scale - tabbarBox.height)).toBeLessThan(0.5)
  const navbarFrameBox = await navbarFrame.boundingBox()
  if (!navbarFrameBox)
    throw new Error('Expected navigation Frame bounds')
  expect(Math.abs(reservationGeometry.contentPaddingBlockStart * reservationGeometry.scale - navbarFrameBox.height)).toBeLessThan(0.5)
  await expect(navbar.locator('.dc-node__handle')).toHaveCount(0)
  await expect(navbarFrame).toHaveCSS('position', 'absolute')
  await expect(viewportPlane.locator('.pg-presentation-frame--sticky-navigation')).toHaveCount(1)
  await expect(viewportPlane.locator('.pg-presentation-frame--bottom-navigation')).toHaveCount(1)
  const navbarBox = await navbar.boundingBox()
  if (!navbarBox)
    throw new Error('Expected navigation bounds')
  expect(Math.abs(navbarBox.y - viewportBox.y)).toBeLessThan(0.5)
  expect(floatingBox.y).toBeGreaterThan(viewportBox.y + viewportBox.height / 2)
  expect(floatingBox.x).toBeGreaterThan(viewportBox.x + viewportBox.width / 2)
  expect(floatingBox.y + floatingBox.height).toBeLessThan(tabbarBox.y - 4)

  const viewportTop = viewportBox.y
  await scrollViewport.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await expect.poll(async () => {
    const box = await navbar.boundingBox()
    return box?.y ?? Number.NaN
  }).toBeCloseTo(viewportTop, 1)

  const [scrolledTabbarBox, scrolledViewportBox] = await Promise.all([
    tabbar.boundingBox(),
    viewportPlane.boundingBox(),
  ])
  if (!scrolledTabbarBox || !scrolledViewportBox)
    throw new Error('Expected scrolled Tab and viewport bounds')
  expect(Math.abs(scrolledTabbarBox.y + scrolledTabbarBox.height - (scrolledViewportBox.y + scrolledViewportBox.height))).toBeLessThan(0.5)
  expect(scrolledTabbarBox.y + scrolledTabbarBox.height).toBeGreaterThanOrEqual(
    scrolledViewportBox.y + scrolledViewportBox.height - 0.25,
  )

  const edgeOwner = await page.evaluate(() => {
    const viewport = document.querySelector('.dc-canvas-surface__viewport-plane')
    if (!viewport)
      return null
    const rect = viewport.getBoundingClientRect()
    const point = (y: number) => document.elementsFromPoint((rect.left + rect.right) / 2, y)
      .slice(0, 6)
      .map(element => ({ tag: element.tagName, className: typeof element.className === 'string' ? element.className : '' }))
    return {
      top: point(Math.ceil(rect.top) + 1),
      bottom: point(Math.floor(rect.bottom) - 1),
    }
  })
  expect(edgeOwner?.top.some(element => element.className.includes('pg-widget-navbar'))).toBe(true)
  expect(edgeOwner?.bottom.some(element => element.className.includes('pg-widget-tabbar'))).toBe(true)
})

test('keeps viewport NodeHosts aligned with their Preview surfaces and selection projections', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/')

  const viewport = page.locator('.dc-canvas-surface__viewport-plane')
  const rootPlane = page.locator('.dc-node-selection-plane--root')
  const scrollport = page.locator('.dc-canvas-surface__scrollport > [data-dc-part="viewport"]')

  async function readBounds(nodeId: string) {
    const node = page.locator(`[data-dc-component="node"][data-node-id="${nodeId}"]`)
    const surface = page.locator(`[data-dc-node-surface-for="${nodeId}"]`)
    const selection = page.locator(`.dc-node__selection-projection[data-node-id="${nodeId}"]`)
    const [nodeBounds, surfaceBounds, viewportBounds] = await Promise.all([
      node.boundingBox(),
      surface.boundingBox(),
      viewport.boundingBox(),
    ])
    if (!nodeBounds || !surfaceBounds || !viewportBounds)
      throw new Error(`Expected ${nodeId} NodeHost, Preview surface, and viewport bounds`)

    return { node, surface, selection, nodeBounds, surfaceBounds, viewportBounds }
  }

  async function expectViewportGeometry(nodeId: string) {
    const { node, surface, selection } = await readBounds(nodeId)
    await expect.poll(async () => {
      const [nodeBounds, surfaceBounds, viewportBounds] = await Promise.all([
        node.boundingBox(),
        surface.boundingBox(),
        viewport.boundingBox(),
      ])
      if (!nodeBounds || !surfaceBounds || !viewportBounds)
        return false
      return Math.abs(nodeBounds.x - surfaceBounds.x) < 0.1
        && Math.abs(nodeBounds.y - surfaceBounds.y) < 0.1
        && Math.abs(nodeBounds.width - surfaceBounds.width) < 0.1
        && Math.abs(nodeBounds.height - surfaceBounds.height) < 0.1
        && nodeBounds.width * nodeBounds.height < viewportBounds.width * viewportBounds.height / 2
    }, { message: `${nodeId} NodeHost must converge to its Preview surface` }).toBe(true)

    await surface.click()
    await expect(node).toHaveAttribute('data-dc-state', /selected/)
    await expect(selection).toBeVisible()
    await expect(selection).toHaveAttribute('data-dc-selection-plane', 'root')
    await expect(selection.locator('[data-dc-component="node-selection"]')).toHaveAttribute('data-dc-state', 'root-segment')
    await expect(selection.locator('.dc-node__selection-edge')).toHaveCount(4)

    await expect.poll(async () => {
      const [selectionBounds, surfaceBounds, rootPlaneBounds] = await Promise.all([
        selection.boundingBox(),
        surface.boundingBox(),
        rootPlane.boundingBox(),
      ])
      if (!selectionBounds || !surfaceBounds || !rootPlaneBounds)
        return false
      return Math.abs(selectionBounds.x - rootPlaneBounds.x) < 0.1
        && Math.abs(selectionBounds.y - surfaceBounds.y) < 0.1
        && Math.abs(selectionBounds.width - rootPlaneBounds.width) < 0.1
        && Math.abs(selectionBounds.height - surfaceBounds.height) < 0.1
    }, { message: `${nodeId} root selection must span the root plane and keep the Preview height` }).toBe(true)
  }

  await expectViewportGeometry('floating-cart')
  await page.locator('[data-dc-component="node"][data-node-id="shop-title"]').click()
  await expect(page.locator('[data-dc-component="node"][data-node-id="shop-title"]')).toHaveAttribute('data-dc-state', /selected/)
  await expectViewportGeometry('nav-ecommerce')
  await expectViewportGeometry('tabbar-main')

  await page.setViewportSize({ width: 1440, height: 900 })
  await expectViewportGeometry('floating-cart')

  await page.getByLabel('预览设备').selectOption('android')
  await expectViewportGeometry('floating-cart')

  await scrollport.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await expectViewportGeometry('floating-cart')

  await page.locator('[data-dc-node-surface-for="floating-cart"]').evaluate((element) => {
    element.style.display = 'none'
  })
  await expect(page.locator('.dc-node__selection-projection[data-node-id="floating-cart"]')).toBeHidden()
})

test('keeps viewport anchor margins external', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Import', exact: true }).first().click()
  await page.getByPlaceholder('在此粘贴 JSON Schema...').fill(viewportGeometrySchema)
  await page.getByRole('button', { name: 'Import', exact: true }).last().click()

  const marginNode = page.locator('[data-dc-component="node"][data-node-id="viewport-margin-button"]')
  const marginSurface = page.locator('[data-dc-node-surface-for="viewport-margin-button"]')
  await expect.poll(async () => {
    const [nodeBounds, surfaceBounds] = await Promise.all([
      marginNode.boundingBox(),
      marginSurface.boundingBox(),
    ])
    if (!nodeBounds || !surfaceBounds)
      return false
    return Math.abs(nodeBounds.x - surfaceBounds.x) < 0.1
      && Math.abs(nodeBounds.y - surfaceBounds.y) < 0.1
      && Math.abs(nodeBounds.width - surfaceBounds.width) < 0.1
      && Math.abs(nodeBounds.height - surfaceBounds.height) < 0.1
  }, { message: 'Viewport container margins must not move the NodeHost anchor' }).toBe(true)
})

test('keeps Region children inside framed containers', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Import', exact: true }).first().click()
  await page.getByPlaceholder('在此粘贴 JSON Schema...').fill(viewportGeometrySchema)
  await page.getByRole('button', { name: 'Import', exact: true }).last().click()

  const frame = page.locator('.pg-presentation-frame--viewport-container')
  const childHost = page.locator('[data-dc-component="node"][data-node-id="viewport-container-child"]')
  const childSurface = childHost.locator(':scope > [data-dc-node-surface]')
  await expect(childHost).toBeVisible()
  await expect(childSurface).toHaveCount(1)
  await expect(frame.locator(':scope > [data-dc-node-surface-for="viewport-container-child"]')).toHaveCount(0)

  await childHost.click()
  const childSelection = page.locator('.dc-node__selection-projection[data-node-id="viewport-container-child"]')
  await expect(childSelection).toHaveAttribute('data-dc-selection-plane', 'viewport')
  await expect(childSelection.locator('[data-dc-component="node-selection"]')).toHaveAttribute('data-dc-state', 'material-bounds')
  const [childBounds, selectionBounds] = await Promise.all([
    childHost.boundingBox(),
    childSelection.boundingBox(),
  ])
  if (!childBounds || !selectionBounds)
    throw new Error('Expected framed Region child and its selection projection')
  expect(selectionBounds.x).toBeCloseTo(childBounds.x, 1)
  expect(selectionBounds.y).toBeCloseTo(childBounds.y, 1)
  expect(selectionBounds.width).toBeCloseTo(childBounds.width, 1)
  expect(selectionBounds.height).toBeCloseTo(childBounds.height, 1)
})

test('reserves the fixed Device Frame edge before the first document node', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 })
  await page.goto('/')

  const devicePicker = page.locator('.dc-device-picker__select')
  const navbar = page.locator('[data-dc-component="node"][data-node-id="nav-ecommerce"]')
  const firstDocumentNode = page.locator('[data-dc-component="node"][data-node-id="swiper-banner"]')
  const viewport = page.locator('.dc-device-frame__viewport')

  for (const device of ['iphone', 'iphone-x', 'iphone-8', 'android', 'android-waterdrop', 'tablet', 'desktop']) {
    await devicePicker.selectOption(device)
    await expect(page.locator(`.dc-device-frame--${device}`), `${device} Device Frame`).toBeVisible()
    await expect.poll(async () => {
      const [navbarBounds, firstDocumentNodeBounds, viewportBounds] = await Promise.all([
        navbar.boundingBox(),
        firstDocumentNode.boundingBox(),
        viewport.boundingBox(),
      ])
      return navbarBounds !== null
        && firstDocumentNodeBounds !== null
        && viewportBounds !== null
        && Math.abs(navbarBounds.y - viewportBounds.y) < 0.5
        && Math.abs(firstDocumentNodeBounds.y - (navbarBounds.y + navbarBounds.height)) < 0.5
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

test('disables Navbar and Tab bar duplication through their material authoring policies', async ({ page }) => {
  await page.goto('/')

  const toolbar = page.locator('[data-dc-component="node-toolbar"]')
  await page.locator('[data-dc-node-surface-for="nav-ecommerce"]').click()
  await expect(toolbar.getByTitle('复制')).toBeDisabled()

  await page.locator('[data-dc-node-surface-for="tabbar-main"]').click()
  await expect(toolbar.getByTitle('复制')).toBeDisabled()

  await page.locator('[data-dc-component="node"][data-node-id="shop-title"]').click()
  await expect(toolbar.getByTitle('复制')).toBeEnabled()
})

test('rejects repeated Navbar creation without growing the top reservation', async ({ page }) => {
  await page.goto('/')

  const source = page.locator('[data-dc-component="material-item"][title="导航栏"]')
  const boundary = page.locator('[data-dc-interaction-boundary]')
  const navbar = page.locator('[data-dc-component="node"][data-node-id^="nav-"]')
  const content = page.locator('.dc-canvas-surface__content')

  const initialCount = await navbar.count()
  const initialPadding = await content.evaluate(element => getComputedStyle(element).paddingBlockStart)
  await source.dragTo(boundary)
  await source.dragTo(boundary)

  await expect(navbar).toHaveCount(initialCount)
  await expect(content).toHaveCSS('padding-block-start', initialPadding)
})

test('renders inspector fields for image, navigation, and form materials', async ({ page }) => {
  await page.goto('/')

  const propertyPanel = page.locator('[data-dc-component="property-panel"]')
  const cases = [
    { nodeId: 'product-img', fieldLabel: '图片地址' },
    { nodeId: 'nav-ecommerce', fieldLabel: '标题' },
    { nodeId: 'tabbar-main', fieldLabel: 'Tab 列表' },
    { nodeId: 'form-name', fieldLabel: '标签' },
  ]

  for (const { nodeId, fieldLabel } of cases) {
    const viewportSurface = page.locator(`[data-dc-node-surface-for="${nodeId}"]`)
    const target = await viewportSurface.count() > 0
      ? viewportSurface
      : page.locator(`[data-dc-component="node"][data-node-id="${nodeId}"]`)
    await target.click()
    await expect(propertyPanel.locator('[data-dc-component="form-field"]').filter({ hasText: fieldLabel })).toBeVisible()
  }
})

test('makes newly added image materials follow the node width', async ({ page }) => {
  await page.goto('/')

  const imageNodes = page.locator('[data-dc-component="node"][data-node-type="image"]')
  const countBefore = await imageNodes.count()
  await page.locator('[data-dc-component="material-item"][title="图片"]').dragTo(
    page.locator('[data-dc-interaction-boundary]'),
  )
  await expect(imageNodes).toHaveCount(countBefore + 1)

  const addedImage = imageNodes.last()
  const geometry = await addedImage.evaluate((node) => {
    const surface = node.querySelector<HTMLElement>('[data-dc-node-surface]')
    if (!surface)
      throw new Error('Expected image material surface')
    const nodeWidth = node.getBoundingClientRect().width
    const surfaceWidth = surface.getBoundingClientRect().width
    return {
      nodeWidth,
      surfaceWidth,
      inlineWidth: surface.style.width,
    }
  })

  expect(geometry.inlineWidth).toBe('100%')
  expect(Math.abs(geometry.surfaceWidth - geometry.nodeWidth)).toBeLessThan(0.5)
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
  await expect(page.locator('[data-dc-component="node"][data-node-id="product-seo"]')).not.toHaveAttribute('data-dc-visible', /.*/)
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
