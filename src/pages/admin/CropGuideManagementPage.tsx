import React, {useEffect, useState} from 'react';
import {Plus} from 'lucide-react';
import {apiFetch} from '../../lib/api';
import {WorkspaceShell} from '../../components/WorkspaceShell';
import {ADMIN_NAV} from './AdminOverviewPage';

interface GuideRow {
  id: number;
  title: string;
  crop_name: string;
  category_name: string;
  review_status: string;
  is_published: number;
  version: number;
}

export const CropGuideManagementPage: React.FC = () => {
  const [guides, setGuides] = useState<GuideRow[]>([]);
  const [crops, setCrops] = useState<Array<{id: number; name: string}>>([]);
  const [categories, setCategories] = useState<Array<{id: number; name: string}>>([]);
  const [title, setTitle] = useState('');
  const [cropId, setCropId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [summary, setSummary] = useState('');
  const [contentMarkdown, setContentMarkdown] = useState('');
  const [isPestDisease, setIsPestDisease] = useState(false);

  const load = () => {
    apiFetch<{guides: GuideRow[]}>('/admin/guides').then((r) => setGuides(r.guides)).catch(() => undefined);
  };

  useEffect(() => {
    load();
    apiFetch<{crops: Array<{id: number; name: string}>}>('/crops').then((r) => {
      setCrops(r.crops);
      if (r.crops[0]) setCropId(String(r.crops[0].id));
    });
    apiFetch<{categories: Array<{id: number; name: string}>}>('/categories').then((r) => {
      setCategories(r.categories);
      if (r.categories[0]) setCategoryId(String(r.categories[0].id));
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/admin/guides', {
      method: 'POST',
      body: JSON.stringify({
        cropId: Number(cropId),
        categoryId: Number(categoryId),
        title,
        summary,
        contentMarkdown,
        isPestDisease,
        isSampleDemo: true,
      }),
    });
    setTitle('');
    setSummary('');
    setContentMarkdown('');
    load();
  };

  return (
    <WorkspaceShell
      kicker="Administrator Console"
      title="Crop Guide Management"
      subtitle="New guides enter Pending Review before publication in the public library."
      navItems={ADMIN_NAV}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form onSubmit={(e) => void handleCreate(e)} className="lg:col-span-5 rounded-3xl bg-white border border-[#183B2B]/10 p-6 space-y-3 h-fit">
          <h2 className="font-display text-lg font-bold">Draft New Guide</h2>
          <input type="text" required minLength={5} placeholder="Guide Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select value={cropId} onChange={(e) => setCropId(e.target.value)} className="min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3 text-sm">
              {crops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3 text-sm">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <input type="text" required placeholder="Short Summary" value={summary} onChange={(e) => setSummary(e.target.value)} className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3 text-sm" />
          <textarea rows={5} required placeholder="Guide Markdown Content..." value={contentMarkdown} onChange={(e) => setContentMarkdown(e.target.value)} className="w-full rounded-2xl border border-[#183B2B]/20 p-3 text-sm" />
          <label className="flex items-center gap-2 text-sm min-h-[44px]">
            <input type="checkbox" checked={isPestDisease} onChange={(e) => setIsPestDisease(e.target.checked)} className="w-4 h-4 accent-[#16803C]" />
            <span>Include in Pests &amp; Diseases Hub</span>
          </label>
          <button type="submit" className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#16803C] text-white text-sm font-semibold">
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Submit for Content Review</span>
          </button>
        </form>

        <div className="lg:col-span-7 space-y-3">
          {guides.map((g) => (
            <div key={g.id} className="rounded-2xl bg-white border border-[#183B2B]/10 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-[#183B2B]/65">
                  {g.crop_name} · {g.category_name} · v{g.version} · {g.review_status} · {g.is_published ? 'Published' : 'Unpublished'}
                </p>
                <p className="font-display font-bold text-base text-[#183B2B]">{g.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WorkspaceShell>
  );
};
