// Hook orchestratore di Emoji Quiz (multi-choice, Trivia-like).
//
// Phase machine (uguale per local e online):
//   emojiquiz_countdown → emojiquiz_question → emojiquiz_reveal → ... → emojiquiz_final
//
// Differenze local/online:
//   - online: l'host orchestra le transizioni (setPhase), i client inviano la
//     risposta via castVote('eqRoundAnswers', { round, chosen, timeMs }).
//   - local: c'è un solo giocatore (l'host), scrive direttamente in gameState
//     senza passare per castVote. Le transizioni di fase sono identiche.
//
// gameState shape:
//   eqDeck:          [{ id, emoji, category, hint, title, answers[4], correct }]
//   eqRoundIdx:      int
//   eqRoundAnswers:  { [pid]: { round, chosen, timeMs } }   // ultima risposta del player
//   eqRoundResult:   { round, correct, points: {pid}, winnerId }
//   eqScores:        { pid: totalScore }
//   eqStreaks:       { pid: currentStreak }
//   eqCorrectCount:  { pid: count }
//   eqRoundLog:      ['win'|'lose'|'tie', ...]
//
// Phases ownership:
//   - countdown: durata gestita da CountdownOverlay.onComplete → host transita a question
//   - question:  timer 25s server-driven (questionStartedAt). Host transita a reveal su
//                "tutti hanno risposto" o "timer scaduto".
//   - reveal:    auto-advance dopo 3.2s (host); poi question successivo o final.
//   - final:     terminale; host può fare replay via index.jsx.

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSession } from '../../stores/useSession'
import { useServerTimer } from '../../hooks/useServerTimer'
import { basePoints, comboMult, round10, ROUND_MS } from './scoring'
import { TOTAL_ROUNDS } from './config'

const ROUND_DURATION_S = Math.round(ROUND_MS / 1000) // 25
const REVEAL_DELAY_MS = 3200

export const useEmojiQuiz = () => {
  const players = useSession((s) => s.players)
  const mode = useSession((s) => s.mode)
  const isHost = useSession((s) => s.isHost)
  const localPlayerId = useSession((s) => s.localPlayerId)
  const currentPhase = useSession((s) => s.currentPhase)
  const gameState = useSession((s) => s.gameState)
  const questionStartedAt = useSession((s) => s.questionStartedAt)
  const setGameState = useSession((s) => s.setGameState)
  const setPhase = useSession((s) => s.setPhase)
  const setPhaseWithTimer = useSession((s) => s.setPhaseWithTimer)
  const castVote = useSession((s) => s.castVote)

  const isOnline = mode === 'online'

  const eqDeck = useMemo(() => gameState?.eqDeck ?? [], [gameState?.eqDeck])
  const roundIdx = gameState?.eqRoundIdx ?? 0
  const eqRoundAnswers = useMemo(() => gameState?.eqRoundAnswers ?? {}, [gameState?.eqRoundAnswers])
  const eqRoundResult = gameState?.eqRoundResult ?? null
  const eqScores = useMemo(() => gameState?.eqScores ?? {}, [gameState?.eqScores])
  const eqStreaks = useMemo(() => gameState?.eqStreaks ?? {}, [gameState?.eqStreaks])
  const eqCorrectCount = useMemo(() => gameState?.eqCorrectCount ?? {}, [gameState?.eqCorrectCount])
  const eqRoundLog = useMemo(() => gameState?.eqRoundLog ?? [], [gameState?.eqRoundLog])

  const puzzle = eqDeck[roundIdx]
  const totalRounds = eqDeck.length || TOTAL_ROUNDS

  // ── Server timer (per la fase question) ──
  const timerActive = currentPhase === 'emojiquiz_question'
  const { timeLeft, isExpired } = useServerTimer(
    timerActive ? questionStartedAt : null,
    ROUND_DURATION_S,
  )

  // ── Local answer (per UX immediata: tile lockato dopo scelta) ──
  const myAnswer = eqRoundAnswers[localPlayerId]
  const localAnswer = myAnswer && myAnswer.round === roundIdx ? myAnswer.chosen : null
  const submitted = localAnswer != null

  // ── Submit della risposta del local player ──
  const submitAnswer = useCallback((chosen) => {
    if (currentPhase !== 'emojiquiz_question') return
    if (submitted) return
    const startMs = questionStartedAt ? new Date(questionStartedAt).getTime() : Date.now()
    const timeMs = Math.max(0, Date.now() - startMs)
    const payload = { round: roundIdx, chosen, timeMs }
    if (isOnline) {
      castVote('eqRoundAnswers', payload)
    } else {
      // Local: scrivi direttamente in gameState (no Realtime).
      const next = { ...(gameState?.eqRoundAnswers ?? {}), [localPlayerId]: payload }
      setGameState({ eqRoundAnswers: next })
    }
  }, [currentPhase, submitted, questionStartedAt, roundIdx, isOnline, castVote, localPlayerId, gameState, setGameState])

  // ── Countdown → Question (innescato da CountdownOverlay.onComplete) ──
  const countdownFiredRef = useRef(false)
  useEffect(() => {
    if (currentPhase !== 'emojiquiz_countdown') countdownFiredRef.current = false
  }, [currentPhase])
  const handleCountdownComplete = useCallback(() => {
    if (!isHost || countdownFiredRef.current) return
    if (currentPhase !== 'emojiquiz_countdown') return
    countdownFiredRef.current = true
    setPhaseWithTimer('emojiquiz_question')
  }, [isHost, currentPhase, setPhaseWithTimer])

  // ── Host: chiusura del round → reveal ──
  // Triggera quando: tutti hanno risposto O timer scaduto.
  const revealFiredRef = useRef(false)
  useEffect(() => {
    if (currentPhase !== 'emojiquiz_question') {
      revealFiredRef.current = false
      return
    }
    if (!isHost || revealFiredRef.current || !puzzle) return

    const validAnswers = Object.entries(eqRoundAnswers).filter(
      ([, a]) => a && a.round === roundIdx,
    )
    const allAnswered = players.length > 0 && validAnswers.length >= players.length
    const timedOut = isExpired

    if (!allAnswered && !timedOut) return
    revealFiredRef.current = true

    // Calcola punti e streak per ogni player.
    const correctIdx = puzzle.correct
    const newStreaks = { ...eqStreaks }
    const newCorrectCount = { ...eqCorrectCount }
    const points = {}
    const newScores = { ...eqScores }

    players.forEach((p) => {
      const ans = eqRoundAnswers[p.id]
      const answered = ans && ans.round === roundIdx
      const correct = answered && ans.chosen === correctIdx
      if (correct) {
        const streak = (eqStreaks[p.id] ?? 0) + 1
        newStreaks[p.id] = streak
        newCorrectCount[p.id] = (eqCorrectCount[p.id] ?? 0) + 1
        const pts = round10(basePoints(ans.timeMs) * comboMult(streak))
        points[p.id] = pts
        newScores[p.id] = (eqScores[p.id] ?? 0) + pts
      } else {
        newStreaks[p.id] = 0
        points[p.id] = 0
      }
    })

    // Winner del round = chi ha indovinato per primo (minor timeMs).
    const correctAnswerers = players
      .map((p) => ({ p, ans: eqRoundAnswers[p.id] }))
      .filter(({ ans }) => ans && ans.round === roundIdx && ans.chosen === correctIdx)
      .sort((a, b) => a.ans.timeMs - b.ans.timeMs)
    const winnerId = correctAnswerers[0]?.p.id ?? null

    // Log entry dal pdv del local player (per recap).
    const localGotIt = points[localPlayerId] > 0
    const someoneGotIt = correctAnswerers.length > 0
    const logEntry = localGotIt ? 'win' : someoneGotIt ? 'lose' : 'tie'

    setGameState({
      eqRoundResult: {
        round: roundIdx,
        correct: correctIdx,
        points,
        winnerId,
      },
      eqScores: newScores,
      eqStreaks: newStreaks,
      eqCorrectCount: newCorrectCount,
      eqRoundLog: [...eqRoundLog, logEntry],
    })
    setPhase('emojiquiz_reveal')
  }, [
    currentPhase, isHost, puzzle, eqRoundAnswers, eqStreaks, eqCorrectCount, eqScores, eqRoundLog,
    players, roundIdx, isExpired, localPlayerId, setGameState, setPhase,
  ])

  // ── Host: avanzamento dal reveal al prossimo round / final ──
  // L'host fa questo manualmente cliccando "Avanti tutta", oppure auto dopo REVEAL_DELAY_MS.
  // Per coerenza con Trivia (che è manuale) lo lasciamo manuale via hostAdvance.
  const advancingRef = useRef(false)
  useEffect(() => {
    if (currentPhase === 'emojiquiz_question') {
      advancingRef.current = false
    }
  }, [currentPhase])

  const hostAdvance = useCallback(() => {
    if (!isHost || advancingRef.current) return
    if (currentPhase !== 'emojiquiz_reveal') return
    advancingRef.current = true

    const s = useSession.getState()
    const curIdx = s.gameState?.eqRoundIdx ?? 0
    const deck = s.gameState?.eqDeck ?? []
    const nextIdx = curIdx + 1

    if (nextIdx >= deck.length) {
      // Aggiorna players[].score per coerenza con altri giochi (usato dalla scoreboard).
      const totals = s.gameState?.eqScores ?? {}
      const corrects = s.gameState?.eqCorrectCount ?? {}
      const updatedPlayers = (s.players || []).map((p) => ({
        ...p,
        score: totals[p.id] ?? 0,
        correct_count: corrects[p.id] ?? 0,
      }))
      useSession.setState({ players: updatedPlayers })
      setPhase('emojiquiz_final')
    } else {
      setGameState({
        eqRoundIdx: nextIdx,
        eqRoundAnswers: {},
        eqRoundResult: null,
      })
      setPhaseWithTimer('emojiquiz_question')
    }
  }, [isHost, currentPhase, setGameState, setPhase, setPhaseWithTimer])

  // ── Mapping currentPhase → screen name ──
  const screen = (() => {
    switch (currentPhase) {
      case 'emojiquiz_countdown': return 'countdown'
      case 'emojiquiz_question':  return 'question'
      case 'emojiquiz_reveal':    return 'reveal'
      case 'emojiquiz_final':     return 'final'
      default:                    return 'loading'
    }
  })()

  const hasMoreRounds = roundIdx + 1 < totalRounds

  return {
    // mode
    isOnline,
    isHost,
    localPlayerId,
    players,
    // session
    screen,
    puzzle,
    questionStartedAt,
    roundIdx,
    totalRounds,
    hasMoreRounds,
    timeLeft,
    timerDuration: ROUND_DURATION_S,
    isExpired,
    // local-player ephemeral
    localAnswer,
    submitted,
    // shared state
    eqRoundAnswers,
    eqRoundResult,
    eqScores,
    eqStreaks,
    eqCorrectCount,
    eqRoundLog,
    // actions
    submitAnswer,
    hostAdvance,
    handleCountdownComplete,
  }
}
