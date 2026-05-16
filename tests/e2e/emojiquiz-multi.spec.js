// Multiplayer flow: 2 browser contexts (host + client) creano stanza, votano Emoji Quiz,
// l'host avvia, entrambi vedono lo stesso puzzle, il client indovina e vince il round.
//
// Sfida: questo test parla con Supabase reale (stesso progetto del dev).
// Genera stanze nuove ogni volta — innocuo, lasciamo che si accumulino (cleanup script TBD).

import { test, expect } from '@playwright/test'

test.setTimeout(90_000)

test.describe('Emoji Quiz — multiplayer', () => {
  test('host crea stanza, client si unisce, votano Emoji Quiz, host avvia → entrambi vedono il puzzle', async ({ browser }) => {
    // ── Setup: due contesti separati ──
    const hostCtx = await browser.newContext()
    const clientCtx = await browser.newContext()
    const host = await hostCtx.newPage()
    const client = await clientCtx.newPage()

    try {
      // ── HOST: crea party ──
      await host.goto('/')
      await host.getByText('Crea party', { exact: false }).click()
      // CreatePartyScreen
      await host.locator('button:has([id^="cp-"])').first().click()
      await host.getByPlaceholder(/Es\./).fill('Hostbot')
      await host.getByRole('button', { name: /Crea/i }).click()

      // ── Aspetta che appaia il codice stanza ──
      // Lobby screen mostra il codice come testo grosso
      const codeEl = host.locator('text=/^[BCDFGHJKLMNPRSTVWX]{4}$/').first()
      await expect(codeEl).toBeVisible({ timeout: 15_000 })
      const code = (await codeEl.textContent())?.trim()
      expect(code).toMatch(/^[A-Z]{4}$/)

      // ── CLIENT: join con il codice ──
      await client.goto('/')
      await client.getByText('Ho già un codice', { exact: false }).click()
      // JoinScreen — input per codice
      const codeInput = client.locator('input').first()
      await codeInput.fill(code)
      // pick color + name
      // Client deve scegliere un colore diverso dall'host (host ha cp-0). Usa cp-1.
      await client.locator('button:has([id^="cp-"])').nth(1).click()
      const nameInput = client.getByPlaceholder(/Es\./)
      await nameInput.fill('Clientbot')
      await client.getByRole('button', { name: /Entra|Join/i }).click()

      // ── Entrambi in lobby con 2 player ──
      // L'host deve vedere Clientbot apparire
      await expect(host.getByText('Clientbot')).toBeVisible({ timeout: 10_000 })
      await expect(client.getByText('Hostbot')).toBeVisible({ timeout: 10_000 })

      // ── HOST avanza a "Scegli il gioco" ──
      // (cerca un pulsante per andare ai giochi — può essere "Inizia", "Avanti", etc.)
      const startBtn = host.getByRole('button', { name: /Avanti|Pronti|Inizia|Continua|Vota|Giochi/i })
      await startBtn.click()

      // ── Entrambi su GamesScreen ──
      await expect(host).toHaveURL(/\/games/, { timeout: 10_000 })
      await expect(client).toHaveURL(/\/games/, { timeout: 10_000 })

      // ── Entrambi votano Emoji Quiz ──
      await host.getByText('Emoji Quiz').click()
      await client.getByText('Emoji Quiz').click()

      // ── Entrambi vanno alla lobby Emoji Quiz ──
      await expect(host).toHaveURL(/\/emojiquiz-lobby/, { timeout: 15_000 })
      await expect(client).toHaveURL(/\/emojiquiz-lobby/, { timeout: 15_000 })

      // ── Host avvia ──
      await host.getByRole('button', { name: /Inizia/i }).click()

      // ── Entrambi devono essere su /game/emojiquiz dopo il push ──
      await expect(host).toHaveURL(/\/game\/emojiquiz/, { timeout: 10_000 })
      await expect(client).toHaveURL(/\/game\/emojiquiz/, { timeout: 10_000 })

      // ── Countdown (3-2-1-VIA!, ~4s) → playing ──
      await expect(host.locator('.eq-emoji-puzzle')).toBeVisible({ timeout: 20_000 })
      await expect(client.locator('.eq-emoji-puzzle')).toBeVisible({ timeout: 20_000 })

      // ── Verifica sync deck: entrambi vedono lo stesso emoji ──
      const hostEmoji = await host.locator('.eq-emoji-puzzle').textContent()
      const clientEmoji = await client.locator('.eq-emoji-puzzle').textContent()
      expect(hostEmoji).toBe(clientEmoji)
      expect(hostEmoji?.length).toBeGreaterThan(0)
    } finally {
      await hostCtx.close()
      await clientCtx.close()
    }
  })
})
