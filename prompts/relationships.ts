/**
 * prompts/relationships.ts
 */

export function getRelationshipsPrompt(name: string): string {
  return `
Based on ${name}'s birth chart above, write a Relationships insight.

Focus on:
- Their emotional needs and attachment style in relationships
- How their Venus and Moon placement shape their connections
- What they need from a partner to feel understood

Rules:
- Second person, maximum 4 sentences
- Focus on patterns and needs — not predictions about specific people
- Warm but grounded tone

Respond with ONLY:
{
  "title": "Your Relationship Pattern",
  "description": "2–4 sentence insight here."
}
`.trim();
}
