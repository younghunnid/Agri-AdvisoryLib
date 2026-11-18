const DEMO_TOKEN_KEY = 'agri_team8_demo_token_v1';
const DEMO_SAVED_KEY = 'agri_team8_demo_saved_v1';
const DEMO_RECENT_KEY = 'agri_team8_demo_recent_v1';
const DEMO_SCENARIOS_KEY = 'agri_team8_demo_scenarios_v1';

export interface DemoSavedAdvice {
  id: string;
  title: string;
  category: string;
  summary: string;
  savedAt: string;
  url?: string;
}

export interface RecentGuideItem {
  slug: string;
  title: string;
  category: string;
  viewedAt: string;
}

export function getDemoOwnerToken(): string {
  try {
    let token = localStorage.getItem(DEMO_TOKEN_KEY);
    if (!token) {
      token = `demo-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
      localStorage.setItem(DEMO_TOKEN_KEY, token);
    }
    return token;
  } catch {
    return 'demo-session-fallback';
  }
}

export function getDemoSavedAdvice(): DemoSavedAdvice[] {
  try {
    const raw = localStorage.getItem(DEMO_SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDemoAdvice(item: Omit<DemoSavedAdvice, 'savedAt'>): DemoSavedAdvice[] {
  const existing = getDemoSavedAdvice().filter((x) => x.id !== item.id);
  const next: DemoSavedAdvice[] = [{...item, savedAt: new Date().toISOString()}, ...existing].slice(0, 30);
  try {
    localStorage.setItem(DEMO_SAVED_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
  return next;
}

export function removeDemoAdvice(id: string): DemoSavedAdvice[] {
  const next = getDemoSavedAdvice().filter((x) => x.id !== id);
  try {
    localStorage.setItem(DEMO_SAVED_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function getRecentlyViewedGuides(): RecentGuideItem[] {
  try {
    const raw = localStorage.getItem(DEMO_RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewedGuide(item: Omit<RecentGuideItem, 'viewedAt'>): void {
  const existing = getRecentlyViewedGuides().filter((x) => x.slug !== item.slug);
  const next: RecentGuideItem[] = [{...item, viewedAt: new Date().toISOString()}, ...existing].slice(0, 12);
  try {
    localStorage.setItem(DEMO_RECENT_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function getCompletedScenarios(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(DEMO_SCENARIOS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function markScenarioComplete(scenarioId: string): Record<string, boolean> {
  const next = {...getCompletedScenarios(), [scenarioId]: true};
  try {
    localStorage.setItem(DEMO_SCENARIOS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function clearLocalDemoState(): void {
  try {
    localStorage.removeItem(DEMO_SAVED_KEY);
    localStorage.removeItem(DEMO_RECENT_KEY);
    localStorage.removeItem(DEMO_SCENARIOS_KEY);
  } catch {
    // ignore
  }
}

export async function compressImageFileToBase64(
  file: File,
  maxWidth = 960
): Promise<{dataUrl: string; base64: string; mimeType: string}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas compression unsupported.'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.78);
        const base64 = dataUrl.split(',')[1] || '';
        resolve({dataUrl, base64, mimeType});
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
