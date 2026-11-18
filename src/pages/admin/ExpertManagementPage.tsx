import React, {useEffect, useState} from 'react';
import {UserPlus} from 'lucide-react';
import {apiFetch} from '../../lib/api';
import {WorkspaceShell} from '../../components/WorkspaceShell';
import {ADMIN_NAV} from './AdminOverviewPage';

const COUNTIES = [
  'Bomi', 'Bong', 'Gbarpolu', 'Grand Bassa', 'Grand Cape Mount',
  'Grand Gedeh', 'Grand Kru', 'Lofa', 'Margibi', 'Maryland',
  'Montserrado', 'Nimba', 'River Cess', 'River Gee', 'Sinoe',
];

interface ExpertRow {
  id: number;
  display_name: string;
  phone: string;
  specialty: string;
  county: string;
  approval_status: string;
}

export const ExpertManagementPage: React.FC = () => {
  const [experts, setExperts] = useState<ExpertRow[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialty, setSpecialty] = useState('Crop Protection & Extension');
  const [county, setCounty] = useState('Montserrado');
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiFetch<{experts: ExpertRow[]}>('/admin/experts')
      .then((res) => setExperts(res.experts))
      .catch(() => undefined);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch('/admin/experts', {
        method: 'POST',
        body: JSON.stringify({displayName, phone, email, password, specialty, county}),
      });
      setDisplayName('');
      setPhone('');
      setEmail('');
      setPassword('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create expert.');
    }
  };

  const updateApproval = async (id: number, approvalStatus: 'approved' | 'suspended') => {
    await apiFetch(`/admin/experts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({approvalStatus}),
    });
    load();
  };

  return (
    <WorkspaceShell
      kicker="Administrator Console"
      title="Expert Management"
      subtitle="Only approved experts can issue responses labeled as official expert advice."
      navItems={ADMIN_NAV}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form onSubmit={(e) => void handleCreate(e)} className="lg:col-span-5 rounded-3xl bg-white border border-[#183B2B]/10 p-6 space-y-3 h-fit">
          <h2 className="font-display text-lg font-bold">Add Approved Expert</h2>
          {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
          <input type="text" required placeholder="Full Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3 text-sm" />
          <input type="tel" required placeholder="Phone (+231...)" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3 text-sm" />
          <input type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3 text-sm" />
          <input type="text" required placeholder="Specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3 text-sm" />
          <select value={county} onChange={(e) => setCounty(e.target.value)} className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3 text-sm">
            {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="password" required minLength={8} placeholder="Initial Password (8+ chars)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3 text-sm" />
          <button type="submit" className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#16803C] text-white text-sm font-semibold">
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            <span>Create Expert Account</span>
          </button>
        </form>

        <div className="lg:col-span-7 space-y-3">
          {experts.map((ex) => (
            <div key={ex.id} className="rounded-2xl bg-white border border-[#183B2B]/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-[#183B2B]/65">{ex.approval_status.toUpperCase()} · {ex.county} County</p>
                <p className="font-display font-bold text-base text-[#183B2B]">{ex.display_name}</p>
                <p className="text-sm text-[#183B2B]/80">{ex.specialty}</p>
              </div>
              <div className="flex gap-2">
                {ex.approval_status !== 'approved' && (
                  <button type="button" onClick={() => void updateApproval(ex.id, 'approved')} className="min-h-[44px] px-4 rounded-xl bg-[#16803C] text-white text-xs font-semibold">
                    Approve
                  </button>
                )}
                {ex.approval_status !== 'suspended' && (
                  <button type="button" onClick={() => void updateApproval(ex.id, 'suspended')} className="min-h-[44px] px-4 rounded-xl border border-red-200 text-red-700 text-xs font-semibold">
                    Suspend
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </WorkspaceShell>
  );
};
