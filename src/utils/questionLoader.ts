import { CategoryQuestions } from '../types/question';
import { extrasFor, extrasStatus } from './extras';

const cache = new Map<string, CategoryQuestions>();

export async function loadCategoryQuestions(categoryId: string): Promise<CategoryQuestions> {
  // The public file holds the core questions; a signed-in visitor's extras are
  // appended from activetransport.app. Keyed on the extras status too, so a
  // category loaded before sign-in is refetched with its extras afterwards.
  const withExtras = extrasStatus() === 'ok';
  const key = `${categoryId}:${withExtras ? 'x' : ''}`;
  if (cache.has(key)) {
    return cache.get(key)!;
  }
  const resp = await fetch(`${import.meta.env.BASE_URL}data/questions/${categoryId}.json`);
  if (!resp.ok) throw new Error(`Failed to load questions for ${categoryId}`);
  const data: CategoryQuestions = await resp.json();
  if (withExtras) {
    const extra = await extrasFor(categoryId);
    if (extra.length) data.questions = data.questions.concat(extra);
  }
  cache.set(key, data);
  return data;
}

export async function loadMultipleCategories(categoryIds: string[]): Promise<CategoryQuestions[]> {
  return Promise.all(categoryIds.map(loadCategoryQuestions));
}

export function clearCache(): void {
  cache.clear();
}
