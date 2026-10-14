export type SupportedLanguage = 'english' | 'spanish' | 'german' | 'korean' | 'chinese';

export type LanguageLevel = 'beginner' | 'intermediate' | 'advanced';

export type ExerciseType = 'quiz' | 'translation' | 'vocabulary' | 'full_assignment';

export interface LanguageInfo {
  id: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  description: string;
  standards: string; // e.g. "CEFR (A1-C2) & TOEIC", "HSK 1-6", "TOPIK 1-6"
  accentColor: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  romanization?: string; // For Korean/Chinese (Pinyin/Romaja)
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  hint?: string;
}

export interface VocabularyItem {
  id: string;
  word: string;
  romanization?: string; // Pinyin / Hangul Romaja
  translation: string;
  partOfSpeech: string;
  exampleSentence: string;
  exampleTranslation: string;
  notes?: string;
}

export interface TranslationChallenge {
  id: string;
  sourceText: string;
  sourceLang: 'fr' | SupportedLanguage;
  targetLang: SupportedLanguage | 'fr';
  romanization?: string;
  expectedTranslation: string;
  acceptedKeywords: string[];
  grammarTip: string;
}

export interface GeneratedExercise {
  id: string;
  language: SupportedLanguage;
  level: LanguageLevel;
  type: ExerciseType;
  title: string;
  instructions: string;
  createdAt: string;
  estimatedMinutes: number;
  
  // Specific data depending on type
  quizQuestions?: QuizQuestion[];
  vocabItems?: VocabularyItem[];
  translationChallenges?: TranslationChallenge[];
  
  // For full homework / assignment
  assignmentSubject?: {
    readingPassage?: string;
    readingPassageRomanized?: string;
    readingTranslation?: string;
    comprehensionQuestions: string[];
    grammarTask: string;
    essayPrompt: string;
  };
}

export interface ErrorCorrection {
  originalSegment: string;
  correctedSegment: string;
  explanation: string;
  ruleCategory: 'grammar' | 'vocabulary' | 'spelling' | 'particles_or_tones' | 'conjugation' | 'syntax';
}

export interface AssignmentEvaluation {
  id: string;
  exerciseId?: string;
  language: SupportedLanguage;
  level: LanguageLevel;
  studentName?: string;
  submittedAt: string;
  exerciseTitle: string;
  score: number; // out of 20
  maxScore: number; // 20
  percentageScore: number;
  gradeLabel: string; // "Excellent (A+)", "Très bien (B+)", "Bien (B)", "Encourageant (C)", etc.
  teacherSummary: string;
  strengths: string[];
  corrections: ErrorCorrection[];
  correctedVersionFull: string;
  suggestedRevisionTopics: string[];
  pedagogicalAdvice: string;
}

export interface StudentProgress {
  totalExercisesCompleted: number;
  totalAssignmentsEvaluated: number;
  averageScoreOutOf20: number;
  languageBreakdown: Record<SupportedLanguage, {
    exercisesCompleted: number;
    highestScore: number;
    lastPracticedAt?: string;
  }>;
}
