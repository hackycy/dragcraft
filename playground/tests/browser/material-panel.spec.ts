import { expect, test } from '@playwright/test'

test('centers the material search icon inside its input', async ({ page }) => {
  await page.goto('/')

  const input = page.locator('[data-dc-component="material-panel"] [data-dc-part="search-input"]')
  const icon = page.locator('[data-dc-component="material-panel"] [data-dc-part="search-icon"]')
  const svg = icon.locator('svg')
  const [inputBox, iconBox, svgBox] = await Promise.all([
    input.boundingBox(),
    icon.boundingBox(),
    svg.boundingBox(),
  ])

  if (!inputBox || !iconBox || !svgBox)
    throw new Error('Expected material search input and icon bounds')

  expect(Math.abs(iconBox.height - svgBox.height)).toBeLessThan(0.5)
  expect(Math.abs((svgBox.y + svgBox.height / 2) - (inputBox.y + inputBox.height / 2))).toBeLessThan(0.5)
})
