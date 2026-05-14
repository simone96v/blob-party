#!/usr/bin/env node
// Merge: unisce le domande esistenti con quelle nuove generate per categoria.
// Uso: node scripts/merge-questions.mjs
// Cerca file .json in scripts/generated/ e li unisce al pool esistente.

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = join(__dirname, '..', 'src', 'data', 'questions', 'trivia.json')
const GEN_DIR = join(__dirname, 'generated')

// Carica pool esistente
let existing = []
try {
  const raw = readFileSync(OUT_PATH, 'utf-8').replace(/^﻿/, '')
  existing = JSON.parse(raw)
  console.log(`📂 Pool esistente: ${existing.length} domande`)
} catch (err) {
  console.log('📂 Nessun pool esistente:', err.message)
}

// Carica tutte le domande generate
const genFiles = readdirSync(GEN_DIR).filter(f => f.endsWith('.json'))
console.log(`📁 File generati: ${genFiles.length}`)

let newQuestions = []
for (const f of genFiles) {
  const qs = JSON.parse(readFileSync(join(GEN_DIR, f), 'utf-8'))
  console.log(`  ${f}: ${qs.length} domande`)
  newQuestions.push(...qs)
}

// Merge: prima esistenti, poi nuove — deduplicando per question text
const seen = new Set()
const merged = []

for (const q of [...existing, ...newQuestions]) {
  const key = q.question.toLowerCase().trim()
  if (seen.has(key)) continue
  seen.add(key)
  merged.push(q)
}

// Re-numera gli ID per categoria
const byCat = {}
merged.forEach(q => {
  if (!byCat[q.category]) byCat[q.category] = []
  byCat[q.category].push(q)
})

const final = []
for (const [cat, qs] of Object.entries(byCat)) {
  const prefix = cat.slice(0, 3)
  qs.forEach((q, i) => {
    q.id = `${prefix}_${String(i + 1).padStart(3, '0')}`
    final.push(q)
  })
}

// Ordina per categoria
const catOrder = ['geografia','storia','sport','musica','cinema','cucina','scienza','arte','attualita','curiosita']
final.sort((a, b) => catOrder.indexOf(a.category) - catOrder.indexOf(b.category))

mkdirSync(dirname(OUT_PATH), { recursive: true })
writeFileSync(OUT_PATH, JSON.stringify(final, null, 2), 'utf-8')

console.log(`\n✅ Totale: ${final.length} domande`)
const report = {}
final.forEach(q => { report[q.category] = (report[q.category] || 0) + 1 })
for (const [cat, count] of Object.entries(report)) {
  console.log(`  ${cat.padEnd(12)} ${count}`)
}
