import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  Award, 
  Send, 
  RefreshCw, 
  FileText, 
  Check, 
  Copy, 
  ArrowRight, 
  History, 
  ChevronRight, 
  HelpCircle,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import { 
  SupportedLanguage, 
  LanguageLevel, 
  ExerciseType, 
  GeneratedExercise, 
  AssignmentEvaluation, 
  StudentProgress 
} from '../types/languages';
import { SUPPORTED_LANGUAGES_DATA } from '../services/languageSeed';
import { 
  getStoredExercises, 
  getStoredEvaluations, 
  getStudentProgress, 
  requestExerciseGeneration, 
  submitExerciseForEvaluation 
} from '../services/languageService';

interface LanguageTeacherHubProps {
  onBackToCompanion?: () => void;
  userName?: string;
}

export const LanguageTeacherHub: React.FC<LanguageTeacherHubProps> = ({
  onBackToCompanion,
  userName = 'Élève'
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('english');
  const [activeTab, setActiveTab] = useState<'exercises' | 'submit' | 'history'>('exercises');
  
  // Data state
  const [exercises, setExercises] = useState<GeneratedExercise[]>([]);
  const [evaluations, setEvaluations] = useState<AssignmentEvaluation[]>([]);
  const [progress, setProgress] = useState<StudentProgress | null>(null);

  // Exercise Generation Form State
  const [genLevel, setGenLevel] = useState<LanguageLevel>('beginner');
  const [genType, setGenType] = useState<ExerciseType>('quiz');
  const [genTopic, setGenTopic] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Active Interactive Exercise (Quiz mode)
  const [activeQuizExercise, setActiveQuizExercise] = useState<GeneratedExercise | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Submission Form State (for Homework/Devoir processing)
  const [submitExerciseTitle, setSubmitExerciseTitle] = useState<string>('Devoir de Rédaction Libre');
  const [submitPrompt, setSubmitPrompt] = useState<string>('');
  const [submitContent, setSubmitContent] = useState<string>('');
  const [submitLevel, setSubmitLevel] = useState<LanguageLevel>('intermediate');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [latestEvaluation, setLatestEvaluation] = useState<AssignmentEvaluation | null>(null);
  const [selectedHistoryEval, setSelectedHistoryEval] = useState<AssignmentEvaluation | null>(null);

  // Copy indicator
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const exs = getStoredExercises();
    const evals = getStoredEvaluations();
    const prog = getStudentProgress();
    setExercises(exs);
    setEvaluations(evals);
    setProgress(prog);
  };

  const currentLangMeta = SUPPORTED_LANGUAGES_DATA.find(l => l.id === selectedLanguage) || SUPPORTED_LANGUAGES_DATA[0];
  const filteredExercises = exercises.filter(e => e.language === selectedLanguage);
  const filteredEvaluations = evaluations.filter(e => e.language === selectedLanguage);

  // Handle generation of a new exercise or assignment
  const handleGenerateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const newEx = await requestExerciseGeneration({
        language: selectedLanguage,
        level: genLevel,
        type: genType,
        topic: genTopic || 'Sujet pratique et courant'
      });
      loadData();
      if (newEx.type === 'quiz' && newEx.quizQuestions && newEx.quizQuestions.length > 0) {
        startQuiz(newEx);
      } else if (newEx.type === 'full_assignment') {
        openAssignmentSubmission(newEx);
      }
    } catch (err) {
      console.error('Error generating exercise:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Launch Quiz Interactive Mode
  const startQuiz = (ex: GeneratedExercise) => {
    setActiveQuizExercise(ex);
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  // Launch Homework Submission Form for an exercise
  const openAssignmentSubmission = (ex: GeneratedExercise) => {
    setSubmitExerciseTitle(ex.title);
    setSubmitLevel(ex.level);
    if (ex.assignmentSubject) {
      setSubmitPrompt(`TEXTE D'ÉTUDE :\n${ex.assignmentSubject.readingPassage || ''}\n\nQUESTIONS / CONSIGNES :\n${(ex.assignmentSubject.comprehensionQuestions || []).join('\n')}\n\nÉCRITURE :\n${ex.assignmentSubject.essayPrompt || ''}`);
    } else {
      setSubmitPrompt(ex.instructions || '');
    }
    setSubmitContent('');
    setActiveTab('submit');
  };

  // Handle Submission Evaluation (Processing homework)
  const handleSubmitForGrading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitContent.trim()) return;

    setIsEvaluating(true);
    try {
      const evalResult = await submitExerciseForEvaluation({
        language: selectedLanguage,
        level: submitLevel,
        exerciseTitle: submitExerciseTitle || 'Devoir soumis à M-Ris',
        studentSubmission: submitContent,
        studentName: userName,
        originalExercisePrompt: submitPrompt
      });
      setLatestEvaluation(evalResult);
      loadData();
    } catch (err) {
      console.error('Error submitting homework:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0 border border-white/20">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-400 text-amber-950 rounded-full tracking-wide">
                  RÔLE OFFICIEL M-RIS
                </span>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" /> Professeur Polyglotte 5 Langues
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Professeur & Enseignant de Langues M-Ris
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl mt-1">
                Génération d'exercices & devoirs sur mesure, traitement rigoureux des copies soumises, notation sur 20, règles expliquées et corrigé modèle en <span className="font-semibold text-amber-300">Anglais, Espagnol, Allemand, Coréen et Chinois</span>.
              </p>
            </div>
          </div>

          {onBackToCompanion && (
            <button
              onClick={onBackToCompanion}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-white/15 cursor-pointer shrink-0"
            >
              Retour au Compagnon <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-slate-400 font-medium">Devoirs Corrigés</div>
            <div className="text-xl font-black text-white mt-0.5">{evaluations.length} copies</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-slate-400 font-medium">Moyenne Générale</div>
            <div className="text-xl font-black text-amber-300 mt-0.5">
              {progress ? `${progress.averageScoreOutOf20} / 20` : '18.0 / 20'}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-slate-400 font-medium">Exercices Prêts</div>
            <div className="text-xl font-black text-indigo-300 mt-0.5">{exercises.length} sujets</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-slate-400 font-medium">Pédagogie Active</div>
            <div className="text-xl font-black text-emerald-300 mt-0.5">100% Bienveillant</div>
          </div>
        </div>
      </div>

      {/* Language Selector Bar (5 Langues) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-indigo-600" /> Choisissez votre langue d'apprentissage :
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {SUPPORTED_LANGUAGES_DATA.map((lang) => {
            const isSelected = selectedLanguage === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => {
                  setSelectedLanguage(lang.id);
                  setActiveQuizExercise(null);
                  setLatestEvaluation(null);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{lang.flag}</span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                </div>
                <div className="mt-2">
                  <div className={`font-bold text-sm ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                    {lang.name}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{lang.nativeName}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Current Language Summary Card */}
        <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentLangMeta.flag}</span>
            <div>
              <span className="font-bold text-slate-800">{currentLangMeta.name}</span> : {currentLangMeta.description}
            </div>
          </div>
          <div className="px-2.5 py-1 bg-white text-indigo-700 font-semibold rounded-lg border border-indigo-200 shrink-0">
            Cadre : {currentLangMeta.standards}
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('exercises')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'exercises'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" /> 
          1. Exercices & Devoirs ({filteredExercises.length})
        </button>

        <button
          onClick={() => setActiveTab('submit')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'submit'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Send className="w-4 h-4" /> 
          2. Traiter & Noter un Devoir Soumis
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" /> 
          3. Historique & Copies Corrigées ({filteredEvaluations.length})
        </button>
      </div>

      {/* TAB 1: EXERCISES & GENERATOR */}
      {activeTab === 'exercises' && (
        <div className="space-y-6">
          {/* Active Interactive Quiz Banner if opened */}
          {activeQuizExercise && (
            <div className="bg-white rounded-2xl p-6 border-2 border-indigo-400 shadow-lg space-y-5 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-1 text-xs font-bold bg-indigo-100 text-indigo-800 rounded-lg">
                    QUIZ INTERACTIF EN COURS
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">
                    {activeQuizExercise.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{activeQuizExercise.instructions}</p>
                </div>
                <button
                  onClick={() => setActiveQuizExercise(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold underline cursor-pointer"
                >
                  Fermer le quiz
                </button>
              </div>

              {/* Questions */}
              <div className="space-y-6">
                {(activeQuizExercise.quizQuestions || []).map((q, qIndex) => {
                  const selectedOpt = quizAnswers[q.id];
                  const isAnswered = selectedOpt !== undefined;
                  const isCorrect = isAnswered && selectedOpt === q.correctAnswerIndex;

                  return (
                    <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-slate-800 text-sm">
                          Question {qIndex + 1} : {q.question}
                        </div>
                        {q.romanization && (
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-900 font-mono rounded">
                            {q.romanization}
                          </span>
                        )}
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIndex) => {
                          const isOptionSelected = selectedOpt === optIndex;
                          let btnStyle = 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700';

                          if (quizSubmitted) {
                            if (optIndex === q.correctAnswerIndex) {
                              btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold';
                            } else if (isOptionSelected) {
                              btnStyle = 'border-rose-400 bg-rose-50 text-rose-800 font-medium';
                            }
                          } else if (isOptionSelected) {
                            btnStyle = 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold';
                          }

                          return (
                            <button
                              key={optIndex}
                              disabled={quizSubmitted}
                              onClick={() => {
                                setQuizAnswers(prev => ({ ...prev, [q.id]: optIndex }));
                              }}
                              className={`p-3 text-left rounded-xl border text-xs transition cursor-pointer flex items-center justify-between ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {quizSubmitted && optIndex === q.correctAnswerIndex && (
                                <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation if submitted */}
                      {quizSubmitted && (
                        <div className={`p-3 rounded-lg text-xs ${isCorrect ? 'bg-emerald-100/70 text-emerald-900' : 'bg-amber-100/70 text-amber-900'}`}>
                          <div className="font-bold flex items-center gap-1">
                            <Lightbulb className="w-3.5 h-3.5" /> 
                            {isCorrect ? 'Excellente réponse !' : 'Explication du Professeur M-Ris :'}
                          </div>
                          <div className="mt-0.5">{q.explanation}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit Quiz button */}
              <div className="flex items-center justify-between pt-2">
                {!quizSubmitted ? (
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    disabled={Object.keys(quizAnswers).length === 0}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Valider mes réponses & voir la correction
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-800">
                      Score : {Object.entries(quizAnswers).filter(([qid, aid]) => {
                        const target = activeQuizExercise.quizQuestions?.find(item => item.id === qid);
                        return target && target.correctAnswerIndex === aid;
                      }).length} / {activeQuizExercise.quizQuestions?.length}
                    </span>
                    <button
                      onClick={() => {
                        setQuizAnswers({});
                        setQuizSubmitted(false);
                      }}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Recommencer
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Generator Box */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h3 className="font-bold text-base text-white">
                Générateur d'Exercice & Devoir par le Professeur M-Ris
              </h3>
            </div>
            <p className="text-xs text-indigo-200 max-w-2xl mb-4">
              Demandez à M-Ris de composer instantanément un nouvel exercice ou un devoir complet calibré selon vos besoins en <span className="font-semibold text-white">{currentLangMeta.name}</span>.
            </p>

            <form onSubmit={handleGenerateExercise} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Niveau
                </label>
                <select
                  value={genLevel}
                  onChange={(e) => setGenLevel(e.target.value as LanguageLevel)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="beginner">Débutant (A1 - A2 / HSK 1-2 / TOPIK 1)</option>
                  <option value="intermediate">Intermédiaire (B1 - B2 / HSK 3-4 / TOPIK 3-4)</option>
                  <option value="advanced">Avancé (C1 - C2 / HSK 5-6 / TOPIK 5-6)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Format
                </label>
                <select
                  value={genType}
                  onChange={(e) => setGenType(e.target.value as ExerciseType)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="quiz">Quiz & QCM Interactif</option>
                  <option value="full_assignment">Devoir Complet (Texte + Questions + Rédaction)</option>
                  <option value="translation">Traduction & Syntaxe</option>
                  <option value="vocabulary">Vocabulaire & Mots Clés</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Thème ou Sujet
                </label>
                <input
                  type="text"
                  placeholder="Ex: Entretien d'embauche, voyage, repas..."
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer h-[38px]"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> M-Ris compose...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Générer le Sujet
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* List of Available Exercises for Selected Language */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" /> 
              Exercices et Devoirs disponibles pour le {currentLangMeta.name} ({filteredExercises.length})
            </h4>

            {filteredExercises.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
                Aucun exercice pour le moment dans cette langue. Utilisez le générateur ci-dessus pour que M-Ris en crée un immédiatement !
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredExercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ex.type === 'quiz' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {ex.type === 'quiz' ? '📝 Quiz Interactif' : '📚 Devoir à Soumettre'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Niveau {ex.level} • ~{ex.estimatedMinutes} min
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-900 text-sm leading-snug">
                        {ex.title}
                      </h5>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {ex.instructions}
                      </p>

                      {/* If full assignment preview */}
                      {ex.assignmentSubject && (
                        <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600">
                          <span className="font-bold text-slate-800">Sujet d'étude :</span> {ex.assignmentSubject.readingPassage?.slice(0, 100)}...
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      {ex.type === 'quiz' ? (
                        <button
                          onClick={() => startQuiz(ex)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          Lancer le Quiz <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => openAssignmentSubmission(ex)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          Faire & Soumettre le Devoir <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SUBMIT & GRADE HOMEWORK */}
      {activeTab === 'submit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    ✍️
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Espace de Soumission de Devoir / Exercice
                    </h3>
                    <p className="text-xs text-slate-500">
                      M-Ris va traiter votre texte, noter sur 20 et détailler les corrections.
                    </p>
                  </div>
                </div>
                <span className="text-xl">{currentLangMeta.flag}</span>
              </div>

              <form onSubmit={handleSubmitForGrading} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Titre ou Sujet du Devoir
                  </label>
                  <input
                    type="text"
                    value={submitExerciseTitle}
                    onChange={(e) => setSubmitExerciseTitle(e.target.value)}
                    placeholder="Ex: Présentation personnelle, Rédaction sur mes projets..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Langue
                    </label>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                    >
                      {SUPPORTED_LANGUAGES_DATA.map(l => (
                        <option key={l.id} value={l.id}>{l.flag} {l.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Niveau visé
                    </label>
                    <select
                      value={submitLevel}
                      onChange={(e) => setSubmitLevel(e.target.value as LanguageLevel)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                    >
                      <option value="beginner">Débutant (A1 - A2)</option>
                      <option value="intermediate">Intermédiaire (B1 - B2)</option>
                      <option value="advanced">Avancé (C1 - C2)</option>
                    </select>
                  </div>
                </div>

                {submitPrompt && (
                  <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-950">
                    <span className="font-bold flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> Consigne originale :
                    </span>
                    <pre className="font-sans whitespace-pre-line mt-1 text-[11px] text-amber-900 leading-relaxed">
                      {submitPrompt}
                    </pre>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Votre Devoir / Réponse rédigée (à faire corriger par M-Ris) :
                  </label>
                  <textarea
                    rows={8}
                    value={submitContent}
                    onChange={(e) => setSubmitContent(e.target.value)}
                    placeholder={`Rédigez ou collez votre travail ici en ${currentLangMeta.name}...
Exemple : Vos phrases, vos paragraphes, votre traduction ou vos réponses.`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>
                      {submitContent.trim().split(/\s+/).filter(Boolean).length} mots saisis
                    </span>
                    <span>Alphabet & caractères natifs acceptés (Hangul, Hanzi, etc.)</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isEvaluating || !submitContent.trim()}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {isEvaluating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-300" /> 
                      Le Professeur M-Ris traite et corrige votre devoir...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-amber-300" /> 
                      Soumettre à M-Ris pour Traitement & Notation sur 20
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Teacher Report Column (Latest Evaluation) */}
            <div className="lg:col-span-5 space-y-4">
              {latestEvaluation ? (
                <div className="bg-white rounded-2xl p-6 border-2 border-indigo-500 shadow-xl space-y-5 animate-in fade-in">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
                        COPIE TRAITÉE & CORRIGÉE
                      </span>
                      <h4 className="font-bold text-slate-900 text-base mt-1">
                        {latestEvaluation.exerciseTitle}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Élève : {latestEvaluation.studentName} • {new Date(latestEvaluation.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {/* Grade Badge */}
                    <div className="text-right">
                      <div className="text-2xl font-black text-indigo-700">
                        {latestEvaluation.score} <span className="text-sm font-semibold text-slate-400">/ 20</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {latestEvaluation.gradeLabel}
                      </span>
                    </div>
                  </div>

                  {/* Teacher Feedback Note */}
                  <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-100 text-xs text-indigo-950">
                    <div className="font-bold flex items-center gap-1.5 text-indigo-900 mb-1">
                      <Award className="w-4 h-4 text-amber-500" /> Mot du Professeur M-Ris :
                    </div>
                    <p className="leading-relaxed">{latestEvaluation.teacherSummary}</p>
                  </div>

                  {/* Strengths */}
                  {latestEvaluation.strengths && latestEvaluation.strengths.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Points forts constatés :
                      </div>
                      <ul className="text-xs text-slate-700 space-y-1 pl-4 list-disc">
                        {latestEvaluation.strengths.map((str, idx) => (
                          <li key={idx}>{str}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Detailed Corrections */}
                  {latestEvaluation.corrections && latestEvaluation.corrections.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-rose-700 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Fautes & Corrections Recommandées :
                      </div>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {latestEvaluation.corrections.map((corr, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
                            <div className="text-rose-700 line-through">
                              ❌ {corr.originalSegment}
                            </div>
                            <div className="text-emerald-700 font-bold">
                              ✅ {corr.correctedSegment}
                            </div>
                            <div className="text-slate-600 text-[10px] italic">
                              Règle : {corr.explanation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Model Corrected Full Text */}
                  {latestEvaluation.correctedVersionFull && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Corrigé Type & Perfectionné :
                        </span>
                        <button
                          onClick={() => handleCopyText(latestEvaluation.correctedVersionFull)}
                          className="text-[11px] text-indigo-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          {copied ? 'Copié !' : 'Copier'}
                        </button>
                      </div>
                      <div className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono max-h-48 overflow-y-auto whitespace-pre-wrap">
                        {latestEvaluation.correctedVersionFull}
                      </div>
                    </div>
                  )}

                  {/* Advice */}
                  {latestEvaluation.pedagogicalAdvice && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                      <span className="font-bold">Conseil pour progresser :</span> {latestEvaluation.pedagogicalAdvice}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-8 border border-dashed border-slate-300 text-center text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 mx-auto flex items-center justify-center text-xl">
                    📑
                  </div>
                  <h4 className="font-bold text-slate-700 text-sm">
                    Aucune copie soumise pour l'instant
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Rédigez votre devoir dans le formulaire à gauche et cliquez sur « Soumettre à M-Ris ». La correction apparaîtra ici avec la note et le corrigé type !
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HISTORY & PREVIOUS GRADED ASSIGNMENTS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" /> 
              Relevé des Copies Corrigées pour le {currentLangMeta.name} ({filteredEvaluations.length})
            </h4>
          </div>

          {filteredEvaluations.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
              Aucun devoir corrigé dans cette langue pour le moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEvaluations.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedHistoryEval(ev)}
                  className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{ev.exerciseTitle}</h5>
                      <p className="text-xs text-slate-400">
                        {new Date(ev.submittedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-indigo-700">
                        {ev.score} / 20
                      </span>
                      <div className="text-[10px] text-amber-600 font-bold">{ev.gradeLabel}</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 italic">
                    « {ev.teacherSummary} »
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
                    <span>Voir le rapport complet & corrigé</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal / Overlay for viewing historical evaluation */}
          {selectedHistoryEval && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-800 rounded">
                      RAPPORT D'ÉVALUATION COMPLET
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      {selectedHistoryEval.exerciseTitle}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedHistoryEval(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl">
                  <div>
                    <span className="text-xs text-indigo-700 font-bold uppercase tracking-wider">Note Finale</span>
                    <div className="text-2xl font-black text-indigo-950">
                      {selectedHistoryEval.score} / 20
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-white text-indigo-700 font-bold text-xs rounded-lg shadow-xs border border-indigo-200">
                    {selectedHistoryEval.gradeLabel}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-1">Avis du Professeur M-Ris :</h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {selectedHistoryEval.teacherSummary}
                  </p>
                </div>

                {selectedHistoryEval.corrections && selectedHistoryEval.corrections.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-rose-700 mb-2">Corrections apportées :</h4>
                    <div className="space-y-2">
                      {selectedHistoryEval.corrections.map((c, i) => (
                        <div key={i} className="p-2.5 bg-rose-50/50 rounded-xl border border-rose-100 text-xs">
                          <div className="text-rose-700 line-through">❌ {c.originalSegment}</div>
                          <div className="text-emerald-700 font-bold">✅ {c.correctedSegment}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5 italic">{c.explanation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedHistoryEval.correctedVersionFull && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-slate-800">Corrigé modèle complet :</h4>
                      <button
                        onClick={() => handleCopyText(selectedHistoryEval.correctedVersionFull)}
                        className="text-xs text-indigo-600 font-semibold cursor-pointer"
                      >
                        {copied ? 'Copié !' : 'Copier'}
                      </button>
                    </div>
                    <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono whitespace-pre-wrap">
                      {selectedHistoryEval.correctedVersionFull}
                    </pre>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setSelectedHistoryEval(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
