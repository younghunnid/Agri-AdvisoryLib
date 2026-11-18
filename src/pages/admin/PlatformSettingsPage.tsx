import React, {useEffect, useState} from 'react';
import {Save} from 'lucide-react';
import {apiFetch} from '../../lib/api';
import {WorkspaceShell} from '../../components/WorkspaceShell';
import {ADMIN_NAV} from './AdminOverviewPage';

export const PlatformSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{settings: Array<{key: string; value: string}>}>('/admin/settings')
      .then((res) => setSettings(Object.fromEntries(res.settings.map((s) => [s.key, s.value]))))
      .catch(() => undefined);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      await apiFetch('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({settings}),
      });
      setNotice('Platform settings saved and logged.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkspaceShell
      kicker="Administrator Console"
      title="Platform Settings"
      navItems={ADMIN_NAV}
    >
      <form onSubmit={(e) => void handleSave(e)} className="rounded-3xl bg-white border border-[#183B2B]/10 p-6 sm:p-8 space-y-4 max-w-2xl">
        {notice && <div className="rounded-xl bg-[#DDEFE0] px-4 py-2.5 text-sm font-medium">{notice}</div>}
        {[
          {key: 'platform_name', label: 'Platform Name'},
          {key: 'daily_tip_title', label: "Today's Farming Tip Title"},
          {key: 'daily_tip_body', label: "Today's Farming Tip Body"},
          {key: 'anon_ai_daily_limit', label: 'Guest Daily AI Limit'},
          {key: 'auth_ai_hourly_limit', label: 'Authenticated Farmer Hourly AI Limit'},
        ].map((field) => (
          <div key={field.key}>
            <label htmlFor={`set-${field.key}`} className="block text-sm font-semibold mb-1.5">
              {field.label}
            </label>
            <input
              id={`set-${field.key}`}
              type="text"
              value={settings[field.key] || ''}
              onChange={(e) => setSettings((prev) => ({...prev, [field.key]: e.target.value}))}
              className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3.5 text-sm"
            />
          </div>
        ))}
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 min-h-[48px] px-6 py-3 rounded-2xl bg-[#16803C] text-white text-sm font-semibold">
          <Save className="w-4 h-4" aria-hidden="true" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </form>
    </WorkspaceShell>
  );
};
