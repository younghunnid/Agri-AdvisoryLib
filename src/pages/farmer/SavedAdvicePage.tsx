import React, {useEffect, useState} from 'react';
import {Trash2} from 'lucide-react';
import {apiFetch} from '../../lib/api';
import {WorkspaceShell} from '../../components/WorkspaceShell';
import {FARMER_NAV} from './FarmerDashboardPage';

interface SavedItem {
  id: number;
  source_type: string;
  title: string;
  crop_name: string;
  content_text: string;
  created_at: string;
}

export const SavedAdvicePage: React.FC = () => {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    apiFetch<{saved: SavedItem[]}>('/farmer/saved')
      .then((res) => setItems(res.saved))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: number) => {
    await apiFetch(`/farmer/saved/${id}`, {method: 'DELETE'});
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <WorkspaceShell
      kicker="Farmer Workspace"
      title="Saved Advice"
      subtitle="AI advisor answers and bookmarked crop guides stored in your account."
      navItems={FARMER_NAV}
    >
      {loading ? (
        <p className="text-sm text-[#183B2B]/70">Loading saved advice...</p>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-white border border-[#183B2B]/10 p-8 text-center text-sm text-[#183B2B]/75">
          You have not bookmarked any AI answers or guides yet.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-3xl bg-white border border-[#183B2B]/10 p-6 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-[#183B2B]/65">
                    {item.source_type === 'ai_advisor' ? 'AI Advisor' : 'Crop Guide'} ·{' '}
                    {item.crop_name || 'General'} · {item.created_at}
                  </p>
                  <h2 className="font-display text-lg font-bold text-[#183B2B] mt-1">{item.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(item.id)}
                  aria-label={`Delete ${item.title}`}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm text-[#183B2B]/85 leading-relaxed">
                {item.content_text}
              </pre>
            </article>
          ))}
        </div>
      )}
    </WorkspaceShell>
  );
};
