import React, {useState} from 'react';
import {Save} from 'lucide-react';
import {apiFetch} from '../../lib/api';
import {type ClientUser, useApp} from '../../context/AppContext';
import {WorkspaceShell} from '../../components/WorkspaceShell';
import {EXPERT_NAV} from './ExpertDashboardPage';

const COUNTIES = [
  'Bomi', 'Bong', 'Gbarpolu', 'Grand Bassa', 'Grand Cape Mount',
  'Grand Gedeh', 'Grand Kru', 'Lofa', 'Margibi', 'Maryland',
  'Montserrado', 'Nimba', 'River Cess', 'River Gee', 'Sinoe',
];

export const ExpertProfilePage: React.FC = () => {
  const {user, setUser} = useApp();
  const [specialty, setSpecialty] = useState(user?.expertSpecialty || 'General Agronomy');
  const [county, setCounty] = useState(user?.county || 'Montserrado');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const res = await apiFetch<{user: ClientUser}>('/expert/profile', {
        method: 'PATCH',
        body: JSON.stringify({specialty, county, bio}),
      });
      setUser(res.user);
      setNotice('Expert profile updated.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkspaceShell
      kicker={`Approval Status: ${user?.expertStatus || 'pending'}`}
      title="Expert Profile"
      navItems={EXPERT_NAV}
    >
      <form onSubmit={(e) => void handleSave(e)} className="rounded-3xl bg-white border border-[#183B2B]/10 p-6 sm:p-8 space-y-4 max-w-2xl">
        {notice && <div className="rounded-xl bg-[#DDEFE0] px-4 py-2.5 text-sm font-medium">{notice}</div>}
        <div>
          <label htmlFor="ep-spec" className="block text-sm font-semibold mb-1.5">Agricultural Specialty</label>
          <input id="ep-spec" type="text" required value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3.5 text-sm" />
        </div>
        <div>
          <label htmlFor="ep-county" className="block text-sm font-semibold mb-1.5">Primary County</label>
          <select id="ep-county" value={county} onChange={(e) => setCounty(e.target.value)} className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3 text-sm">
            {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="ep-bio" className="block text-sm font-semibold mb-1.5">Background Bio</label>
          <textarea id="ep-bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Describe your extension or crop experience..." className="w-full rounded-2xl border border-[#183B2B]/20 p-3.5 text-sm" />
        </div>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 min-h-[48px] px-6 py-3 rounded-2xl bg-[#16803C] text-white text-sm font-semibold">
          <Save className="w-4 h-4" aria-hidden="true" />
          <span>{saving ? 'Saving...' : 'Update Expert Profile'}</span>
        </button>
      </form>
    </WorkspaceShell>
  );
};
