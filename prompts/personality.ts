/**
 * prompts/personality.ts
 *
 * Personality reading prompt template.
 * Focuses on core character, natural strengths, and behavioural patterns.
 */

export function getPersonalityPrompt(name: string): string {
  return `
Based on ${name}'s birth chart above, write a Personality insight.

Focus on:
- Their core character and how they show up in the world
- Their natural gifts and dominant psychological pattern
- The interplay between their Sun sign, Moon sign, and Ascendant

Rules:
- Write in second person ("You are...", "Your nature...")
- Maximum ${4} sentences
- Be specific to their chart — avoid generic horoscope language
- Ground every claim in a personality or psychological lens
- Do NOT predict the future or make promises

Respond with ONLY a JSON object in this exact format:
{
  "title": "Your Core Nature",
  "description": "2–4 sentence insight here."
}
`.trim();
}
