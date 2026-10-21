/**
 * Automated accessibility checks (axe-core, WCAG 2.0/2.1/2.2 A and AA rules) on every page, at
 * phone and desktop widths. Automated checks find only some problems; see
 * docs/accessibility-report.md for the manual checks.
 */
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function expectNoViolations(page: Page, where: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} × ${v.help}`)
  expect(summary, where).toEqual([])
}

const STATIC_PAGES = ['/', '/reviews', '/help', '/about', '/privacy', '/licensing']
const PROGRAMME_SECTIONS = [
  'context',
  'capabilities',
  'progression',
  'curriculum',
  'coherence',
  'priorities',
  'summary',
  'contributions',
  'statement',
]
const MODULE_SECTIONS = [
  'context',
  'outcomes',
  'teaching',
  'assessment',
  'reflection',
  'summary',
  'programme-priorities',
]

for (const width of [320, 1280]) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } })

    test('information pages', async ({ page }) => {
      for (const path of STATIC_PAGES) {
        await page.goto(`/#${path}`)
        await expect(page.locator('main h1').first()).toBeVisible()
        await expectNoViolations(page, path)
      }
    })

    test('every programme and module review page, using the sample', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: 'Explore sample' }).click()
      await expect(page).toHaveURL(/#\/programme\/[^/]+\/context$/)
      const programme = page.url().replace(/\/context$/, '')
      for (const s of PROGRAMME_SECTIONS) {
        await page.goto(`${programme}/${s}`)
        await expect(page.locator('main h1').first()).toBeVisible()
        await expectNoViolations(page, `programme ${s}`)
      }

      await page.goto('/#/reviews')
      await page.getByRole('button', { name: /^Open .*Sample: Introduction/ }).click()
      await expect(page).toHaveURL(/#\/module\/[^/]+\/context$/)
      const moduleUrl = page.url().replace(/\/context$/, '')
      for (const s of MODULE_SECTIONS) {
        await page.goto(`${moduleUrl}/${s}`)
        await expect(page.locator('main h1').first()).toBeVisible()
        await expectNoViolations(page, `module ${s}`)
      }
    })
  })
}

test('the import dialog has no automatically detectable problems', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/setu-v2-library.json')
  await expect(page.getByRole('dialog')).toBeVisible()
  await expectNoViolations(page, 'provenance dialog')
})

test('content reflows at 320px without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Explore sample' }).click()
  const programme = page.url().replace(/\/context$/, '')
  const paths = [
    ...STATIC_PAGES.map((p) => `/#${p}`),
    ...PROGRAMME_SECTIONS.map((s) => `${programme}/${s}`),
  ]
  for (const path of paths) {
    await page.goto(path)
    await expect(page.locator('main h1').first()).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, path).toBeLessThanOrEqual(0)
  }
})
