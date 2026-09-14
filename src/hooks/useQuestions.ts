import { useState, useCallback } from 'react';
import { Question } from '../types/question';
import { loadMultipleCategories } from '../utils/questionLoader';
import { shuffle } from '../utils/shuffle';

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  const loadQuestions = useCallback(async (
    categoryIds: string[],
    selectedTopicIds: Set<string>,
    /** Questions already answered, excluded from the quiz. */
    excludeIds?: Set<string>
  ) => {
    setLoading(true);
    try {
      const categories = await loadMultipleCategories(categoryIds);
      const all = categories.flatMap(c => c.questions);
      const inTopics = all.filter(q => selectedTopicIds.has(q.topicId));
      // A quiz serves what is LEFT in the chosen topics, so picking a topic you
      // are 6 of 12 through gives you those 6. If everything in the selection is
      // done, serve it all rather than an empty quiz - the picker greys finished
      // topics out, so getting here means the reader chose to redo them.
      const fresh = excludeIds && excludeIds.size
        ? inTopics.filter(q => !excludeIds.has(q.id))
        : inTopics;
      const filtered = fresh.length ? fresh : inTopics;
      setQuestions(shuffle(filtered));
    } catch (err) {
      console.error('Failed to load questions:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllQuestions = useCallback(async (categoryIds: string[]) => {
    setLoading(true);
    try {
      const categories = await loadMultipleCategories(categoryIds);
      const all = categories.flatMap(c => c.questions);
      setQuestions(all);
    } catch (err) {
      console.error('Failed to load questions:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { questions, loading, loadQuestions, loadAllQuestions };
}
