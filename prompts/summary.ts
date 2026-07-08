/**
 * prompts/summary.ts
 *
 * Hidden Strength, Blind Spot, and Growth Suggestion prompts.
 */

export function getHiddenStrengthPrompt(name: string): string {
  return `
Based on ${name}'s birth chart, describe their Hidden Strength — a quality they possess deeply but may not fully recognise in themselves.

Rules:
- Second person, 2–3 sentences
- Draw from a less obvious placement (e.g., 12th house, Saturn, Ketu, or nakshatra quality)
- Be specific and affirming

Respond with ONLY:
{
  "title": "Your Hidden Strength",
  "description": "2–3 sentence insight here."
}
`.trim();
}

export function getBlindSpotPrompt(name: string): string {
  return `
Based on ${name}'s birth chart, identify one Blind Spot — a pattern, tendency, or shadow quality they may not be fully aware of.

Rules:
- Second person, 2–3 sentences
- Compassionate but honest — not harsh
- Not a prediction of failure, but an invitation to awareness

Respond with ONLY:
{
  "title": "A Pattern to Notice",
  "description": "2–3 sentence insight here."
}
`.trim();
}

export function getGrowthPrompt(name: string): string {
  return `
Based on ${name}'s birth chart, describe their core Growth edge — the direction their chart invites them to stretch toward.

Focus on:
- Their Rahu (North Node) placement or 9th house themes
- What they are here to develop, not what comes naturally

Rules:
- Second person, 2–3 sentences
- Encouraging but grounded

Respond with ONLY:
{
  "title": "Your Growth Direction",
  "description": "2–3 sentence insight here."
}
`.trim();
}
