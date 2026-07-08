/**
 * prompts/reflection.ts
 */

export function getReflectionPrompt(name: string): string {
  return `
Based on ${name}'s birth chart above, write a Reflection prompt — a contemplative question or observation for self-inquiry.

Focus on:
- A deeper question about who they are, based on chart tensions or unresolved placements
- An invitation to reflect, not a judgment

Rules:
- Second person, 2–3 sentences maximum
- Thoughtful and slightly poetic, but never vague
- End with an open question if possible

Respond with ONLY:
{
  "title": "A Question for You",
  "description": "Reflective prompt here."
}
`.trim();
}
