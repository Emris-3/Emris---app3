import { 
  SupportedLanguage, 
  GeneratedExercise, 
  AssignmentEvaluation, 
  StudentProgress 
} from '../types/languages';
import { INITIAL_EXERCISES, INITIAL_EVALUATIONS } from './languageSeed';

const EXERCISES_STORAGE_KEY = 'mris_language_exercises_v1';
const EVALUATIONS_STORAGE_KEY = 'mris_language_evaluations_v1';
const PROGRESS_STORAGE_KEY = 'mris_language_progress_v1';

export function getStoredExercises(): GeneratedExercise[] {
  try {
    const raw = localStorage.getItem(EXERCISES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EXERCISES_STORAGE_KEY, JSON.stringify(INITIAL_EXERCISES));
      return INITIAL_EXERCISES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_EXERCISES;
  } catch (err) {
    console.error('Error loading stored language exercises:', err);
    return INITIAL_EXERCISES;
  }
}

export function saveStoredExercise(exercise: GeneratedExercise): void {
  try {
    const all = getStoredExercises();
    const updated = [exercise, ...all.filter(e => e.id !== exercise.id)];
    localStorage.setItem(EXERCISES_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving language exercise:', err);
  }
}

export function getStoredEvaluations(): AssignmentEvaluation[] {
  try {
    const raw = localStorage.getItem(EVALUATIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EVALUATIONS_STORAGE_KEY, JSON.stringify(INITIAL_EVALUATIONS));
      return INITIAL_EVALUATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_EVALUATIONS;
  } catch (err) {
    console.error('Error loading stored language evaluations:', err);
    return INITIAL_EVALUATIONS;
  }
}

export function saveStoredEvaluation(evaluation: AssignmentEvaluation): void {
  try {
    const all = getStoredEvaluations();
    const updated = [evaluation, ...all.filter(e => e.id !== evaluation.id)];
    localStorage.setItem(EVALUATIONS_STORAGE_KEY, JSON.stringify(updated));
    updateStudentProgress(evaluation);
  } catch (err) {
    console.error('Error saving language evaluation:', err);
  }
}

export function getStudentProgress(): StudentProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // fallback
  }

  // Compute from evaluations
  const evals = getStoredEvaluations();
  const progress: StudentProgress = {
    totalExercisesCompleted: evals.length,
    totalAssignmentsEvaluated: evals.length,
    averageScoreOutOf20: evals.length > 0 
      ? Math.round((evals.reduce((sum, e) => sum + e.score, 0) / evals.length) * 10) / 10 
      : 18,
    languageBreakdown: {
      english: { exercisesCompleted: 1, highestScore: 18, lastPracticedAt: new Date().toISOString() },
      spanish: { exercisesCompleted: 0, highestScore: 0 },
      german: { exercisesCompleted: 0, highestScore: 0 },
      korean: { exercisesCompleted: 0, highestScore: 0 },
      chinese: { exercisesCompleted: 0, highestScore: 0 }
    }
  };

  return progress;
}

function updateStudentProgress(newEval: AssignmentEvaluation): void {
  try {
    const progress = getStudentProgress();
    progress.totalAssignmentsEvaluated += 1;
    progress.totalExercisesCompleted += 1;

    const allEvals = getStoredEvaluations();
    const sum = allEvals.reduce((acc, item) => acc + item.score, 0);
    progress.averageScoreOutOf20 = Math.round((sum / (allEvals.length || 1)) * 10) / 10;

    const langKey = newEval.language;
    if (progress.languageBreakdown[langKey]) {
      progress.languageBreakdown[langKey].exercisesCompleted += 1;
      if (newEval.score > progress.languageBreakdown[langKey].highestScore) {
        progress.languageBreakdown[langKey].highestScore = newEval.score;
      }
      progress.languageBreakdown[langKey].lastPracticedAt = new Date().toISOString();
    }

    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.error('Error updating progress:', err);
  }
}
