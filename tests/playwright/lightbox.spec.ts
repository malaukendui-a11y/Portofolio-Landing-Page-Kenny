// TC-007: lightbox keyboard flow (PRD F-08) on the certificates.
import { expect, test } from '@playwright/test'
import { certifications } from '../../content/certifications'
import en from '../../content/en'

test('certificate lightbox: arrows navigate, Tab stays inside, Esc closes and restores focus', async ({
  page,
}) => {
  await page.goto('/')
  const first = certifications[0]
  const trigger = page.getByRole('button', {
    name: en.certifications.openCertificate.replace(
      '{title}',
      en.certifications.items[first.id].title,
    ),
  })
  await trigger.scrollIntoViewIfNeeded()
  await trigger.click()

  const dialog = page.getByRole('dialog', { name: en.lightbox.label })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: en.lightbox.close })).toBeFocused()
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')

  const total = certifications.length
  const counter = (n: number) =>
    en.lightbox.counter.replace('{current}', String(n)).replace('{total}', String(total))
  await expect(dialog).toContainText(counter(1))
  await expect(dialog.getByRole('img')).toHaveAttribute('src', /cert-revou/)

  await page.keyboard.press('ArrowRight')
  await expect(dialog).toContainText(counter(2))
  await expect(dialog.getByRole('img')).toHaveAttribute('src', /cert-gunadarma-designing/)
  await page.keyboard.press('ArrowLeft')
  await expect(dialog).toContainText(counter(1))
  await page.keyboard.press('ArrowLeft')
  await expect(dialog).toContainText(counter(total))

  // Focus stays inside the modal dialog while tabbing.
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.press('Tab')
    expect(
      await page.evaluate(() => document.activeElement?.closest('dialog') !== null),
      `Tab ${i + 1} left the dialog`,
    ).toBe(true)
  }

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
  await expect(trigger).toBeFocused()
})
