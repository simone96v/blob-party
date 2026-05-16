// Multiplayer flow (wheel-driven):
// 2 browser contexts → create+join party → vote → host spin → entrambi atterrano su question.

import { test, expect } from '@playwright/test'

test.setTimeout(120_000)

test.describe('Emoji Quiz — multiplayer', () => {
  test('host + client votano, lo spinner gira la ruota, entrambi vedono lo stesso puzzle', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const clientCtx = await browser.newContext()
    const host = await hostCtx.newPage()
    const client = await clientCtx.newPage()

    try {
      // HOST crea party
      await host.goto('/')
      await host.getByText('Crea party', { exact: false }).click()
      await host.locator('button:has([id^="cp-"])').first().click()
      await host.getByPlaceholder(/Es\./).fill('Hostbot')
      await host.getByRole('button', { name: /Crea/i }).click()

      const codeEl = host.locator('text=/^[BCDFGHJKLMNPRSTVWX]{4}$/').first()
      await expect(codeEl).toBeVisible({ timeout: 15_000 })
      const code = (await codeEl.textContent())?.trim()

      // CLIENT join
      await client.goto('/')
      await client.getByText('Ho già un codice', { exact: false }).click()
      await client.locator('input').first().fill(code)
      await client.locator('button:has([id^="cp-"])').nth(1).click()
      await client.getByPlaceholder(/Es\./).fill('Clientbot')
      await client.getByRole('button', { name: /Entra|Join/i }).click()

      await expect(host.getByText('Clientbot')).toBeVisible({ timeout: 10_000 })
      await expect(client.getByText('Hostbot')).toBeVisible({ timeout: 10_000 })

      // Avanzamento ai giochi
      await host.getByRole('button', { name: /Avanti|Pronti|Inizia|Continua|Vota|Giochi/i }).click()
      await expect(host).toHaveURL(/\/games/, { timeout: 10_000 })
      await expect(client).toHaveURL(/\/games/, { timeout: 10_000 })

      await host.getByText('Emoji Quiz').click()
      await client.getByText('Emoji Quiz').click()

      // Lobby con ruota
      await expect(host).toHaveURL(/\/emojiquiz-lobby/, { timeout: 15_000 })
      await expect(client).toHaveURL(/\/emojiquiz-lobby/, { timeout: 15_000 })

      // Spinner deterministico — aspetto che il bottone SPIN appaia su una delle due.
      const spinBtnHost = host.getByRole('button', { name: /SPIN/i })
      const spinBtnClient = client.getByRole('button', { name: /SPIN/i })
      // Race per individuare lo spinner. Almeno uno dei due deve avere il bottone.
      await Promise.race([
        spinBtnHost.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {}),
        spinBtnClient.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {}),
      ])
      const hostHasSpin = await spinBtnHost.isVisible().catch(() => false)
      const spinner = hostHasSpin ? host : client
      await spinner.getByRole('button', { name: /SPIN/i }).click()

      // Wheel anima ~4s + celebrazione ~2s → onSpinEnd → deck load → push countdown.
      // Margini generosi.
      await expect(host).toHaveURL(/\/game\/emojiquiz/, { timeout: 30_000 })
      await expect(client).toHaveURL(/\/game\/emojiquiz/, { timeout: 30_000 })

      // Question phase su entrambi
      await expect(host.locator('[aria-label*="Difficoltà"]')).toBeVisible({ timeout: 30_000 })
      await expect(client.locator('[aria-label*="Difficoltà"]')).toBeVisible({ timeout: 30_000 })
      await expect(host.getByPlaceholder(/Scrivi il titolo/i)).toBeVisible()
      await expect(client.getByPlaceholder(/Scrivi il titolo/i)).toBeVisible()

      // Sync deck: il difficulty marker contiene l'emoji puzzle nello stesso card.
      // Estraggo il textContent del card-area di entrambi e li comparo.
      const hostCard = await host.locator('[aria-label*="Difficoltà"]').first().locator('xpath=ancestor::*[1]/..').textContent()
      const clientCard = await client.locator('[aria-label*="Difficoltà"]').first().locator('xpath=ancestor::*[1]/..').textContent()
      expect(hostCard).toBeTruthy()
      expect(clientCard).toBe(hostCard)
    } finally {
      await hostCtx.close()
      await clientCtx.close()
    }
  })
})
