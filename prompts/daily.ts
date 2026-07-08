/**
 * prompts/daily.ts
 *
 * Today's energy reading — uses current dasha context.
 */

export function getDailyPrompt(name: string): string {
  return `
Based on ${name}'s birth chart and their current Vimshottari Dasha period above, write a Today's Energy insight.

Focus on:
- The general quality of energy available to them in this phase of their dasha
- What themes or areas of life are most active right now
- One grounded action or awareness they can apply today

Rules:
- Second person, maximum 3 sentences
- Practical and grounded — not mystical
- Do NOT say "today the stars say" — ground it in the dasha/antardasha energies

Respond with ONLY:
{
  "title": "Today's Energy",
  "description": "3-sentence insight here."
}
`.trim();
}
