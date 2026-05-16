// Solo single-player flow: home → solo setup → games list → Emoji Quiz → Home → Playing.
// Verifica che il gioco si renderizzi correttamente e che la UI reagisca all'input.
// Non tenta di indovinare un puzzle (richiederebbe controllo deterministico del deck).

import { test, expect } from '@playwright/test'

test.describe('Emoji Quiz — single-player', () => {
  test('compare in lista giochi solo, lanciabile end-to-end', async ({ page }) => {
    // ── Home → Solo
    await page.goto('/')
    await page.getByText('Gioca da solo', { exact: false }).click()

    // ── Solo setup: nome + colore
    await expect(page.getByText('Gioca da solo')).toBeVisible()
    // ColorPicker — buttons contengono MiniBlob con id cp-0..cp-7
    await page.locator('button:has([id^="cp-"])').first().click()
    await page.getByPlaceholder(/Es\./).fill('Testbot')

    // Sumbit
    await page.getByRole('button', { name: /Scegli il gioco/i }).click()

    // ── Lista giochi solo
    await expect(page).toHaveURL(/\/solo\/games/)
    // Emoji Quiz deve apparire
    await expect(page.getByText('Emoji Quiz')).toBeVisible()

    // ── Click Emoji Quiz
    await page.getByText('Emoji Quiz').click()

    // ── Home screen del gioco (mode === local salta la lobby)
    await expect(page).toHaveURL(/\/game\/emojiquiz/)
    await expect(page.locator('.eq-title')).toContainText('Emoji')
    await expect(page.getByText('Inizia la sfida')).toBeVisible()

    // ── Start
    await page.getByText('Inizia la sfida').click()

    // ── Playing screen
    await expect(page.locator('.eq-emoji-puzzle')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.eq-timer-track')).toBeVisible()
    await expect(page.locator('.eq-round-tag')).toContainText(/ROUND 1/)

    // Input funzionante
    const input = page.locator('.eq-guess-input')
    await input.fill('test guess')
    await expect(input).toHaveValue('test guess')

    // Submit con risposta sbagliata → flash rosso
    await page.locator('.eq-guess-btn').click()
    await expect(page.locator('.eq-input-wrap.wrong')).toBeVisible({ timeout: 1000 })

    // Indizio
    await page.getByText(/Usa un indizio/).click()
    await expect(page.locator('.eq-hint-box')).toBeVisible()
  })
})
