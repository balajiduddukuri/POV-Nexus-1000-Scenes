import { Category } from './types';

export const BATCH_SIZE = 50;
export const TOTAL_GOAL = 1000;

export const CATEGORIES_LIST = [
  Category.Neon, // Prioritized
  Category.Cyberpunk,
  Category.SciFi,
  Category.Fantasy,
  Category.Action,
  Category.Adventure,
  Category.Military,
  Category.Supernatural,
  Category.Horror,
  Category.Nature,
  Category.Underwater,
  Category.UrbanLife,
  Category.Space,
  Category.Sports,
  Category.Historical,
  Category.Mythological,
  Category.Surreal,
  Category.Dreamlike,
  Category.Architectural,
  Category.EverydayLife
];

export const SYSTEM_INSTRUCTION = `
You are a world-class cinematographer and creative director for a virtual gallery. 
Your task is to generate unique, visually rich, and cinematic POV (Point-of-View) scene concepts.
Avoid generic phrases. Focus on lighting, texture, camera angle, and atmosphere.
Do not use violence or explicit content. 
Each output must be distinct.
`;

export const PROMPT_COMPONENTS = {
  moods: [
    'peaceful', 'dreamlike', 'heroic', 'enigmatic', 'surreal', 
    'mysterious', 'tense', 'melancholic', 'awe-inspiring', 'epic',
    'electric', 'hazy'
  ],
  locations: [
    'floating sky temple', 'rainy city street', 'haunted library', 
    'crystal desert', 'volcanic cliffs', 'futuristic lab', 
    'abandoned starship corridor', 'neon-lit alley', 'underwater reef', 
    'desert battlefield', 'orbital station window', 'ancient ruins', 
    'misty forest', 'glowing cave', 'stormy ocean deck', 
    'dense jungle', 'cosmic nebula', 'snowy mountain pass',
    'holographic market', 'bioluminescent bay'
  ],
  actions: [
    'shielding from bright energy', 'diving deeper into darkness', 
    'touching ancient symbols', 'navigating collapsing terrain', 
    'climbing a massive structure', 'observing distant lights', 
    'holding a futuristic device', 'running from unseen danger', 
    'opening a mysterious door', 'stepping through a portal', 
    'approaching a towering creature', 'floating in zero gravity', 
    'reaching toward a glowing object', 'emerging from thick fog', 
    'exploring an unknown world'
  ],
  // Vibe-coding / Art Fusion
  styles: [
    'Van Gogh x Cyberpunk', 'Klimt x Sci-Fi', 'Rembrandt x Noir',
    'Synthwave x Ukiyo-e', 'Bauhaus x Industrial', 'Gothic x Neon',
    'Abstract Expressionism x Space', 'Art Deco x Future'
  ]
};

export const LOCATION_CATEGORY_MAP: Record<string, string> = {
  'floating sky temple': 'Fantasy',
  'rainy city street': 'Urban Life',
  'haunted library': 'Horror',
  'crystal desert': 'Surreal',
  'volcanic cliffs': 'Adventure',
  'futuristic lab': 'Sci-Fi',
  'abandoned starship corridor': 'Sci-Fi',
  'neon-lit alley': 'Neon', // Mapped to Neon
  'underwater reef': 'Underwater',
  'desert battlefield': 'Military',
  'orbital station window': 'Space',
  'ancient ruins': 'Historical',
  'misty forest': 'Nature',
  'glowing cave': 'Nature',
  'stormy ocean deck': 'Adventure',
  'dense jungle': 'Nature',
  'cosmic nebula': 'Space',
  'snowy mountain pass': 'Nature',
  'holographic market': 'Cyberpunk',
  'bioluminescent bay': 'Neon'
};