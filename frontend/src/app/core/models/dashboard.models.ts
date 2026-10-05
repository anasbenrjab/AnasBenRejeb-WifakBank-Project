export interface AppEntry {
  id: number;
  code: string;
  nom: string;
  description: string;
  url: string;
  icon: string;
  // Phase 2: launch behaviour fields
  launchMode?: 'IFRAME' | 'NEW_TAB' | 'REDIRECT';
  category?: string | null;
  displayOrder?: number | null;
  // Icon type
  iconType?: 'BOOTSTRAP_ICON' | 'URL' | 'UPLOAD';
}
