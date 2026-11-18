import React, {useState} from 'react';
import {CheckCircle2, MessageSquare} from 'lucide-react';
import {apiFetch} from '../../lib/api';
import {useApp} from '../../context/AppContext';

const COUNTIES = [
  'Bomi', 'Bong', 'Gbarpolu', 'Grand Bassa', 'Grand Cape Mount',
  'Grand Gedeh', 'Grand Kru', 'Lofa', 'Margibi', 'Maryland',
  'Montserrado', 'Nimba', 'River Cess', 'River Gee', 'Sinoe',
];

export const ContactFeedbackPage: React.FC = () => {
  const {user, isOnline} = useApp();
  const [name, setName] = useState(user?.displayName || '');
  const [contactInfo, setContactInfo] = useState('');
  const [county, setCounty] = useState(user?.county || '');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch('/feedback', {
        method: 'POST',
        body: JSON.stringify({name, contactInfo, county, category, message}),
      });
      setSubmitted(true);
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#16803C]">Contact &amp; Community Feedback</p>
        <h1 className="font-display text-3xl font-extrabold text-[#183B2B]">Share Feedback with Team 8</h1>
        <p className="text-sm sm:text-base text-[#183B2B]/80">
          Tell us which crops, pests, or local language improvements would help farmers in your county most.
        </p>
      </div>

      {submitted ? (
        <div className="rounded-3xl bg-white border border-[#16803C]/30 p-8 text-center space-y-4">
          <CheckCircle2 className="w-10 h-10 text-[#16803C] mx-auto" aria-hidden="true" />
          <h2 className="font-display text-2xl font-bold text-[#183B2B]">Thank you for your feedback</h2>
          <p className="text-sm text-[#183B2B]/80">
            Your message has been saved for Team 8 and platform reviewers.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#16803C] text-white text-sm font-semibold"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="rounded-3xl bg-white border border-[#183B2B]/10 p-6 sm:p-8 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fb-name" className="block text-sm font-semibold mb-1.5">
                Your Name
              </label>
              <input
                id="fb-name"
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="fb-contact" className="block text-sm font-semibold mb-1.5">
                Phone or Email (Optional)
              </label>
              <input
                id="fb-contact"
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="+231..."
                className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3.5 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fb-county" className="block text-sm font-semibold mb-1.5">
                County (Optional)
              </label>
              <select
                id="fb-county"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3 text-sm"
              >
                <option value="">Select county</option>
                {COUNTIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="fb-category" className="block text-sm font-semibold mb-1.5">
                Feedback Type
              </label>
              <select
                id="fb-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3 text-sm"
              >
                <option value="general">General Feedback</option>
                <option value="guide_suggestion">Suggest a Crop Guide</option>
                <option value="translation">Language &amp; Accessibility</option>
                <option value="bug_report">Report a Problem</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="fb-message" className="block text-sm font-semibold mb-1.5">
              Message
            </label>
            <textarea
              id="fb-message"
              rows={4}
              required
              minLength={10}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your suggestion or question..."
              className="w-full rounded-2xl border border-[#183B2B]/20 p-3.5 text-sm"
            />
          </div>

          {error && (
            <div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !isOnline}
            className="inline-flex items-center gap-2 min-h-[48px] px-6 py-3 rounded-2xl bg-[#16803C] text-white text-sm font-semibold hover:bg-[#116630] disabled:opacity-50"
          >
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
            <span>{submitting ? 'Sending...' : 'Send Feedback'}</span>
          </button>
        </form>
      )}
    </div>
  );
};
