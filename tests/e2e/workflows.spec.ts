/** End-to-end checks of behaviour that unit tests cannot see: dialogs, warnings, downloads. */
import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

const fixture = (name: string) => `tests/fixtures/${name}`
const SETU = 'South East Technological University'

async function importFile(page: Page, name: string) {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles(fixture(name))
}

test.describe('importing a review with no institution name', () => {
  test('asks, with "leave blank" as the default, and Escape cancels the import', async ({
    page,
  }) => {
    await importFile(page, 'setu-v2-module.json')
    const dialog = page.getByRole('dialog', { name: 'Institution name for this review' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('does not identify its originating edition')
    await expect(dialog.getByRole('button', { name: 'Leave Institution Name blank' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('status')).toContainText('Import cancelled. Nothing was changed.')
    await expect(page.getByRole('link', { name: 'Saved reviews (0)' })).toBeVisible()
  })

  test('sets the SETU name only when the user says so, and it stays editable', async ({ page }) => {
    await importFile(page, 'setu-v2-module.json')
    await page.getByRole('button', { name: `Set Institution Name to “${SETU}”` }).click()
    await expect(page).toHaveURL(/#\/module\/.+\/context$/)
    const field = page.getByLabel('Institution name (optional)')
    await expect(field).toHaveValue(SETU)
    await field.fill('')
    await expect(field).toHaveValue('')
  })

  test('decides each review in a bundle separately', async ({ page }) => {
    await importFile(page, 'setu-v2-library.json')
    const dialog = page.getByRole('dialog')
    const boxes = dialog.getByRole('checkbox')
    await expect(boxes).toHaveCount(4)
    for (const box of await boxes.all()) await expect(box).not.toBeChecked()
    await boxes.nth(0).check()
    await dialog.getByRole('button', { name: 'Import (1 named)' }).click()
    await expect(page.getByRole('status')).toContainText(
      `Institution Name was set to ${SETU} on 1 review`,
    )
  })

  test('brings in a v1 file with the SETU name, without asking', async ({ page }) => {
    await importFile(page, 'setu-v1-review.json')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('status')).toContainText(`Institution Name has been set to ${SETU}`)
  })
})

test.describe('when browser storage is full', () => {
  test.beforeEach(async ({ page }) => {
    // Lets the test switch on quota errors for review writes, as a full browser would raise.
    await page.addInitScript(() => {
      const setItem = Storage.prototype.setItem
      Storage.prototype.setItem = function (key: string, value: string) {
        if ((window as unknown as { __full?: boolean }).__full && key.startsWith('genain3-air:v2:'))
          throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
        return setItem.call(this, key, value)
      }
    })
  })

  test('keeps the change, warns, never says "Saved", and exports the latest work', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Module Review' }).click()
    await page.getByLabel('Module title').fill('Saved title')
    await expect(page.getByText('Saved in this browser')).toBeVisible()

    await page.evaluate(() => ((window as unknown as { __full: boolean }).__full = true))
    await page.getByLabel('Module title').fill('Unsaved title')
    const alert = page.getByRole('alert').filter({ hasText: 'have not been saved' })
    await expect(alert).toContainText('storage for the site is full')
    await expect(page.getByText('Saved in this browser')).toHaveCount(0)
    await expect(page.getByLabel('Module title')).toHaveValue('Unsaved title')

    const download = page.waitForEvent('download')
    await alert.getByRole('button', { name: 'Export this review' }).click()
    const file = await (await download).path()
    expect(JSON.parse(readFileSync(file, 'utf8')).title).toBe('Unsaved title')

    // Once there is room again, the next change saves and the warning goes.
    await page.evaluate(() => ((window as unknown as { __full: boolean }).__full = false))
    await page.getByLabel('Module title').fill('Saved again')
    await expect(alert).toHaveCount(0)
    await expect(page.getByText('Saved in this browser')).toBeVisible()
  })
})

test.describe('identity and navigation', () => {
  test('footer shows the version and links, and feedback carries only the version', async ({
    page,
  }) => {
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    await expect(footer).toContainText('AI Integration Review · A GenAI:N3 resource · v')
    const feedback = footer.getByRole('link', { name: 'Feedback / Report an issue' })
    const href = (await feedback.getAttribute('href'))!
    expect(href).toMatch(/^mailto:air@genain3\.ie\?subject=/)
    expect(decodeURIComponent(href)).toMatch(
      /subject=AI Integration Review feedback — v\d+\.\d+\.\d+(-[\w.]+)?$/,
    )
    for (const name of ['About', 'Privacy and data storage', 'Licensing'])
      await expect(footer.getByRole('link', { name })).toBeVisible()
    await footer.getByRole('link', { name: 'About' }).click()
    await expect(
      page.getByText(
        'Created by Dr Hazel Farrell in collaboration with Ken McCarthy, with support from ChatGPT and Claude Code.',
      ),
    ).toBeVisible()
  })

  test('the page title and visible branding are the public edition', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('AI Integration Review — A GenAI:N3 resource')
    await expect(page.locator('body')).not.toContainText('SETU')
    await expect(page.locator('body')).not.toContainText('Classic')
  })

  test('on a phone, the menu opens with focus inside and closes with Escape', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/')
    const button = page.getByRole('button', { name: 'Open menu' })
    await expect(button).toHaveAttribute('aria-expanded', 'false')
    // While closed, the off-screen menu cannot be reached with Tab.
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden()
    await button.click()
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
    await expect(page.locator('#main-menu :focus')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(button).toBeFocused()
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden()
  })

  test('the skip link moves focus to the main content', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Skip to content' })
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main')).toBeFocused()
  })
})

test.describe('Programme AI Integration Statement', () => {
  test('prints the institution name above the programme title only when entered', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Explore sample' }).click()
    const programme = page.url().replace(/\/context$/, '')
    await page.goto(`${programme}/statement`)
    await page.emulateMedia({ media: 'print' })
    const printed = page.locator('article.print\\:block header')
    await expect(printed.locator('p.font-medium')).toHaveCount(0)

    await page.emulateMedia({ media: 'screen' })
    await page.goto(`${programme}/context`)
    await page.getByLabel('Institution name (optional)').fill('Example University')
    await page.goto(`${programme}/statement`)
    await page.emulateMedia({ media: 'print' })
    await expect(printed.locator('p.font-medium')).toHaveText('Example University')
    const order = await printed.evaluate((h) => [...h.children].map((c) => c.tagName))
    expect(order.indexOf('P', 1)).toBeLessThan(order.indexOf('H1'))
    await expect(page.locator('article.print\\:block section').first()).not.toContainText(
      'Example University',
    )
  })
})

test('makes no requests to any other website', async ({ page }) => {
  const external: string[] = []
  page.on('request', (r) => {
    const url = new URL(r.url())
    if (!['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol !== 'data:')
      external.push(r.url())
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Explore sample' }).click()
  const programme = page.url().replace(/\/context$/, '')
  for (const s of ['progression', 'summary', 'statement']) await page.goto(`${programme}/${s}`)
  for (const p of ['/about', '/privacy', '/licensing', '/help']) await page.goto(`/#${p}`)
  expect(external).toEqual([])
})

test('a module review can be completed with the keyboard alone', async ({ page }) => {
  await page.goto('/')
  const tabTo = async (name: RegExp | string) => {
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab')
      const focused = page.locator(':focus')
      if ((await focused.count()) && (await focused.innerText().catch(() => '')).match(name)) return
    }
    throw new Error(`Could not reach ${name} with Tab`)
  }
  await tabTo(/^Start Module Review$/)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/module\/.+\/context$/)
  await page.getByLabel('Module title').focus()
  await page.keyboard.type('Keyboard Module')
  await tabTo(/Assessment$/)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/assessment$/)
  await tabTo(/Add an assessment/)
  await page.keyboard.press('Enter')
  await page.getByLabel('Assessment title').focus()
  await page.keyboard.type('Essay')
  // The first answer option of question 1, then the arrow keys to move between options.
  await page.getByRole('group', { name: /^1\./ }).getByRole('radio').first().focus()
  await page.keyboard.press('Space')
  await page.keyboard.press('ArrowDown')
  const radios = page.getByRole('group', { name: /^1\./ }).getByRole('radio')
  await expect(radios.nth(1)).toBeChecked()
  await expect(page.getByText('Saved in this browser')).toBeVisible()
})

// Keep in step with docs/deployment.md.
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'"

test('works under the recommended Content-Security-Policy', async ({ page }) => {
  await page.route('**/*', async (route) => {
    const response = await route.fetch()
    await route.fulfill({
      response,
      headers: { ...response.headers(), 'content-security-policy': CSP },
    })
  })
  await page.addInitScript(() => {
    ;(window as unknown as { __csp: string[] }).__csp = []
    document.addEventListener('securitypolicyviolation', (e) =>
      (window as unknown as { __csp: string[] }).__csp.push(
        `${e.violatedDirective} ${e.blockedURI}`,
      ),
    )
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Explore sample' }).click()
  const programme = page.url().replace(/\/context$/, '')
  for (const s of ['progression', 'summary', 'statement', 'contributions']) {
    await page.goto(`${programme}/${s}`)
    await expect(page.locator('main h1').first()).toBeVisible()
  }
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/setu-v2-library.json')
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)).toEqual([])
})
