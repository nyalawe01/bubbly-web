// shared/types/index.ts

// ============================================
// DESIGN SYSTEM TYPES
// ============================================

export type Theme = 'dark' | 'light';

export interface ThemeColors {
  bgApp: string;
  bgSidebar: string;
  bgCard: string;
  bgInput: string;
  bgHover: string;
  bgActive: string;
  textPrimary: string;
  textSecondary: string;
  borderBase: string;
  borderFocus: string;
  btnPrimary: string;
  btnPrimaryText: string;
  btnInverted: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  recording: string;
}

export interface DesignTokens {
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
    '5xl': number;
    '6xl': number;
    '7xl': number;
  };
  typography: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
    '5xl': number;
  };
  borderRadius: {
    none: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    full: number;
  };
  fontFamily: {
    sans: string;
    mono: string;
  };
  breakpoints: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
  };
  zIndex: {
    base: number;
    sidebar: number;
    overlay: number;
    modal: number;
    'modal-overlay': number;
    dropdown: number;
    tooltip: number;
    fullscreen: number;
    max: number;
  };
}

// ============================================
// MESSAGE & CHAT TYPES
// ============================================

export interface Message {
  id?: string;
  role: 'user' | 'ai';
  text: string;
  files?: File[];
  diagram?: any;
  sources?: any[];
  asset?: any;
  timestamp?: Date;
}

export interface Chat {
  id: string;
  title: string;
  date: string;
  timestamp: number;
  history: Message[];
  isNotebookAsset?: boolean;
}

export interface NotebookAsset {
  id: string;
  isNotebookAsset: true;
  type: 'quiz' | 'slides' | 'flashcards' | 'summary';
  title: string;
  metadata: string;
  assetData: any;
  timestamp: number;
}

// ============================================
// VAULT TYPES
// ============================================

export interface VaultDocument {
  id: string;
  name: string;
  size: string;
  type: string;
  date: string;
  aiSummary?: string;
  content?: string;
}

// ============================================
// GENERATOR CONFIG TYPES
// ============================================

export type QuestionCount = 'fewer' | 'standard' | 'more';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type SlideFormat = 'detailed' | 'presenter';
export type SlideLength = 'short' | 'default';

export interface QuizConfig {
  count: QuestionCount;
  difficulty: Difficulty;
  topic: string;
  sources?: string[];
  files?: File[];
}

export interface FlashcardConfig {
  count: QuestionCount;
  difficulty: Difficulty;
  topic: string;
  sources?: string[];
  files?: File[];
}

export interface SlidesConfig {
  format: SlideFormat;
  language: string;
  length: SlideLength;
  description: string;
  sources?: string[];
  files?: File[];
}

export interface SummaryConfig {
  topic: string;
  sources?: string[];
  files?: File[];
}

// ============================================
// USER TYPES
// ============================================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  accessToken?: string;
}

// ============================================
// SEARCH TYPES
// ============================================

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  source: string;
}

// ============================================
// DIAGRAM TYPES
// ============================================

export interface DiagramData {
  xml?: string;
  svg?: string;
  format?: string;
  mermaid?: string;
  type?: string;
  code?: string;
  language?: string;
}

// ============================================
// FILE TYPES
// ============================================

export interface FileData {
  id: string;
  name: string;
  size: string;
  type: string;
  status?: 'uploading' | 'success' | 'failed';
  url?: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}