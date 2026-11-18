import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Download,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {useApp} from '../../context/AppContext';
import {apiFetch} from '../../lib/api';
import {
  clearAllOfflineGuides,
  estimateOfflineStorageBytes,
  formatBytes,
  getOfflineGuides,
  type OfflineGuideRecord,
  removeOfflineGuide,
  saveGuideOffline,
} from '../../lib/offlineStorage';
import {PWAInstallButton} from '../../components/PWAInstallButton';

export const OfflineLibraryPage: React.FC = () => {
  const {isOnline, language} = useApp();
  const [guides, setGuides] = useState<OfflineGuideRecord[]>(() => getOfflineGuides());
  const [bytesUsed, setBytesUsed] = useState(() => estimateOfflineStorageBytes());
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const refreshState = () => {
    setGuides(getOfflineGuides());
    setBytesUsed(estimateOfflineStorageBytes());
  };

  const handleRemove = async (id: number) => {
    await removeOfflineGuide(id);
    refreshState();
    setStatusMessage('Removed guide from offline storage.');
  };

  const handleClearAll = async () => {
    await clearAllOfflineGuides();
    refreshState();
    setStatusMessage('Cleared all downloaded offline guides.');
  };

  const handleCheckUpdates = async () => {
    if (!isOnline || guides.length === 0) return;
    setCheckingUpdates(true);
    setStatusMessage(null);
    let updatedCount = 0;

    try {
      for (const local of guides) {
        try {
          const res = await apiFetch<{
            guide: {
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
              crop: {slug: string; name: string};
              category: {name: string};
            };
          }>(`/guides/${local.id}?lang=${language}`);

          if (res.guide.version > local.version || res.guide.languageCode !== local.languageCode) {
            await saveGuideOffline({
              id: res.guide.id,
              slug: res.guide.slug,
              title: res.guide.title,
              summary: res.guide.summary,
              contentMarkdown: res.guide.contentMarkdown,
              imageUrl: res.guide.imageUrl,
              languageCode: res.guide.languageCode,
              sourceAttribution: res.guide.sourceAttribution,
              isSampleDemo: res.guide.isSampleDemo,
              isPestDisease: res.guide.isPestDisease,
              reviewStatus: res.guide.reviewStatus,
              reviewedByName: res.guide.reviewedByName,
              lastReviewedAt: res.guide.lastReviewedAt,
              version: res.guide.version,
              cropName: res.guide.crop.name,
              cropSlug: res.guide.crop.slug,
              categoryName: res.guide.category.name,
            });
            updatedCount++;
          }
        } catch {
          // Skip guide if unavailable
        }
      }
      refreshState();
      setStatusMessage(
        updatedCount > 0
          ? `Updated ${updatedCount} offline guide(s) to the latest version.`
          : 'All downloaded guides are already up to date.'
      );
    } finally {
      setCheckingUpdates(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-[#16803C]">PWA &amp; Field Access</p>
          <h1 className="font-display text-3xl font-extrabold text-[#183B2B]">Offline Library</h1>
          <p className="text-sm sm:text-base text-[#183B2B]/80 max-w-2xl">
            Read approved guides without internet connectivity. Only public agricultural guides are cached—never passwords, private expert chats, or sensitive account details.
          </p>
        </div>
        <PWAInstallButton />
      </div>

      {/* Status & Storage Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-[#183B2B]/10 p-5 space-y-1">
          <p className="text-xs text-[#183B2B]/65">Connectivity</p>
          <p className="font-display text-lg font-bold flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="w-5 h-5 text-[#16803C]" aria-hidden="true" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-amber-700" aria-hidden="true" />
                <span>Offline</span>
              </>
            )}
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-[#183B2B]/10 p-5 space-y-1">
          <p className="text-xs text-[#183B2B]/65">Downloaded Guides</p>
          <p className="font-display text-lg font-bold tabular-nums">{guides.length} guides</p>
        </div>
        <div className="rounded-2xl bg-white border border-[#183B2B]/10 p-5 space-y-1">
          <p className="text-xs text-[#183B2B]/65">Storage Used</p>
          <p className="font-display text-lg font-bold tabular-nums">{formatBytes(bytesUsed)}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-[#DDEFE0]/70 border border-[#16803C]/20 p-4 text-xs sm:text-sm text-[#183B2B]">
        <strong>Honest Offline Scope:</strong> Saved crop guides open anytime without mobile data. Live AI Advisor questions and Expert Support messaging require an active internet connection.
      </div>

      {statusMessage && (
        <div role="status" className="rounded-xl bg-white border border-[#16803C]/30 px-4 py-3 text-sm font-medium text-[#183B2B]">
          {statusMessage}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Link
            to="/guides"
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#16803C] text-white text-sm font-semibold hover:bg-[#116630]"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Browse Guides to Download</span>
          </Link>
          {guides.length > 0 && isOnline && (
            <button
              type="button"
              disabled={checkingUpdates}
              onClick={() => void handleCheckUpdates()}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-white border border-[#183B2B]/15 text-sm font-semibold text-[#183B2B] hover:bg-[#F3F8F0]"
            >
              <RefreshCw className={`w-4 h-4 ${checkingUpdates ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{checkingUpdates ? 'Checking...' : 'Check Updates'}</span>
            </button>
          )}
        </div>
        {guides.length > 0 && (
          <button
            type="button"
            onClick={() => void handleClearAll()}
            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Remove All Downloads
          </button>
        )}
      </div>

      {/* Downloaded List */}
      {guides.length === 0 ? (
        <div className="rounded-3xl bg-white border border-[#183B2B]/10 p-10 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-[#16803C] mx-auto" aria-hidden="true" />
          <h2 className="font-display text-xl font-bold text-[#183B2B]">No Offline Guides Saved Yet</h2>
          <p className="text-sm text-[#183B2B]/75 max-w-md mx-auto">
            Open any guide in the Crop Guide Library and tap <strong>Save Offline</strong> so you can read it on your farm without network access.
          </p>
          <Link
            to="/guides"
            className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl bg-[#16803C] text-white text-sm font-semibold"
          >
            Explore Farming Guides
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {guides.map((g) => (
            <div
              key={g.id}
              className="rounded-2xl bg-white border border-[#183B2B]/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <p className="text-xs text-[#183B2B]/65 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16803C]" aria-hidden="true" />
                  <span>
                    Available Offline · {g.cropName} · {g.categoryName} · v{g.version} ({g.languageCode.toUpperCase()})
                  </span>
                </p>
                <h2 className="font-display text-lg font-bold text-[#183B2B]">
                  <Link to={`/guides/${g.slug}`} className="hover:text-[#16803C]">
                    {g.title}
                  </Link>
                </h2>
                <p className="text-xs text-[#183B2B]/70">
                  Saved {new Date(g.downloadedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/guides/${g.slug}`}
                  className="min-h-[44px] inline-flex items-center px-4 py-2 rounded-xl bg-[#DDEFE0] text-[#183B2B] text-sm font-semibold hover:bg-[#16803C] hover:text-white transition-colors"
                >
                  Read Offline
                </Link>
                <button
                  type="button"
                  onClick={() => void handleRemove(g.id)}
                  aria-label={`Remove ${g.title} from offline library`}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-[#183B2B]/15 text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
