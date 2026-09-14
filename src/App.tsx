import { useState, useCallback, useEffect } from 'react';
import { useTopicProgress } from './hooks/useTopicProgress';
import { setCompletedTopicIds, useTopics } from './hooks/useTopics';
import { useProgress } from './hooks/useProgress';
import { useQuestions } from './hooks/useQuestions';
import { MembraneLoader } from './components/Membrane';
import { HomePage } from './pages/HomePage';
import { QuizPage } from './pages/QuizPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReviewPage, type ReviewMode } from './pages/ReviewPage';
import { BrandBadge } from './components/Brand';
import { track } from './utils/track';
import { restoreSkin } from './utils/skin';

type Page = 'home' | 'quiz' | 'dashboard' | 'review';

function AppShell() {
  // Re-apply a saved exam skin, and drop it if the account that
  // unlocked it is no longer signed in.
  useEffect(() => { restoreSkin(); }, []);

  const [page, setPage] = useState<Page>('home');
  const topicsHook = useTopics();
  const { progress, recordAnswer, recordSession, toggleBookmark, clearAllProgress } = useProgress();
  const { questions, loading: questionsLoading, loadQuestions, loadAllQuestions } = useQuestions();
  // What is left in each topic, so the picker can show remaining rather than
  // total and a finished topic can grey itself out.
  const { stats: topicStats, answeredIds } = useTopicProgress(topicsHook.topics, progress);
  // Keep bulk selection in step with what is finished.
  setCompletedTopicIds(new Set(
    topicStats ? Array.from(topicStats).filter(([, v]) => v.complete).map(([k]) => k) : []));

  // Load all questions for dashboard/review
  const allCategoryIds = topicsHook.topics?.categories.map(c => c.id) ?? [];

  const handleStartQuiz = useCallback(async () => {
    await loadQuestions(topicsHook.categoriesForSelected, topicsHook.selectedTopicIds, answeredIds);
    track('quiz_start');
    setPage('quiz');
  }, [loadQuestions, topicsHook.categoriesForSelected, topicsHook.selectedTopicIds]);

  const handleGoToDashboard = useCallback(async () => {
    if (allCategoryIds.length > 0) {
      await loadAllQuestions(allCategoryIds);
    }
    setPage('dashboard');
  }, [loadAllQuestions, allCategoryIds]);

  const [reviewMode, setReviewMode] = useState<ReviewMode>('bookmarked');
  const handleGoToReview = useCallback(async (mode: ReviewMode = 'bookmarked') => {
    setReviewMode(mode);
    if (allCategoryIds.length > 0) {
      await loadAllQuestions(allCategoryIds);
    }
    setPage('review');
  }, [loadAllQuestions, allCategoryIds]);

  // Handle hash routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash === '/dashboard') handleGoToDashboard();
      else if (hash === '/review') handleGoToReview();
      else if (hash === '/missed') handleGoToReview('incorrect');
      else setPage('home');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [handleGoToDashboard, handleGoToReview]);

  if (topicsHook.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center w-full max-w-xl px-4">
          <MembraneLoader label="Loading question bank…" />
        </div>
      </div>
    );
  }

  if (!topicsHook.topics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-red-400">Failed to load topics. Check that data/topics.json exists.</p>
      </div>
    );
  }

  if (questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center w-full max-w-xl px-4">
          <MembraneLoader label="Loading questions…" />
        </div>
      </div>
    );
  }

  switch (page) {
    case 'quiz':
      return (
        <QuizPage
          questions={questions}
          progress={progress}
          onRecordAnswer={recordAnswer}
          onRecordSession={recordSession}
          onToggleBookmark={toggleBookmark}
          onExit={() => { setPage('home'); window.location.hash = ''; }}
          selectedTopicIds={Array.from(topicsHook.selectedTopicIds)}
        />
      );
    case 'dashboard':
      return (
        <DashboardPage
          progress={progress}
          questions={questions}
          totalQuestions={topicsHook.topics.totalQuestions}
          onBack={() => { setPage('home'); window.location.hash = ''; }}
          onClearProgress={clearAllProgress}
        />
      );
    case 'review':
      return (
        <ReviewPage
          initialMode={reviewMode}
          questions={questions}
          progress={progress}
          onRecordAnswer={recordAnswer}
          onToggleBookmark={toggleBookmark}
          onBack={() => { setPage('home'); window.location.hash = ''; }}
        />
      );
    default:
      return (
        <HomePage
          topics={topicsHook.topics}
          selectedTopicIds={topicsHook.selectedTopicIds}
          selectedCount={topicsHook.selectedCount}
          topicStats={topicStats}
          progress={progress}
          onToggleTopic={topicsHook.toggleTopic}
          onToggleCategory={topicsHook.toggleCategory}
          onSelectAll={topicsHook.selectAll}
          onClearAll={topicsHook.clearAll}
          onStartQuiz={handleStartQuiz}
          onGoToDashboard={handleGoToDashboard}
          onGoToReview={handleGoToReview}
          onClearProgress={clearAllProgress}
        />
      );
  }
}

export default function App() {
  return (
    <>
      <BrandBadge />
      <AppShell />
    </>
  );
}
