import React, {useState} from 'react';
import {Save} from 'lucide-react';
import {apiFetch} from '../../lib/api';
import {type ClientUser, useApp} from '../../context/AppContext';
import {LANGUAGE_OPTIONS, type LanguageCode} from '../../lib/i18n';
import {WorkspaceShell} from '../../components/WorkspaceShell';
import {FARMER_NAV} from './FarmerDashboardPage';

const COUNTIES = [
  'Bomi', 'Bong', 'Gbarpolu', 'Grand Bassa', 'Grand Cape Mount',
  'Grand Gedeh', 'Grand Kru', 'Lofa', 'Margibi', 'Maryland',
  'Montserrado', 'Nimba', 'River Cess', 'River Gee', 'Sinoe',
];
const CROP_CHOICES = ['Cassava', 'Rice', 'Maize', 'Pepper', 'Okra', 'Plantain'];

export const ProfilePreferencesPage: React.FC = () => {
  const {user, setUser, setLanguage} = useApp();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [county, setCounty] = useState(user?.county || 'Montserrado');
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>(user?.preferredLanguage || 'en');
  const [crops, setCrops] = useState<string[]>(user?.cropsOfInterest || []);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const toggleCrop = (crop: string) => {
    setCrops((prev) => (prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const res = await apiFetch<{user: ClientUser}>('/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          displayName,
          county,
          preferredLanguage,
          cropsOfInterest: crops,
        }),
      });
      setUser(res.user);
      await setLanguage(preferredLanguage);
      setNotice('Profile and language preferences saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkspaceShell
      kicker="Farmer Workspace"
      title="Profile & Language Preferences"
      subtitle="Update your county, crops of interest, and preferred interface language."
      navItems={FARMER_NAV}
    >
      <form onSubmit={(e) => void handleSave(e)} className="rounded-3xl bg-white border border-[#183B2B]/10 p-6 sm:p-8 space-y-5 max-w-2xl">
        {notice && (
          <div role="status" className="rounded-xl bg-[#DDEFE0] px-4 py-2.5 text-sm font-medium text-[#183B2B]">
            {notice}
          </div>
        )}

        <div>
          <label htmlFor="prof-name" className="block text-sm font-semibold mb-1.5">Display Name</label>
          <input id="prof-name" type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3.5 text-sm" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="prof-county" className="block text-sm font-semibold mb-1.5">County</label>
            <select id="prof-county" value={county} onChange={(e) => setCounty(e.target.value)} className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3 text-sm">
              {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="prof-lang" className="block text-sm font-semibold mb-1.5">Preferred Language</label>
            <select id="prof-lang" value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value as LanguageCode)} className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3 text-sm">
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.shortCode} · {l.name}{l.status === 'coming_soon' ? ' (Coming Soon)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <span className="block text-sm font-semibold mb-2">Crops of Interest</span>
          <div className="flex flex-wrap gap-2">
            {CROP_CHOICES.map((c) => {
              const active = crops.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCrop(c)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold border ${
                    active ? 'bg-[#16803C] text-white border-[#16803C]' : 'bg-[#F3F8F0] text-[#183B2B] border-[#183B2B]/15'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 min-h-[48px] px-6 py-3 rounded-2xl bg-[#16803C] text-white text-sm font-semibold">
          <Save className="w-4 h-4" aria-hidden="true" />
          <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
        </button>
      </form>
    </WorkspaceShell>
  );
};
