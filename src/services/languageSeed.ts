import { 
  SupportedLanguage, 
  LanguageInfo, 
  GeneratedExercise, 
  AssignmentEvaluation 
} from '../types/languages';

export const SUPPORTED_LANGUAGES_DATA: LanguageInfo[] = [
  {
    id: 'english',
    name: 'Anglais',
    nativeName: 'English',
    flag: '🇬🇧',
    description: 'Langue internationale des affaires, de la tech et des voyages. Maîtrise de la grammaire, fluidité orale, IELTS & TOEIC.',
    standards: 'CECRL (A1 - C2), TOEIC & IELTS',
    accentColor: 'from-blue-600 to-indigo-700'
  },
  {
    id: 'spanish',
    name: 'Espagnol',
    nativeName: 'Español',
    flag: '🇪🇸',
    description: '2ème langue mondiale par locuteurs natifs. Conjugaisons (subjuntivo), tournures idiomatiques, DELE & conversations.',
    standards: 'CECRL (A1 - C2), Diplôme DELE',
    accentColor: 'from-amber-500 to-red-600'
  },
  {
    id: 'german',
    name: 'Allemand',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    description: '1ère puissance économique d\'Europe. Maîtrise des cas (Nominatif, Accusatif, Datif, Génitif), mots composés et Goethe-Zertifikat.',
    standards: 'CECRL (A1 - C2), Goethe-Zertifikat',
    accentColor: 'from-emerald-600 to-teal-800'
  },
  {
    id: 'korean',
    name: 'Coréen (Corée du Sud)',
    nativeName: '한국어 (Hangugeo)',
    flag: '🇰🇷',
    description: 'Apprentissage de l\'alphabet Hangeul (한글), particules (은/는, 이/가), registres de politesse (존댓말), K-Drama, K-Pop et TOPIK.',
    standards: 'TOPIK (Test of Proficiency in Korean I & II, Niveaux 1 à 6)',
    accentColor: 'from-purple-600 to-pink-700'
  },
  {
    id: 'chinese',
    name: 'Chinois (Mandarin)',
    nativeName: '中文 (Zhōngwén)',
    flag: '🇨🇳',
    description: 'Caractères sinogrammes (Hanzi 汉字), système phonétique Pinyin avec 4 tons, classificateurs (量词) et préparation HSK.',
    standards: 'HSK (Hanyu Shuiping Kaoshi, Niveaux 1 à 6)',
    accentColor: 'from-rose-600 to-red-700'
  }
];

export const INITIAL_EXERCISES: GeneratedExercise[] = [
  // --- ANGLAIS ---
  {
    id: 'ex-en-1',
    language: 'english',
    level: 'beginner',
    type: 'quiz',
    title: 'Les bases des temps : Present Simple vs Present Continuous',
    instructions: 'Choisissez la bonne forme verbale pour chaque phrase selon le contexte temporel.',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    estimatedMinutes: 5,
    quizQuestions: [
      {
        id: 'q1',
        question: 'Look outside! It ______ right now.',
        options: ['rains', 'is raining', 'rained', 'has rained'],
        correctAnswerIndex: 1,
        explanation: 'L\'action se déroule en ce moment même ("right now"), on utilise donc le Present Continuous (be + V-ing).'
      },
      {
        id: 'q2',
        question: 'She usually ______ to work by bus.',
        options: ['go', 'goes', 'is going', 'gone'],
        correctAnswerIndex: 1,
        explanation: 'Avec "usually" (habitude répétée) et le sujet à la 3e personne du singulier "She", on utilise le Present Simple avec la terminaison -es (goes).'
      },
      {
        id: 'q3',
        question: 'They ______ coffee in the morning.',
        options: ['drink not', 'doesn\'t drink', 'don\'t drink', 'aren\'t drinking'],
        correctAnswerIndex: 2,
        explanation: 'Pour "They" à la forme négative au Present Simple, l\'auxiliaire est "do not" ou "don\'t" suivi de la base verbale.'
      }
    ]
  },
  {
    id: 'ex-en-assignment-1',
    language: 'english',
    level: 'intermediate',
    type: 'full_assignment',
    title: 'Devoir de Rédaction & Compréhension : Job Interview & Professional Goals',
    instructions: 'Lisez attentivement les consignes et soumettez votre devoir rédigé pour une correction détaillée par le Professeur M-Ris.',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    estimatedMinutes: 25,
    assignmentSubject: {
      readingPassage: 'In today\'s globalized economy, adaptability and clear communication have become the most sought-after qualities in international teams. Many professionals now seek flexible roles that balance autonomy with teamwork.',
      comprehensionQuestions: [
        '1. According to the text, what are the two most sought-after qualities in international teams?',
        '2. What kind of work balance are many modern professionals seeking?'
      ],
      grammarTask: 'Rephrase using the modal verb "should" or "must": "It is necessary for managers to listen actively to their collaborators."',
      essayPrompt: 'Write a short paragraph (80 to 120 words) presenting your current professional or academic background and your key goals for the next two years.'
    }
  },

  // --- ESPAGNOL ---
  {
    id: 'ex-es-1',
    language: 'spanish',
    level: 'beginner',
    type: 'quiz',
    title: 'Distinguer "Ser" et "Estar" en Espagnol',
    instructions: 'Sélectionnez le verbe adéquat selon s\'il s\'agit d\'une caractéristique permanente ou d\'un état passager/localisation.',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    estimatedMinutes: 6,
    quizQuestions: [
      {
        id: 'q-es-1',
        question: 'Hoy yo ______ muy contento con los resultados.',
        options: ['soy', 'estoy', 'es', 'está'],
        correctAnswerIndex: 1,
        explanation: 'Pour exprimer une émotion ou un état temporaire ("aujourd\'hui"), on emploie "estar" (yo estoy).'
      },
      {
        id: 'q-es-2',
        question: 'Carlos y Sofía ______ de Colombia, son colombianos.',
        options: ['están', 'son', 'eran', 'estuvieron'],
        correctAnswerIndex: 1,
        explanation: 'Pour indiquer l\'origine géographique ou la nationalité (caractéristique permanente), on emploie "ser" (ellos son).'
      },
      {
        id: 'q-es-3',
        question: '¿Dónde ______ la biblioteca central?',
        options: ['es', 'está', 'queda de', 'haya'],
        correctAnswerIndex: 1,
        explanation: 'Pour localiser géographiquement un lieu physique, on utilise toujours "estar" (está).'
      }
    ]
  },
  {
    id: 'ex-es-assignment-1',
    language: 'spanish',
    level: 'intermediate',
    type: 'full_assignment',
    title: 'Devoir Écrit : Mi Proyecto de Futuro y Mis Pasiones',
    instructions: 'Rédigez votre devoir en espagnol en respectant les consignes suivantes et soumettez-le pour recevoir votre note sur 20 et le rapport de correction.',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    estimatedMinutes: 20,
    assignmentSubject: {
      readingPassage: 'Aprender un nuevo idioma abre puertas no solo profesionales sino también humanas. Te permite conectar con culturas fascinantes y descubrir el mundo con otra mirada.',
      comprehensionQuestions: [
        '1. ¿Cuáles son los dos tipos de puertas que abre el aprendizaje de un idioma según el texto?',
        '2. ¿Qué beneficio cultural destaca el autor?'
      ],
      grammarTask: 'Transforma al pretérito perfecto simple (pasado): "Nosotros viajamos a Madrid y conocemos a mucha gente."',
      essayPrompt: 'Escribe un texto breve (de 70 a 100 palabras) sobre tu rutina diaria y una actividad que te apasiona hacer los fines de semana.'
    }
  },

  // --- ALLEMAND ---
  {
    id: 'ex-de-1',
    language: 'german',
    level: 'beginner',
    type: 'quiz',
    title: 'Les articles définis et l\'Accusatif (der / die / das / den)',
    instructions: 'Identifiez le bon article selon le genre du nom et la fonction de complément d\'objet direct (Akkusativ).',
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    estimatedMinutes: 7,
    quizQuestions: [
      {
        id: 'q-de-1',
        question: 'Ich trinke jeden Morgen ______ Kaffee (masculin).',
        options: ['der', 'den', 'dem', 'das'],
        correctAnswerIndex: 1,
        explanation: 'Kaffee est masculin (der Kaffee). En tant que COD (Akkusativ), "der" devient "den".'
      },
      {
        id: 'q-de-2',
        question: 'Sie liest ______ Buch (neutre) im Park.',
        options: ['der', 'den', 'das', 'die'],
        correctAnswerIndex: 2,
        explanation: 'Buch est neutre (das Buch). À l\'accusatif, le neutre conserve l\'article "das".'
      },
      {
        id: 'q-de-3',
        question: 'Wir haben ______ neue Lehrerin (féminin) sehr gern.',
        options: ['die', 'den', 'der', 'das'],
        correctAnswerIndex: 0,
        explanation: 'Lehrerin est féminin (die). Au féminin, l\'article reste "die" au nominatif comme à l\'accusatif.'
      }
    ]
  },
  {
    id: 'ex-de-assignment-1',
    language: 'german',
    level: 'intermediate',
    type: 'full_assignment',
    title: 'Devoir de Deutsch : Ein Brief an einen Freund über das Wochenende',
    instructions: 'Rédigez une lettre amicale en allemand en décrivant un séjour ou une activité de votre choix.',
    createdAt: new Date(Date.now() - 3600000 * 15).toISOString(),
    estimatedMinutes: 25,
    assignmentSubject: {
      readingPassage: 'Deutschland ist bekannt für seine vielfältigen Städte, seine reiche Kultur und schöne Naturlandschaften wie den Schwarzwald oder die Alpen.',
      comprehensionQuestions: [
        '1. Wofür ist Deutschland laut dem Text bekannt?',
        '2. Nenne zwei Naturlandschaften, die im Text erwähnt werden.'
      ],
      grammarTask: 'Bilde einen Nebensatz mit "weil" : "Ich lerne Deutsch. Ich möchte in Berlin arbeiten."',
      essayPrompt: 'Schreibe einen kurzen Brief (60-90 Wörter) an einen Freund über deine Pläne für das nächste Wochenende (Aktivitäten, Essen, Freunde treffen).'
    }
  },

  // --- CORÉEN (CORÉE DU SUD) ---
  {
    id: 'ex-ko-1',
    language: 'korean',
    level: 'beginner',
    type: 'quiz',
    title: 'Hangeul & Particules Essentielles : 은/는 vs 이/가',
    instructions: 'Choisissez la bonne particule de thème ou de sujet selon la consonne ou voyelle finale.',
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    estimatedMinutes: 8,
    quizQuestions: [
      {
        id: 'q-ko-1',
        question: '저는 학생______ (Je suis étudiant - particule de copule polie).',
        romanization: 'Jeoneun haksaeng______',
        options: ['이에요', '예요', '입니다', '하고'],
        correctAnswerIndex: 0,
        explanation: 'Le mot 학생 (haksaeng) se termine par une consonne finale (batchim ㅇ), donc en style poli informel on ajoute "이에요". (En style soutenu formel ce serait 입니다).'
      },
      {
        id: 'q-ko-2',
        question: '민우______ 오늘 한국에 가요. (Minwoo va en Corée aujourd\'hui - particule de thème après voyelle).',
        romanization: 'Minu______ oneul hanguge gayo.',
        options: ['는', '은', '이', '을'],
        correctAnswerIndex: 0,
        explanation: '민우 (Minwoo) se termine par une voyelle (ㅜ), la particule de thème est donc "는" (neun).'
      },
      {
        id: 'q-ko-3',
        question: 'Comment dit-on poliment "Merci" en Coréen ?',
        romanization: 'Gamsahamnida / Gomapseumnida',
        options: ['안녕하세요 (Annyeonghaseyo)', '감사합니다 (Gamsahamnida)', '죄송합니다 (Joesonghamnida)', '잘 가요 (Jal gayo)'],
        correctAnswerIndex: 1,
        explanation: '감사합니다 (Gamsahamnida) est la formule polie et respectueuse standard pour dire "Merci".'
      }
    ]
  },
  {
    id: 'ex-ko-assignment-1',
    language: 'korean',
    level: 'beginner',
    type: 'full_assignment',
    title: 'Devoir de Coréen : Présentation personnelle (자기소개)',
    instructions: 'Rédigez votre présentation personnelle en coréen avec Hangul (et romanisation si vous débutez) et soumettez-la au Professeur M-Ris.',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    estimatedMinutes: 20,
    assignmentSubject: {
      readingPassage: '안녕하세요! 저는 지민이에요. 저는 한국 사람이에요. 음악을 좋아해요. 만나서 반가워요!',
      readingPassageRomanized: 'Annyeonghaseyo! Jeoneun Jimin-ieyo. Jeoneun hanguk saram-ieyo. Eum-ag-eul joahaeyo. Mannaseo bangawoyo!',
      readingTranslation: 'Bonjour ! Je m\'appelle Jimin. Je suis coréen. J\'aime la musique. Ravi de vous rencontrer !',
      comprehensionQuestions: [
        '1. Quel est le prénom de la personne dans le texte ?',
        '2. Quelle est sa nationalité et que dit-elle aimer ?'
      ],
      grammarTask: 'Traduisez en coréen en utilisant la particule d\'objet 을/를 : "J\'aime le café."',
      essayPrompt: 'Rédigez votre propre présentation personnelle en coréen (nom, nationalité, profession ou étude, et un centre d\'intérêt).'
    }
  },

  // --- CHINOIS (MANDARIN) ---
  {
    id: 'ex-zh-1',
    language: 'chinese',
    level: 'beginner',
    type: 'quiz',
    title: 'Les Tons du Mandarin & Salutations HSK 1',
    instructions: 'Identifiez le bon ton Pinyin et la signification des caractères chinois fondamentaux.',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    estimatedMinutes: 6,
    quizQuestions: [
      {
        id: 'q-zh-1',
        question: 'Comment se prononce le caractère "你好" (Bonjour) en Pinyin avec les tons ?',
        romanization: 'Nǐ hǎo',
        options: ['Nǐ hǎo (3e ton + 3e ton)', 'Ní hǎo (2e ton + 1er ton)', 'Nī hào (1er ton + 4e ton)', 'Nì hǎo (4e ton + 3e ton)'],
        correctAnswerIndex: 0,
        explanation: '你 (nǐ) et 好 (hǎo) sont tous deux au 3e ton. Règle phonétique du sandhi tonal : quand deux 3e tons se suivent, le premier se prononce au 2e ton (ní hǎo).'
      },
      {
        id: 'q-zh-2',
        question: 'Que signifie le caractère "谢" dans "谢谢" (Xièxie) ?',
        romanization: 'Xièxie',
        options: ['Au revoir', 'Pardon', 'Merci', 'S\'il vous plaît'],
        correctAnswerIndex: 2,
        explanation: '谢谢 (Xièxie, 4e ton + ton neutre) signifie "Merci". Pour répondre poliment : 不客气 (Bú kèqi - De rien).'
      },
      {
        id: 'q-zh-3',
        question: 'Quel est le classificateur (量词) standard le plus universel en chinois ?',
        romanization: 'Liàngcí',
        options: ['本 (běn)', '个 (gè)', '只 (zhī)', '张 (zhāng)'],
        correctAnswerIndex: 1,
        explanation: '个 (gè) est le classificateur universel le plus utilisé (ex: 一个苹果 = une pomme, 一个人 = une personne).'
      }
    ]
  },
  {
    id: 'ex-zh-assignment-1',
    language: 'chinese',
    level: 'beginner',
    type: 'full_assignment',
    title: 'Devoir de Mandarin : Ma Famille et Mon Pays (HSK 1-2)',
    instructions: 'Rédigez un court texte en chinois (avec Pinyin si vous le souhaitez) et soumettez-le pour une correction détaillée par le Professeur M-Ris.',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    estimatedMinutes: 20,
    assignmentSubject: {
      readingPassage: '你好！我是王明。我是中国人。我家有四口人：爸爸、妈妈、哥哥和我。我学习法语。',
      readingPassageRomanized: 'Nǐ hǎo! Wǒ shì Wáng Míng. Wǒ shì Zhōngguórén. Wǒ jiā yǒu sì kǒu rén: bàba, māma, gēge hé wǒ. Wǒ xuéxí fǎyǔ.',
      readingTranslation: 'Bonjour ! Je m\'appelle Wang Ming. Je suis chinois. Il y a 4 personnes dans ma famille : mon père, ma mère, mon grand frère et moi. J\'apprends le français.',
      comprehensionQuestions: [
        '1. Combien de personnes compte la famille de Wang Ming et qui sont-elles ?',
        '2. Quelle langue étudie-t-il ?'
      ],
      grammarTask: 'Utilisez la particule interrogative "吗" (ma) pour transformer la phrase affirmative en question : "你喝茶" (Tu bois du thé).',
      essayPrompt: 'Écrivez 4 à 6 phrases en chinois pour vous présenter (nom, pays d\'origine, membres de votre famille, et une boisson ou nourriture que vous aimez).'
    }
  }
];

export const INITIAL_EVALUATIONS: AssignmentEvaluation[] = [
  {
    id: 'eval-demo-1',
    language: 'english',
    level: 'intermediate',
    studentName: 'Esther',
    submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    exerciseTitle: 'Devoir de Rédaction & Compréhension : Job Interview & Professional Goals',
    score: 18,
    maxScore: 20,
    percentageScore: 90,
    gradeLabel: 'Excellent (A+)',
    teacherSummary: 'Félicitations pour cet excellent travail ! Tes réponses de compréhension sont impeccables, le vocabulaire utilisé est riche et professionnel, et la structure de tes phrases est fluide. Tu as démontré une très bonne maîtrise du Present Perfect et des tournures professionnelles.',
    strengths: [
      'Compréhension de texte précise et sans contre-sens',
      'Vocabulaire professionnel adapté et varié (adaptability, teamwork, milestones)',
      'Bonne fluidité globale et argumentation convaincante'
    ],
    corrections: [
      {
        originalSegment: 'I am work in digital marketing since two years',
        correctedSegment: 'I have been working in digital marketing for two years',
        explanation: 'Pour une action qui a commencé dans le passé et continue dans le présent avec une durée ("depuis deux ans"), l\'anglais exige le Present Perfect Continuous avec "for" (et non "since" qui sert pour un point de départ précis comme "since 2024").',
        ruleCategory: 'grammar'
      },
      {
        originalSegment: 'Managers must to listen actively',
        correctedSegment: 'Managers must listen actively',
        explanation: 'Après les verbes modaux comme "must", "can", "should", le verbe qui suit est toujours à la base verbale SANS la particule "to".',
        ruleCategory: 'grammar'
      }
    ],
    correctedVersionFull: `1. In international teams, the two most sought-after qualities are adaptability and clear communication.
2. Modern professionals are seeking a balanced role that combines personal autonomy with collaborative teamwork.
3. Grammar rewrite: Managers must listen actively to their collaborators.
4. Essay:
My name is Esther, and I have been working in digital project management for two years. Over the next two years, my primary ambition is to lead international tech initiatives across West Africa, focusing on educational technology and digital literacy. I also aim to master professional English and Spanish to communicate seamlessly with international partners.`,
    suggestedRevisionTopics: [
      'Différence entre "for" et "since" avec le Present Perfect',
      'Règle d\'or des modaux (Must / Should / Can + Base Verbale sans "to")',
      'Connecteurs logiques professionnels (Furthermore, Consequently, In addition)'
    ],
    pedagogicalAdvice: 'Continue ainsi, ton niveau B2 est solide et tu es très proche de la fluidité C1 ! N\'hésite pas à pratiquer l\'écoute de podcasts en anglais des affaires 10 minutes chaque jour.'
  }
];
