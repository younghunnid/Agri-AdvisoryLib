import React, {useEffect, useState} from 'react';
import {apiFetch} from '../../lib/api';
import {WorkspaceShell} from '../../components/WorkspaceShell';
import {ADMIN_NAV} from './AdminOverviewPage';

interface ReviewGuide {
  id: number;
  title: string;
  summary: string;
  crop_name: string;
  category_name: string;
  review_status: string;
  is_published: number;
  version: number;
}

export const AdvisoryContentReviewPage: React.FC = () => {
  const [guides, setGuides] = useState<ReviewGuide[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});

  const load = () => {
    apiFetch<{guides: ReviewGuide[]}>('/admin/guides')
      .then((res) => setGuides(res.guides))
      .catch(() => undefined);
  };

  useEffect(() => {
    load();
  }, []);

  const handleReview = async (id: number, decision: 'approved' | 'changes_requested' | 'unpublished') => {
    await apiFetch(`/admin/guides/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({
        decision,
        notes: notes[id] || '',
        publish: decision === 'approved',
      }),
    });
    load();
  };

  return (
    <WorkspaceShell
      kicker="Administrator Console"
      title="Advisory Content Review"
      subtitle="Only approved & published guides appear in public searches and offline downloads."
      navItems={ADMIN_NAV}
    >
      <div className="space-y-4">
        {guides.map((g) => (
          <div key={g.id} className="rounded-3xl bg-white border border-[#183B2B]/10 p-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs text-[#183B2B]/65">
                  {g.crop_name} · {g.category_name} · v{g.version} · Status: {g.review_status} ·{' '}
                  {g.is_published ? 'Published' : 'Hidden from Public'}
                </p>
                <h2 className="font-display text-lg font-bold text-[#183B2B]">{g.title}</h2>
                <p className="text-sm text-[#183B2B]/80 mt-1">{g.summary}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <input
                type="text"
                placeholder="Optional review note..."
                value={notes[g.id] || ''}
                onChange={(e) => setNotes((prev) => ({...prev, [g.id]: e.target.value}))}
                className="flex-1 min-h-[44px] rounded-xl border border-[#183B2B]/15 px-3 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleReview(g.id, 'approved')}
                  className="min-h-[44px] px-4 rounded-xl bg-[#16803C] text-white text-xs font-semibold"
                >
                  Approve &amp; Publish
                </button>
                <button
                  type="button"
                  onClick={() => void handleReview(g.id, 'changes_requested')}
                  className="min-h-[44px] px-4 rounded-xl bg-[#F5B942] text-[#183B2B] text-xs font-bold"
                >
                  Request Changes
                </button>
                {g.is_published === 1 && (
                  <button
                    type="button"
                    onClick={() => void handleReview(g.id, 'unpublished')}
                    className="min-h-[44px] px-4 rounded-xl border border-[#183B2B]/20 text-xs font-semibold"
                  >
                    Unpublish
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </WorkspaceShell>
  );
};
