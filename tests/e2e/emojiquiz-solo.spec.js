// Solo flow (multi-choice, Trivia-style UI):
// home → solo setup → games list → emoji quiz lobby → Inizia → countdown → question.

import { test, expect } from '@playwright/test'

test.describe('Emoji Quiz — single-player', () => {
  test('compare in lista solo, lobby parte, atterra su question phase con 4 risposte', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Gioca da solo', { exact: false }).click()

    // Setup solo
    await page.locator('button:has([id^="cp-"])').first().click()
    await page.getByPlaceholder(/Es\./).fill('Testbot')
    await page.getByRole('button', { name: /Scegli il gioco/i }).click()

    // Lista giochi → Emoji Quiz
    await expect(page).toHaveURL(/\/solo\/games/)
    await page.getByText('Emoji Quiz').click()

    // Lobby Emoji Quiz
    await expect(page).toHaveURL(/\/emojiquiz-lobby/)
    await page.getByRole('button', { name: /Inizia/i }).click()

    // Game route + countdown → question (~4s di countdown)
    await expect(page).toHaveURL(/\/game\/emojiquiz/, { timeout: 10_000 })

    // Question phase: difficulty marker dell'EmojiQuizCard
    await expect(page.locator('[aria-label*="Difficoltà"]')).toBeVisible({ timeout: 20_000 })

    // 4 tile risposta = 4 button cliccabili nella griglia.
    // Sono dentro al body della question phase. Ne aspettiamo almeno 4 visibili
    // (oltre al back button, ce ne sono altri: confirm appare DOPO la selezione).
    // Strategy: i tile risposta hanno role="button" e contengono testo lungo.
    const answerTiles = page.locator('button').filter({ has: page.locator('span').filter({ hasText: /^[A-D]$/ }) })
    await expect(answerTiles).toHaveCount(4)

    // Clicca il primo tile (A) → bottone Conferma compare
    await answerTiles.first().click()
    await expect(page.getByRole('button', { name: /Conferma/i })).toBeVisible()

    // Conferma → in solo, l'host effect avanza subito al reveal (1/1 risposto).
    // Quindi NON aspettiamo "Bloccata!" (transitorio); aspettiamo invece il
    // bottone di reveal "Avanti tutta!" o "Chi ha vinto?!".
    await page.getByRole('button', { name: /Conferma/i }).click()
    await expect(page.getByRole('button', { name: /Avanti tutta|Chi ha vinto/i })).toBeVisible({ timeout: 5_000 })
  })
})
