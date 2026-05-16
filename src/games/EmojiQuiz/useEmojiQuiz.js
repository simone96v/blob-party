// Hook orchestratore di Emoji Quiz (multi-round + ruota categorie, stile Trivia).
//
// Sessione (gameState.eqSession):
//   { roundIdx, totalRounds, questionsPerRound, categoriesPlayed, currentCategory,
//     spinTarget, launching }
//
// Deck per round (gameState.eqDeck): viene caricato dall'host dopo lo spin della ruota.
// Punteggi cumulativi (gameState.eqScores / eqCorrectCount) → mai resettati fra round.
//
// Phase machine:
//   emojiquiz_lobby → emojiquiz_countdown → emojiquiz_question → emojiquiz_reveal
//   → ... → emojiquiz_final (intermedio se più round, altrimenti game-end)
//
// Local mode: stesso flusso ma scrive direttamente in gameState (no Realtime).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from '../../stores/useSession'
import { useServerTimer } from '../../hooks/useServerTimer'
import { isCorrect } from './matching'
import { basePoints, comboMult, round10, ROUND_MS } from './scoring'

const ROUND_DURATION_S = Math.round(ROUND_MS / 1000) // 25

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

  const session = gameState?.eqSession ?? null
  const roundIdx = session?.roundIdx ?? 0
  const totalRounds = session?.totalRounds ?? 1
  const questionsPerRound = session?.questionsPerRound ?? 7
  const currentCategory = session?.currentCategory ?? 'tutte'
  const hasMoreRounds = roundIdx + 1 < totalRounds

  const eqDeck = useMemo(() => gameState?.eqDeck ?? [], [gameState?.eqDeck])
  const questionIdx = gameState?.eqRoundIdx ?? 0
  const totalQuestionsThisRound = eqDeck.length || questionsPerRound

  const eqRoundAnswers = useMemo(() => gameState?.eqRoundAnswers ?? {}, [gameState?.eqRoundAnswers])
  const eqHintUsed = useMemo(() => gameState?.eqHintUsed ?? {}, [gameState?.eqHintUsed])
  const eqRoundResult = gameState?.eqRoundResult ?? null
  const eqScores = useMemo(() => gameState?.eqScores ?? {}, [gameState?.eqScores])
  const eqStreaks = useMemo(() => gameState?.eqStreaks ?? {}, [gameState?.eqStreaks])
  const eqCorrectCount = useMemo(() => gameState?.eqCorrectCount ?? {}, [gameState?.eqCorrectCount])
  const eqRoundLog = useMemo(() => gameState?.eqRoundLog ?? [], [gameState?.eqRoundLog])

  const puzzle = eqDeck[questionIdx]

  // ── Server timer ──
  const timerActive = currentPhase === 'emojiquiz_question'
  const { timeLeft, isExpired } = useServerTimer(
    timerActive ? questionStartedAt : null,
    ROUND_DURATION_S,
  )

  // ── Local UI state ──
  const [guess, setGuess] = useState('')
  const [wrongFlash, setWrongFlash] = useState(false)
  const inputRef = useRef(null)
  const inputWrapRef = useRef(null)

  useEffect(() => {
    setGuess('')
    setWrongFlash(false)
  }, [questionIdx, currentPhase])

  const myAnswer = eqRoundAnswers[localPlayerId]
  const submitted = !!(myAnswer && myAnswer.round === questionIdx)
  const myHint = eqHintUsed[localPlayerId]
  const hintUsed = !!(myHint && myHint.round === questionIdx)

  // ── Submit guess ──
  const submitAnswer = useCallback(() => {
    if (currentPhase !== 'emojiquiz_question') return
    if (submitted || !puzzle) return
    if (!guess.trim()) return
    if (isCorrect(guess, puzzle)) {
      const startMs = questionStartedAt ? new Date(questionStartedAt).getTime() : Date.now()
      const timeMs = Math.max(0, Date.now() - startMs)
      const payload = { round: questionIdx, timeMs, hintUsed }
      if (isOnline) {
        castVote('eqRoundAnswers', payload)
      } else {
        const next = { ...(gameState?.eqRoundAnswers ?? {}), [localPlayerId]: payload }
        setGameState({ eqRoundAnswers: next })
      }
    } else {
      setWrongFlash(true)
      setTimeout(() => setWrongFlash(false), 380)
      inputWrapRef.current?.animate?.(
        [
          { transform: 'translateX(0)' }, { transform: 'translateX(-9px)' },
          { transform: 'translateX(9px)' }, { transform: 'translateX(-6px)' },
          { transform: 'translateX(6px)' }, { transform: 'translateX(0)' },
        ],
        { duration: 380, easing: 'ease-in-out' },
      )
      setGuess('')
      inputRef.current?.focus()
    }
  }, [
    currentPhase, submitted, puzzle, guess, questionStartedAt, questionIdx,
    hintUsed, isOnline, castVote, localPlayerId, gameState, setGameState,
  ])

  // ── Hint ──
  const useHint = useCallback(() => {
    if (currentPhase !== 'emojiquiz_question') return
    if (submitted || hintUsed) return
    const payload = { round: questionIdx, used: true }
    if (isOnline) {
      castVote('eqHintUsed', payload)
    } else {
      const next = { ...(gameState?.eqHintUsed ?? {}), [localPlayerId]: payload }
      setGameState({ eqHintUsed: next })
    }
  }, [currentPhase, submitted, hintUsed, questionIdx, isOnline, castVote, localPlayerId, gameState, setGameState])

  // ── Countdown → Question ──
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

  // ── Host: chiusura della singola domanda → reveal ──
  const revealFiredRef = useRef(false)
  useEffect(() => {
    if (currentPhase !== 'emojiquiz_question') {
      revealFiredRef.current = false
      return
    }
    if (!isHost || revealFiredRef.current || !puzzle) return

    const valid = Object.entries(eqRoundAnswers).filter(
      ([, a]) => a && a.round === questionIdx,
    )
    const allAnswered = players.length > 0 && valid.length >= players.length
    const timedOut = isExpired
    if (!allAnswered && !timedOut) return
    revealFiredRef.current = true

    const sorted = valid
      .map(([pid, a]) => ({ pid, a }))
      .sort((x, y) => x.a.timeMs - y.a.timeMs)
    const winnerId = sorted[0]?.pid ?? null

    const newStreaks = { ...eqStreaks }
    const newCorrectCount = { ...eqCorrectCount }
    const newScores = { ...eqScores }
    const points = {}
    players.forEach((p) => {
      const ans = eqRoundAnswers[p.id]
      const got = ans && ans.round === questionIdx
      if (got) {
        const streak = (eqStreaks[p.id] ?? 0) + 1
        const pts = round10(basePoints(ans.timeMs, !!ans.hintUsed) * comboMult(streak))
        newStreaks[p.id] = streak
        newCorrectCount[p.id] = (eqCorrectCount[p.id] ?? 0) + 1
        newScores[p.id] = (eqScores[p.id] ?? 0) + pts
        points[p.id] = pts
      } else {
        newStreaks[p.id] = 0
        points[p.id] = 0
      }
    })

    const winnerName = winnerId ? players.find((p) => p.id === winnerId)?.name : null
    const localGot = !!points[localPlayerId]
    const someoneGot = sorted.length > 0
    const logEntry = localGot ? 'win' : someoneGot ? 'lose' : 'tie'

    setGameState({
      eqRoundResult: {
        round: questionIdx,
        winnerId,
        winnerName,
        points,
        title: puzzle.title,
        emoji: puzzle.emoji,
        category: puzzle.category,
      },
      eqScores: newScores,
      eqStreaks: newStreaks,
      eqCorrectCount: newCorrectCount,
      eqRoundLog: [...eqRoundLog, logEntry],
    })
    setPhase('emojiquiz_reveal')
  }, [
    currentPhase, isHost, puzzle, eqRoundAnswers, eqStreaks, eqCorrectCount, eqScores, eqRoundLog,
    players, questionIdx, isExpired, localPlayerId, setGameState, setPhase,
  ])

  // ── Host: advance da reveal → prossima domanda / fine round ──
  const advancingRef = useRef(false)
  useEffect(() => {
    if (currentPhase === 'emojiquiz_question') advancingRef.current = false
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
      // Fine round corrente. Aggiorna players[].score per la classifica.
      const totals = s.gameState?.eqScores ?? {}
      const corrects = s.gameState?.eqCorrectCount ?? {}
      const updatedPlayers = (s.players || []).map((p) => ({
        ...p,
        score: totals[p.id] ?? 0,
        correct_count: corrects[p.id] ?? 0,
      }))
      useSession.setState({ players: updatedPlayers })
      // Vai a final (intermediario o game-end, lo decide FinalPhase via session)
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

  // ── Host: avanza al prossimo round (dal final intermedio) → torna in lobby ──
  const nextRoundFiredRef = useRef(false)
  useEffect(() => {
    if (currentPhase !== 'emojiquiz_final') nextRoundFiredRef.current = false
  }, [currentPhase])

  const hostNextRound = useCallback(() => {
    if (!isHost || nextRoundFiredRef.current) return
    if (currentPhase !== 'emojiquiz_final') return
    if (!hasMoreRounds) return
    nextRoundFiredRef.current = true

    const s = useSession.getState()
    const newSession = {
      ...(s.gameState?.eqSession ?? {}),
      roundIdx: roundIdx + 1,
      currentCategory: null,
      spinTarget: null,
      launching: false,
    }
    setGameState({
      eqSession: newSession,
      // Reset deck + per-round state per il nuovo round (le sessions persistono).
      eqDeck: [],
      eqRoundIdx: 0,
      eqRoundAnswers: {},
      eqHintUsed: {},
      eqRoundResult: null,
      eqRoundLog: [],
      eqStreaks: {}, // reset streak fra round (Trivia fa lo stesso)
    })
    setPhase('emojiquiz_lobby')
  }, [isHost, currentPhase, hasMoreRounds, roundIdx, setGameState, setPhase])

  // ── Screen ──
  const screen = (() => {
    switch (currentPhase) {
      case 'emojiquiz_countdown': return 'countdown'
      case 'emojiquiz_question':  return 'question'
      case 'emojiquiz_reveal':    return 'reveal'
      case 'emojiquiz_final':     return 'final'
      default:                    return 'loading'
    }
  })()

  return {
    isOnline,
    isHost,
    localPlayerId,
    players,
    screen,
    puzzle,
    questionStartedAt,
    // round = numero della domanda dentro al round corrente
    roundIdx: questionIdx,
    totalRounds: totalQuestionsThisRound,
    hasMoreRounds: questionIdx + 1 < totalQuestionsThisRound,
    // session = numero del round (= spin della ruota) dentro alla partita
    sessionRoundIdx: roundIdx,
    sessionTotalRounds: totalRounds,
    sessionHasMoreRounds: hasMoreRounds,
    questionsPerRound,
    currentCategory,
    timeLeft,
    timerDuration: ROUND_DURATION_S,
    isExpired,
    guess,
    setGuess,
    wrongFlash,
    submitted,
    hintUsed,
    inputRef,
    inputWrapRef,
    eqRoundAnswers,
    eqRoundResult,
    eqScores,
    eqCorrectCount,
    eqRoundLog,
    submitAnswer,
    useHint,
    hostAdvance,
    hostNextRound,
    handleCountdownComplete,
  }
}
