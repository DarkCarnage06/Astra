/**
 * prompts/career.ts
 */

export function getCareerPrompt(name: string): string {
  return `
Based on ${name}'s birth chart above, write a Career & Purpose insight.

Focus on:
- Their natural professional strengths and work style
- What environments allow them to thrive
- The career themes suggested by their 10th house, Sun, and Saturn placements

Rules:
- Second person, maximum 4 sentences
- Grounded in chart specifics — not generic career advice
- Do NOT predict outcomes or promise success

Respond with ONLY:
{
  "title": "Your Professional Path",
  "description": "2–4 sentence insight here."
}
`.trim();
}
