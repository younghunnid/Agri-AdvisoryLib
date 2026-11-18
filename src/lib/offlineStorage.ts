export interface OfflineGuideRecord {
  id: number;
  slug: string;
  title: string;
  summary: string;
  contentMarkdown: string;
  imageUrl: string;
  languageCode: string;
  sourceAttribution: string;
  isSampleDemo: boolean;
  isPestDisease: boolean;
  reviewStatus: string;
  reviewedByName: string | null;
  lastReviewedAt: string | null;
  version: number;
  cropName: string;
  cropSlug: string;
  categoryName: string;
  downloadedAt: string;
}

const STORAGE_KEY = 'agri_advisory_offline_guides_v1';
const IMAGE_CACHE_NAME = 'agri-offline-guide-assets-v1';

export function getOfflineGuides(): OfflineGuideRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getOfflineGuideByIdOrSlug(idOrSlug: string | number): OfflineGuideRecord | null {
  const list = getOfflineGuides();
  const key = String(idOrSlug);
  return list.find((g) => String(g.id) === key || g.slug === key) || null;
}

export function isGuideDownloaded(id: number): boolean {
  return getOfflineGuides().some((g) => g.id === id);
}

export async function saveGuideOffline(guide: Omit<OfflineGuideRecord, 'downloadedAt'>): Promise<OfflineGuideRecord[]> {
  const existing = getOfflineGuides().filter((g) => g.id !== guide.id);
  const record: OfflineGuideRecord = {
    ...guide,
    downloadedAt: new Date().toISOString(),
  };
  const next = [record, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  // Pre-cache the guide's image asset and API JSON in Cache Storage so it renders cleanly offline
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open(IMAGE_CACHE_NAME);
      if (guide.imageUrl) {
        await cache.add(guide.imageUrl).catch(() => undefined);
      }
      await cache.add(`/api/v1/guides/${guide.id}?lang=${guide.languageCode}`).catch(() => undefined);
    } catch {
      // Cache API may be unavailable in restricted contexts; localStorage still persists full guide text
    }
  }

  return next;
}

export async function removeOfflineGuide(id: number): Promise<OfflineGuideRecord[]> {
  const next = getOfflineGuides().filter((g) => g.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function clearAllOfflineGuides(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
  if (typeof window !== 'undefined' && 'caches' in window) {
    await caches.delete(IMAGE_CACHE_NAME).catch(() => undefined);
  }
}

export function estimateOfflineStorageBytes(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || '';
    return new Blob([raw]).size;
  } catch {
    return 0;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
