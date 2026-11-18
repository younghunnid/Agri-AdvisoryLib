import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Layers,
  MessageSquare,
  Sprout,
  Users,
} from 'lucide-react';
import {buildSoilAdvisory} from '../../data/weatherSoilMinistry';
import {SpeakButton} from '../../components/SpeakButton';

const SOIL_EDUCATION_CARDS = [
  {
    id: 'compost',
    title: 'Making Rich Farm Compost',
    summary: 'Turn dry grass, cassava peels, kitchen greens, and well-aged animal manure into dark organic soil food.',
    steps: [
      'Stack brown dry grass and green plant waste in alternating layers in a shaded spot.',
      'Keep damp like a wrung-out sponge and turn with a shovel every 2 weeks.',
      'Mix cured dark compost into planting beds 1–2 weeks before sowing.',
    ],
  },
  {
    id: 'organic',
    title: 'Organic Fertilizer & Mulching Safety',
    summary: 'Fresh manure burns young seedlings; always age manure or mix it inside compost first.',
    steps: [
      'Cover bare garden beds with dry grass mulch so heavy rain does not wash topsoil away.',
      'Rotate upland rice or maize with groundnuts or cowpeas to replenish natural soil nitrogen.',
      'Keep compost piles and manure pits away from wells and drinking streams.',
    ],
  },
  {
    id: 'safety',
    title: 'Chemical Fertilizer Safety & Testing',
    summary: 'Never guess NPK chemical rates without checking soil moisture, drainage, and crop stage.',
    steps: [
      'Drain standing water first—fertilizer added to flooded roots simply washes away.',
      'Never let concentrated fertilizer granules touch tender seedling stems directly.',
      'Contact county agricultural offices before buying bulk lime or commercial fertilizers.',
    ],
  },
];

export const SoilAdvisoryPage: React.FC = () => {
  const [crop, setCrop] = useState('Rice');
  const [condition, setCondition] = useState('sandy');
  const [problem, setProblem] = useState('yellowing');

  const advice = buildSoilAdvisory(crop, condition, problem);
  const fullAudio = `${advice.headline}. ${advice.likelyFactors.join('. ')}. Recommended organic steps: ${advice.safeOrganicSteps.join('. ')}. ${advice.fertilizerSafety} ${advice.whenToTestSoil}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="rounded-3xl bg-[#183B2B] text-white p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#F5B942]">
            <Layers className="w-4 h-4" aria-hidden="true" />
            <span>Module 6 · Soil Health &amp; Fertilizer Advisory · Working Prototype</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">
            Soil &amp; Fertilizer Advisory Tool
          </h1>
          <p className="text-sm sm:text-base text-white/85 leading-relaxed">
            Select your crop, soil condition, and field observation to get clear compost, drainage, and soil-testing guidance without risky fertilizer guesswork.
          </p>
        </div>

        <SpeakButton
          id="soil-advisory-main"
          label="Soil Advisory Result"
          text={fullAudio}
        />
      </div>

      {/* INTERACTIVE 3-STEP SOIL ADVISORY TOOL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 rounded-3xl bg-white border border-[#183B2B]/10 p-6 space-y-5">
          <h2 className="font-display text-xl font-bold text-[#183B2B]">
            1-2-3 Soil Check Selector
          </h2>

          <div>
            <label htmlFor="soil-crop" className="block text-sm font-semibold mb-1.5">
              1. Select Crop Type
            </label>
            <select
              id="soil-crop"
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full min-h-[46px] rounded-xl border border-[#183B2B]/20 px-3 text-sm font-semibold"
            >
              {['Rice', 'Cassava', 'Maize', 'Pepper & Vegetables', 'Plantain', 'Sweet Potatoes'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="soil-cond" className="block text-sm font-semibold mb-1.5">
              2. General Soil Condition
            </label>
            <select
              id="soil-cond"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full min-h-[46px] rounded-xl border border-[#183B2B]/20 px-3 text-sm font-semibold"
            >
              <option value="sandy">Sandy / Light Weak Soil</option>
              <option value="clay">Heavy Red Clay / Hard Crust</option>
              <option value="waterlogged">Waterlogged / Swamp Edge</option>
              <option value="sloped">Sloped Upland / Rain Runoff</option>
              <option value="loamy">Dark Loamy / Repeatedly Farmed</option>
            </select>
          </div>

          <div>
            <label htmlFor="soil-prob" className="block text-sm font-semibold mb-1.5">
              3. Observed Problem
            </label>
            <select
              id="soil-prob"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="w-full min-h-[46px] rounded-xl border border-[#183B2B]/20 px-3 text-sm font-semibold"
            >
              <option value="yellowing">Yellowing / Pale Leaves &amp; Weak Growth</option>
              <option value="erosion">Rain Washing Away Topsoil &amp; Seeds</option>
              <option value="low_yield">Small Harvest After Repeated Planting</option>
              <option value="hard_soil">Hard Dry Ground / Poor Root Depth</option>
            </select>
          </div>

          <div className="pt-2 flex flex-wrap gap-2.5">
            <Link
              to={`/advisor?topic=soil&q=${encodeURIComponent(`My ${crop} is in ${condition} soil showing ${problem}. What safe soil and compost steps should I take?`)}`}
              className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#16803C] text-white text-xs sm:text-sm font-bold hover:bg-[#116630]"
            >
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
              <span>Ask AI About Soil</span>
            </Link>
            <Link
              to="/experts"
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#F5B942] text-[#183B2B] text-xs sm:text-sm font-bold"
            >
              <Users className="w-4 h-4" aria-hidden="true" />
              <span>Ask Expert</span>
            </Link>
          </div>
        </div>

        {/* ADVISORY OUTPUT PANEL */}
        <div className="lg:col-span-7 rounded-3xl bg-white border border-[#16803C]/30 p-6 sm:p-7 space-y-5">
          <div className="flex items-start justify-between gap-3 border-b border-[#183B2B]/10 pb-3">
            <div>
              <p className="text-xs font-semibold text-[#16803C]">
                Educational Soil Result · Educational Guidance Only
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#183B2B]">
                {advice.headline}
              </h2>
            </div>
            <SpeakButton
              compact
              id="soil-result-card"
              label={advice.headline}
              text={fullAudio}
            />
          </div>

          <div className="space-y-2">
            <h3 className="font-display font-bold text-sm sm:text-base text-[#183B2B]">
              Possible Soil Factors to Check
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#183B2B]/85">
              {advice.likelyFactors.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-[#DDEFE0] p-4 sm:p-5 space-y-2">
            <h3 className="font-display font-bold text-sm sm:text-base text-[#183B2B] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16803C]" aria-hidden="true" />
              <span>Safe Compost &amp; Land Preparation Steps</span>
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#183B2B]">
              {advice.safeOrganicSteps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-2.5 text-xs sm:text-sm text-amber-950">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-bold">Fertilizer Prescription Guardrail</p>
              <p>{advice.fertilizerSafety}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#F3F8F0] p-4 flex items-start gap-2.5 text-xs sm:text-sm text-[#183B2B]/85">
            <FlaskConical className="w-5 h-5 text-[#16803C] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-bold text-[#183B2B]">When Soil Testing or an Expert Is Needed</p>
              <p>{advice.whenToTestSoil}</p>
            </div>
          </div>
        </div>
      </div>

      {/* EDUCATIONAL SOIL & FERTILIZER GUIDES */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-bold text-[#183B2B]">
            Soil Fertility, Compost &amp; Fertilizer Safety Guides
          </h2>
          <Link to="/crops" className="text-sm font-semibold text-[#16803C] hover:underline inline-flex items-center gap-1">
            <Sprout className="w-4 h-4" aria-hidden="true" />
            <span>Open Crop Knowledge Library</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SOIL_EDUCATION_CARDS.map((card) => (
            <article key={card.id} className="rounded-3xl bg-white border border-[#183B2B]/10 p-5 sm:p-6 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg font-bold text-[#183B2B]">{card.title}</h3>
                <SpeakButton
                  compact
                  id={`soil-edu-${card.id}`}
                  label={card.title}
                  text={`${card.title}. ${card.summary}. ${card.steps.join('. ')}`}
                />
              </div>
              <p className="text-sm text-[#183B2B]/80">{card.summary}</p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-[#183B2B]/80">
                {card.steps.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
