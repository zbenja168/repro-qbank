import { useState, useEffect } from 'react';
import { TopicsIndex, Category } from '../types/topic';
import { CategoryAccordion } from '../components/TopicFilter/CategoryAccordion';
import { TopicStat } from '../hooks/useTopicProgress';
import { ProgressData } from '../types/progress';
import { getOverallStats } from '../utils/stats';
import { BrandCard } from '../components/Brand';
import { ProgressSummary } from '../components/ProgressSummary';
import { MembraneDivider } from '../components/Membrane';
import type { ReviewMode } from './ReviewPage';
import { SkinName, SkinAccess, applySkin, savedSkin, loadSkinAccess } from '../utils/skin';

interface Props {
  topics: TopicsIndex;
  selectedTopicIds: Set<string>;
  selectedCount: number;
  extrasTopicIds: Set<string>;
  /** Extras available on the current selection but not switched on. */
  availableExtras: number;
  topicStats?: Map<string, TopicStat> | null;
  progress: ProgressData;
  onToggleTopic: (topicId: string) => void;
  onToggleCategory: (category: Category) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onToggleExtras: (topicId: string) => void;
  onToggleCategoryExtras: (category: Category) => void;
  onSetAllExtras: (on: boolean) => void;
  onStartQuiz: () => void;
  onGoToDashboard: () => void;
  onGoToReview: (mode?: ReviewMode) => void;
  onClearProgress: () => void;
}

export function HomePage({
  topics, selectedTopicIds, selectedCount, extrasTopicIds, availableExtras,
  topicStats, progress,
  onToggleTopic, onToggleCategory, onSelectAll, onClearAll,
  onToggleExtras, onToggleCategoryExtras, onSetAllExtras,
  onStartQuiz, onGoToDashboard, onGoToReview, onClearProgress,
}: Props) {
  const stats = getOverallStats(progress);
  // The endocrine bank (and a handful of never-extended bricks) ship 12
  // questions and nothing more, so the whole control hides itself there.
  const extraTopics = topics.categories.flatMap(c => c.topics).filter(t => (t.extraCount ?? 0) > 0);
  const anyExtras = extraTopics.length > 0;
  const allExtrasOn = anyExtras && extraTopics.every(t => extrasTopicIds.has(t.id));
  const missedCount = Object.values(progress.answers).filter((a) => !a.isCorrect).length;
  const bookmarkCount = progress.bookmarkedQuestions.length;

  const [skin, setSkin] = useState<SkinName>(savedSkin);
  const [skinAccess, setSkinAccess] = useState<SkinAccess | null>(null);
  useEffect(() => { loadSkinAccess().then(setSkinAccess); }, []);
  const skinLocked = skinAccess !== null && skinAccess !== 'ok';
  function chooseSkin(next: SkinName) {
    if (skinLocked && next !== 'off') return;
    setSkin(next);
    applySkin(next);
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100">Repro QBank</h1>
            <p className="text-sm text-slate-400">Reproductive Systems &amp; Breast Health Question Bank</p>
          </div>
          {/* One action group; the cross-link used to float alone. */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {stats.total > 0 && (
              <button
                onClick={onGoToDashboard}
                className="px-4 py-2 text-sm rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Dashboard ({stats.percentage}%)
              </button>
            )}
            {missedCount > 0 && (
              <button
                onClick={() => onGoToReview('incorrect')}
                className="px-4 py-2 text-sm rounded-lg border border-amber-600 bg-amber-500/10 text-amber-400 font-medium hover:bg-amber-500/20 transition-colors"
                title="Redo the questions you got wrong"
              >
                🔁 Missed ({missedCount})
              </button>
            )}
            {bookmarkCount > 0 && (
              <button
                onClick={() => onGoToReview()}
                className="px-4 py-2 text-sm rounded-lg border border-amber-700 text-amber-400 hover:bg-amber-900/30 transition-colors"
              >
                Bookmarked ({bookmarkCount})
              </button>
            )}
            <a
              href="https://zbenja168.github.io/repro-dragndrop/"
              className="text-xs px-3 py-2 rounded-lg text-slate-500 hover:text-teal-400 transition-colors"
            >
              Repro Games &rarr;
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <BrandCard />

        {/* Where you are in the bank */}
        { stats.total > 0 && (
          <ProgressSummary
            answered={stats.total}
            correct={Math.round(stats.total * stats.percentage / 100)}
            total={topics?.totalQuestions ?? stats.total}
            onReset={onClearProgress}
          />
        )}

        {/* Filter controls */}
        {/* Settings first, then the list — they used to share a row. */}
        <div className="mb-5">
          {/* Exam skins — re-dress the quiz to look like the interfaces you
              actually sit exams in. Signed-in Active Transport accounts only. */}
          <div className="mt-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-400">Skin</span>
              <div className="inline-flex rounded-xl border border-slate-700 bg-slate-800 p-1">
                {([
                  ['off', 'Off'],
                  ['examplify', 'Examplify Skin'],
                  ['examplify-dark', 'Examplify Dark'],
                  ['nbme', 'NBME Skin'],
                ] as [SkinName, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => chooseSkin(value)}
                    disabled={skinLocked && value !== 'off'}
                    title={skinLocked && value !== 'off'
                      ? 'Sign in to Active Transport to use the exam skins'
                      : undefined}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                      skin === value
                        ? 'bg-blue-600 text-white'
                        : skinLocked && value !== 'off'
                          ? 'text-slate-600 cursor-not-allowed'
                          : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl">
              {skinLocked
                ? 'Sign in to Active Transport and open this QBank from the hub to practise in an exam-style interface.'
                : skin === 'off'
                  ? 'Practise in an interface that looks like the software you sit exams in.'
                  : 'Exam skin on — right and wrong are still marked the usual way.'}
            </p>
          </div>
        </div>

        <MembraneDivider />

        <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
          <h2 className="text-lg font-semibold text-slate-200">Select Topics</h2>
          <div className="flex items-center gap-3">
            <button onClick={onSelectAll} className="text-sm text-blue-400 hover:text-blue-300">Select All</button>
            <span className="text-slate-600">|</span>
            <button onClick={onClearAll} className="text-sm text-blue-400 hover:text-blue-300">Clear All</button>
            {anyExtras && (
              <>
                <span className="text-slate-600">|</span>
                <button
                  onClick={() => onSetAllExtras(!allExtrasOn)}
                  className="text-sm text-teal-400 hover:text-teal-300"
                >
                  {allExtrasOn ? 'Core only' : 'Add all extras'}
                </button>
              </>
            )}
          </div>
        </div>
        {anyExtras && (
          <p className="text-sm text-slate-400 mb-4">
            Each topic starts with the core questions that cover it. Use the
            <span className="mx-1 text-xs px-1.5 py-0.5 rounded border border-slate-600 text-slate-400">+24</span>
            next to a topic to add the rest when you want to go deeper.
            {availableExtras > 0 && (
              <span className="text-slate-500"> {availableExtras} more available on your current selection.</span>
            )}
          </p>
        )}

        {/* Category accordions, grouped by teaching week so a student revising
            one week of the block can find its topics together. Falls back to a
            flat list if the data has no week on it. */}
        <div className="mb-8">
          {topics.categories.map((cat, i) => {
            const prev = i > 0 ? topics.categories[i - 1] : undefined;
            const startsWeek = cat.week !== undefined && cat.week !== prev?.week;
            const inWeek = topics.categories.filter(c => c.week === cat.week);
            const topicCount = inWeek.reduce((n, c) => n + c.topics.length, 0);
            const questionCount = inWeek.reduce(
              (n, c) => n + c.topics.reduce((m, t) => m + t.questionCount, 0), 0);
            return (
              <div key={cat.id}>
                {startsWeek && (
                  <div className={`flex items-baseline gap-3 flex-wrap rounded-lg border border-blue-900/60 bg-blue-950/30 px-4 py-3 ${i === 0 ? 'mb-3' : 'mt-6 mb-3'}`}>
                    <span className="text-base font-bold text-blue-300">{cat.weekName}</span>
                    <span className="text-sm text-slate-300">{cat.weekSubtitle}</span>
                    <span className="ml-auto text-xs text-slate-500 whitespace-nowrap">
                      {topicCount} topics &middot; {questionCount} questions
                    </span>
                  </div>
                )}
                <div className="mb-2">
                  <CategoryAccordion
                    category={cat}
                    selectedTopicIds={selectedTopicIds}
                    extrasTopicIds={extrasTopicIds}
                    topicStats={topicStats}
                    onToggleTopic={onToggleTopic}
                    onToggleCategory={onToggleCategory}
                    onToggleExtras={onToggleExtras}
                    onToggleCategoryExtras={onToggleCategoryExtras}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Start button */}
        <div className="sticky bottom-0 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent pt-6 pb-6 -mx-4 px-4">
          <button
            onClick={onStartQuiz}
            disabled={selectedCount === 0}
            className="w-full py-4 rounded-xl bg-blue-600 text-white font-semibold text-lg hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            {selectedCount > 0
              ? `Start Quiz (${selectedCount} questions)`
              : 'Select topics to begin'}
          </button>
        </div>
      </main>
    </div>
  );
}
