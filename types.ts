export enum Category {
  Action = 'Action',
  Adventure = 'Adventure',
  SciFi = 'Sci-Fi',
  Fantasy = 'Fantasy',
  Cyberpunk = 'Cyberpunk',
  Neon = 'Neon',
  Military = 'Military',
  Supernatural = 'Supernatural',
  Horror = 'Horror',
  Nature = 'Nature',
  Underwater = 'Underwater',
  UrbanLife = 'Urban Life',
  Space = 'Space',
  Sports = 'Sports',
  Historical = 'Historical',
  Mythological = 'Mythological',
  Surreal = 'Surreal',
  Dreamlike = 'Dreamlike',
  Architectural = 'Architectural',
  EverydayLife = 'Everyday Life'
}

export interface SceneConcept {
  id: number;
  description: string;
  category: string;
  lighting: string;
  camera: string;
  thumbnailUrl?: string;
  isGeneratingThumbnail?: boolean;
  highResUrl?: string;
  isGeneratingHighRes?: boolean;
  isFavorite?: boolean;
}

export interface GenerationStats {
  totalGenerated: number;
  batchesCompleted: number;
  isGenerating: boolean;
  startTime: number | null;
  elapsedTime: number;
}

export type ThemeMode = 'default' | 'high-contrast';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}