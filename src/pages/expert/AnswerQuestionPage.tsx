import React, {useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {ArrowLeft, Send} from 'lucide-react';
import {apiFetch} from '../../lib/api';
import {WorkspaceShell} from '../../components/WorkspaceShell';
import {EXPERT_NAV} from './ExpertDashboardPage';

interface QuestionDetail {
  id: number;
  topic: string;
  county: string;
  title: string;
  description: string;
  status: string;
  crop_name: string | null;
  farmer_name: string;
}

interface Message {
  id: number;
  sender_role: string;
  sender_name: string;
  message_text: string;
  is_official_expert_advice: number;
  created_at: string;
}

export const AnswerQuestionPage: React.FC = () => {
  const {id} = useParams<{id: string}>();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [responseText, setResponseText] = useState('');
  const [nextStatus, setNextStatus] = useState<'Answered' | 'Awaiting Clarification' | 'Closed'>('Answered');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = () => {
    if (!id) return;
    apiFetch<{question: QuestionDetail; messages: Message[]}>(`/expert/questions/${id}`)
      .then((res) => {
        setQuestion(res.question);
        setMessages(res.messages);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load question.'));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      await apiFetch(`/expert/questions/${id}/respond`, {
        method: 'POST',
        body: JSON.stringify({messageText: responseText, status: nextStatus}),
      });
      setResponseText('');
      setNotice(`Response saved and question marked as "${nextStatus}".`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WorkspaceShell
      kicker="Expert Workspace"
      title="Answer Farmer Question"
      navItems={EXPERT_NAV}
    >
      <div className="space-y-5 max-w-4xl">
        <Link to="/expert/questions" className="inline-flex items-center gap-2 min-h-[44px] text-sm font-semibold text-[#16803C] hover:underline">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Assigned Questions</span>
        </Link>

        {error && (
          <div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="rounded-xl bg-[#DDEFE0] p-3 text-sm font-medium text-[#183B2B]">
            {notice}
          </div>
        )}

        {question && (
          <div className="rounded-3xl bg-white border border-[#183B2B]/10 p-6 sm:p-8 space-y-6">
            <div className="border-b border-[#183B2B]/10 pb-4 space-y-1">
              <p className="text-xs text-[#183B2B]/65">
                {question.status} · {question.crop_name || 'General'} · {question.topic} · {question.county} County · Farmer: {question.farmer_name}
              </p>
              <h2 className="font-display text-2xl font-bold text-[#183B2B]">{question.title}</h2>
            </div>

            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-2xl p-4 text-sm space-y-1 ${
                    m.sender_role === 'expert' ? 'bg-[#DDEFE0]' : 'bg-[#F3F8F0]'
                  }`}
                >
                  <p className="text-xs font-semibold text-[#183B2B]/75">
                    {m.sender_name}
                    {m.is_official_expert_advice ? ' · Official Expert Advice' : ''} · {m.created_at}
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.message_text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 border-t border-[#183B2B]/10 pt-5">
              <div>
                <label htmlFor="expert-status" className="block text-sm font-semibold mb-1.5">
                  Update Question Status
                </label>
                <select
                  id="expert-status"
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as typeof nextStatus)}
                  className="min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3 text-sm"
                >
                  <option value="Answered">Mark Answered</option>
                  <option value="Awaiting Clarification">Request Clarification from Farmer</option>
                  <option value="Closed">Close Case</option>
                </select>
              </div>

              <div>
                <label htmlFor="expert-reply-box" className="block text-sm font-semibold mb-1.5">
                  Expert Advice or Clarification Request
                </label>
                <textarea
                  id="expert-reply-box"
                  rows={5}
                  required
                  minLength={10}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Provide clear, practical, low-risk guidance tailored to Liberia..."
                  className="w-full rounded-2xl border border-[#183B2B]/20 p-3.5 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 min-h-[48px] px-6 py-3 rounded-2xl bg-[#16803C] text-white text-sm font-semibold hover:bg-[#116630] disabled:opacity-50"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>{submitting ? 'Sending...' : 'Publish Expert Response'}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
};
