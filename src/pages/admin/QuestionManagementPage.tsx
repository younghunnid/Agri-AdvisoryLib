import React, {useEffect, useState} from 'react';
import {apiFetch} from '../../lib/api';
import {WorkspaceShell} from '../../components/WorkspaceShell';
import {ADMIN_NAV} from './AdminOverviewPage';

interface QuestionRow {
  id: number;
  topic: string;
  county: string;
  title: string;
  status: string;
  assigned_expert_id: number | null;
  crop_name: string | null;
  farmer_name: string;
  expert_name: string | null;
}

interface ExpertOption {
  id: number;
  display_name: string;
  specialty: string;
  approval_status: string;
}

export const QuestionManagementPage: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [experts, setExperts] = useState<ExpertOption[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<Record<number, string>>({});

  const load = () => {
    Promise.all([
      apiFetch<{questions: QuestionRow[]}>('/admin/questions'),
      apiFetch<{experts: ExpertOption[]}>('/admin/experts'),
    ])
      .then(([qRes, eRes]) => {
        setQuestions(qRes.questions);
        setExperts(eRes.experts.filter((ex) => ex.approval_status === 'approved'));
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAssign = async (qId: number) => {
    const expId = selectedExpert[qId] || (experts[0] ? String(experts[0].id) : '');
    if (!expId) return;
    await apiFetch(`/admin/questions/${qId}/assign`, {
      method: 'POST',
      body: JSON.stringify({expertId: Number(expId)}),
    });
    load();
  };

  return (
    <WorkspaceShell
      kicker="Administrator Console"
      title="Question Management"
      subtitle="Assign incoming farmer consultations to approved agricultural experts."
      navItems={ADMIN_NAV}
    >
      <div className="space-y-3">
        {questions.map((q) => (
          <div key={q.id} className="rounded-2xl bg-white border border-[#183B2B]/10 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-[#183B2B]/65">
                {q.status} · {q.crop_name || 'General'} · {q.county} County · Farmer: {q.farmer_name}
              </p>
              <h2 className="font-display font-bold text-base text-[#183B2B]">{q.title}</h2>
              <p className="text-xs text-[#16803C] font-medium">
                {q.expert_name ? `Assigned to: ${q.expert_name}` : 'Unassigned'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label={`Select expert for ${q.title}`}
                value={selectedExpert[q.id] || (q.assigned_expert_id ? String(q.assigned_expert_id) : experts[0] ? String(experts[0].id) : '')}
                onChange={(e) => setSelectedExpert((prev) => ({...prev, [q.id]: e.target.value}))}
                className="min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3 text-xs"
              >
                {experts.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.display_name} ({ex.specialty})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void handleAssign(q.id)}
                className="min-h-[44px] px-4 rounded-xl bg-[#16803C] text-white text-xs font-semibold"
              >
                Assign Expert
              </button>
            </div>
          </div>
        ))}
      </div>
    </WorkspaceShell>
  );
};
