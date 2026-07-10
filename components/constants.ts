export const navItems = [
  { label: 'Features',     href: '#features' },
  { label: 'How It Works', href: '#about' },
  { label: 'Testimonials', href: '#testimonials' },
] as const;

export const features = [
  {
    title: 'Ask Astra',
    description: 'Chat naturally with your birth chart and explore cosmic patterns in conversation.',
    icon: 'sparkles',
  },
  {
    title: 'Birth Chart',
    description: 'Receive beautifully rendered AI-generated chart insights with depth and clarity.',
    icon: 'stars',
  },
  {
    title: 'Compatibility',
    description: 'Understand relationships through emotional and symbolic patterns, not predictions.',
    icon: 'gem',
  },
  {
    title: 'Life Timeline',
    description: 'Explore important phases and planetary periods with elegant visual narratives.',
    icon: 'orbit',
  },
] as const;

export const steps = [
  'Enter birth details',
  'ASTRA generates your chart',
  'AI explains everything naturally',
] as const;

export const testimonials = [
  {
    quote: 'It feels like a product from the future, yet it feels deeply human.',
    author: 'Mina K.',
    role: 'Founder, Northstar',
  },
  {
    quote: 'The interface is calm, cinematic, and surprisingly insightful.',
    author: 'Julian P.',
    role: 'Design Lead, Axiom',
  },
  {
    quote: 'I finally feel like my reflection is being understood with grace.',
    author: 'Ari V.',
    role: 'Product Strategist',
  },
] as const;
