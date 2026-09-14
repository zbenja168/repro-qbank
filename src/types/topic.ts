export interface Topic {
  id: string;
  name: string;
  sourceFile: string;
  questionCount: number;
}

export interface Category {
  id: string;
  name: string;
  topics: Topic[];
  /** Teaching week this category belongs to; the picker groups by it. */
  week?: number;
  weekName?: string;
  weekSubtitle?: string;
}

export interface TopicsIndex {
  categories: Category[];
  totalQuestions: number;
}
