import { useState, useEffect, useCallback } from 'react';
import { TopicsIndex, Category } from '../types/topic';

/** Topic ids to leave out of bulk selection — the completed ones. Set by App
 *  once the per-topic counts are known; empty until then, which just means
 *  Select All behaves as it always did. */
let completedTopicIds: Set<string> = new Set();
export function setCompletedTopicIds(ids: Set<string>) { completedTopicIds = ids; }

export function useTopics() {
  const [topics, setTopics] = useState<TopicsIndex | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/topics.json`)
      .then(r => r.json())
      .then((data: TopicsIndex) => {
        setTopics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleTopic = useCallback((topicId: string) => {
    setSelectedTopicIds(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }, []);

  const toggleCategory = useCallback((category: Category) => {
    setSelectedTopicIds(prev => {
      const next = new Set(prev);
      // Completed topics are skipped: ticking a category should queue up what
      // is left in it, not re-serve questions already answered.
      const pickable = category.topics.filter(t => !completedTopicIds.has(t.id));
      const target = pickable.length ? pickable : category.topics;
      const allSelected = target.every(t => next.has(t.id));
      for (const t of target) {
        if (allSelected) next.delete(t.id);
        else next.add(t.id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!topics) return;
    const all = new Set<string>();
    for (const cat of topics.categories) {
      for (const t of cat.topics) if (!completedTopicIds.has(t.id)) all.add(t.id);
    }
    setSelectedTopicIds(all);
  }, [topics]);

  const clearAll = useCallback(() => {
    setSelectedTopicIds(new Set());
  }, []);

  const selectedCount = topics
    ? topics.categories.reduce((sum, cat) =>
        sum + cat.topics.reduce((s, t) =>
          s + (selectedTopicIds.has(t.id) ? t.questionCount : 0), 0), 0)
    : 0;

  const categoriesForSelected = topics
    ? [...new Set(
        topics.categories
          .filter(cat => cat.topics.some(t => selectedTopicIds.has(t.id)))
          .map(cat => cat.id)
      )]
    : [];

  return {
    topics,
    loading,
    selectedTopicIds,
    selectedCount,
    categoriesForSelected,
    toggleTopic,
    toggleCategory,
    selectAll,
    clearAll,
    setSelectedTopicIds,
  };
}
