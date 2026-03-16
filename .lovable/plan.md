

# Improve AI-Generated Content Quality

## Problem
The system prompt in `Editor.tsx` (lines 56-99) produces generic, AI-sounding LinkedIn posts. The instructions are too vague ("write a high-engagement post") and lack concrete anti-AI-slop guardrails.

## Solution
Rewrite the system prompt with much stronger constraints that force natural, human-sounding LinkedIn writing. Also add a `temperature` parameter to the edge function for more creative output.

### Changes

**1. Edge Function (`supabase/functions/generate-post/index.ts`)**
- Add `temperature: 1.0` to the API request body for more creative, less robotic output

**2. System Prompt Rewrite (`src/pages/Editor.tsx` — `buildSystemPrompt`)**

Replace the current generic prompt with a heavily-constrained ghostwriter prompt that includes:

- **Anti-AI rules**: No "In today's fast-paced world", no "Here's the thing", no "Let me be honest", no "Game-changer", no "Dive deep", no emoji spam, no "🚀", no corporate buzzwords
- **Voice rules**: Write like a real person texting a smart friend. Use incomplete sentences. Start sentences with "And", "But", "So". Use lowercase where it feels natural. Contractions always.
- **Structure rules per framework**:
  - Contrast: Open with the "after" result, then reveal the ugly "before"
  - Mistake: Start mid-action ("I was sitting in a meeting when...")
  - Hot Take: Lead with the spicy claim, no softening
  - Story: One specific moment, not a summary
  - List: No "Here are X things" opener — jump straight into #1
  - Deep Dive: Open with a counterintuitive fact
- **Hook rules**: Max 8 words. No questions as hooks. No "I" as first word. Pattern interrupt only.
- **Formatting**: Every line break is intentional white space. No line longer than 12 words. No paragraph longer than 2 lines. The post should feel like scrolling through punchy thoughts, not reading an essay.
- **CTA rules**: End with a specific, low-effort question (not "What do you think?" — something like "What's the worst SQL query you've ever written?")

**3. Model upgrade consideration**
- Switch to `google/gemini-2.5-pro` for higher quality output (current `gemini-3-flash-preview` prioritizes speed over quality)

### Files Modified
1. `supabase/functions/generate-post/index.ts` — add temperature
2. `src/pages/Editor.tsx` — rewrite `buildSystemPrompt` function completely

