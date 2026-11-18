import React, {useEffect, useState} from 'react';
import {apiFetch} from '../../lib/api';
import {WorkspaceShell} from '../../components/WorkspaceShell';
import {ADMIN_NAV} from './AdminOverviewPage';

interface AuditRow {
  id: number;
  actor_role: string;
  actor_name: string | null;
  action: string;
  target_type: string;
  target_id: string;
  details_json: string;
  created_at: string;
}

interface FeedbackRow {
  id: number;
  name: string;
  county: string;
  category: string;
  message: string;
  created_at: string;
}

export const ReportsAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);

  useEffect(() => {
    Promise.all([
      apiFetch<{logs: AuditRow[]}>('/admin/audit-logs'),
      apiFetch<{feedback: FeedbackRow[]}>('/admin/feedback'),
    ])
      .then(([l, f]) => {
        setLogs(l.logs);
        setFeedback(f.feedback);
      })
      .catch(() => undefined);
  }, []);

  return (
    <WorkspaceShell
      kicker="Administrator Console"
      title="Reports, Feedback & Audit Logs"
      navItems={ADMIN_NAV}
    >
      <div className="space-y-6">
        <div className="rounded-3xl bg-white border border-[#183B2B]/10 p-6 space-y-3">
          <h2 className="font-display text-lg font-bold">Community Feedback ({feedback.length})</h2>
          {feedback.length === 0 ? (
            <p className="text-sm text-[#183B2B]/70">No community feedback messages yet.</p>
          ) : (
            <div className="divide-y divide-[#183B2B]/10">
              {feedback.map((f) => (
                <div key={f.id} className="py-3 space-y-1">
                  <p className="text-xs text-[#183B2B]/65">
                    {f.name} · {f.county || 'Liberia'} · {f.category} · {f.created_at}
                  </p>
                  <p className="text-sm text-[#183B2B]">{f.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white border border-[#183B2B]/10 p-6 space-y-3 overflow-x-auto">
          <h2 className="font-display text-lg font-bold">Security &amp; Editorial Audit Trail</h2>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#183B2B]/10 text-xs text-[#183B2B]/65">
              <tr>
                <th className="py-2 pr-4">Timestamp</th>
                <th className="py-2 pr-4">Actor</th>
                <th className="py-2 pr-4">Action</th>
                <th className="py-2 pr-4">Target</th>
                <th className="py-2">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#183B2B]/10">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="py-2.5 pr-4 font-mono text-xs tabular-nums">{l.created_at}</td>
                  <td className="py-2.5 pr-4">{l.actor_name || l.actor_role}</td>
                  <td className="py-2.5 pr-4 font-semibold">{l.action}</td>
                  <td className="py-2.5 pr-4 text-xs">{l.target_type} #{l.target_id}</td>
                  <td className="py-2.5 font-mono text-xs text-[#183B2B]/70">{l.details_json}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </WorkspaceShell>
  );
};
