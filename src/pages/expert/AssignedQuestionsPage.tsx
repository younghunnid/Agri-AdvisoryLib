import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {apiFetch} from '../../lib/api';
import {WorkspaceShell} from '../../components/WorkspaceShell';
import {EXPERT_NAV} from './ExpertDashboardPage';

interface AssignedQ {
  id: number;
  topic: string;
  county: string;
  title: string;
  description: string;
  status: string;
  crop_name: string | null;
  farmer_name: string;
  updated_at: string;
}

export const AssignedQuestionsPage: React.FC = () => {
  const [questions, setQuestions] = useState<AssignedQ[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{questions: AssignedQ[]}>('/expert/questions')
      .then((res) => setQuestions(res.questions))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const filtered = questions.filter((q) => (filter === 'all' ? true : q.status === filter));

  return (
    <WorkspaceShell
      kicker="Expert Workspace"
      title="Assigned Questions"
      subtitle="Farmer phone numbers and private contact details are protected and hidden from public view."
      navItems={EXPERT_NAV}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'Assigned', 'Awaiting Clarification', 'Answered', 'Closed'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold ${
                filter === st ? 'bg-[#183B2B] text-white' : 'bg-white border border-[#183B2B]/15 text-[#183B2B]'
              }`}
            >
              {st === 'all' ? 'All Cases' : st}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-[#183B2B]/70">Loading assigned questions...</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl bg-white border border-[#183B2B]/10 p-8 text-center text-sm text-[#183B2B]/75">
            No questions match this status filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((q) => (
              <div
                key={q.id}
                className="rounded-2xl bg-white border border-[#183B2B]/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="text-xs text-[#183B2B]/65">
                    {q.status} · {q.crop_name || 'General'} · {q.topic} · {q.county} County · Farmer: {q.farmer_name}
                  </p>
                  <h2 className="font-display text-lg font-bold text-[#183B2B]">{q.title}</h2>
                  <p className="text-sm text-[#183B2B]/80 line-clamp-2">{q.description}</p>
                </div>
                <Link
                  to={`/expert/questions/${q.id}`}
                  className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#16803C] text-white text-sm font-semibold hover:bg-[#116630] shrink-0"
                >
                  Open Case
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
};
