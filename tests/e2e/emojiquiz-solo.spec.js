// Solo flow (multi-round + wheel):
// home → solo setup → games list → emoji quiz lobby → SPIN → countdown → question.

import { test, expect } from '@playwright/test'

test.describe('Emoji Quiz — single-player', () => {
  test('lobby con ruota, dopo spin atterra su question phase con input + hint', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Gioca da solo', { exact: false }).click()

    await page.locator('button:has([id^="cp-"])').first().click()
    await page.getByPlaceholder(/Es\./).fill('Testbot')
    await page.getByRole('button', { name: /Scegli il gioco/i }).click()

    await expect(page).toHaveURL(/\/solo\/games/)
    await page.getByText('Emoji Quiz').click()

    // Lobby con ruota + steppers
    await expect(page).toHaveURL(/\/emojiquiz-lobby/)
    await expect(page.getByText('Round', { exact: true })).toBeVisible()
    await expect(page.getByText('Domande', { exact: true })).toBeVisible()

    // Spin della ruota (~4s + 2s celebrazione → onSpinEnd)
    await page.getByRole('button', { name: /SPIN/i }).click()

    // Game route + countdown + question
    await expect(page).toHaveURL(/\/game\/emojiquiz/, { timeout: 15_000 })
    await expect(page.locator('[aria-label*="Difficoltà"]')).toBeVisible({ timeout: 25_000 })

    const input = page.getByPlaceholder(/Scrivi il titolo/i)
    await expect(input).toBeVisible()
    await expect(page.getByRole('button', { name: /^Indovina$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Usa un indizio/i })).toBeVisible()

    // Hint button
    await page.getByRole('button', { name: /Usa un indizio/i }).click()
    await expect(page.getByRole('button', { name: /Indizio usato/i })).toBeVisible({ timeout: 3_000 })

    // Wrong guess clears input
    await input.fill('xxxxxxx')
    await page.getByRole('button', { name: /^Indovina$/ }).click()
    await expect(input).toHaveValue('')
  })
})
