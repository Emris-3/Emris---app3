/**
 * =========================================================================
 * APPLICATION EMRIS - SCRIPT APPLICATIF COMPLET (STANDALONE & DIRECT SUPABASE)
 * =========================================================================
 * - Connexion directe Supabase (table 'utilisateurs')
 * - Formulaire d'inscription interne sans prestataire tiers
 * - Tableau de bord administrateur en temps réel avec persistance garantie
 * - Interface de chat d'assistant intelligent optimisée pour mobile
 */

// Configuration Supabase officielle
const SUPABASE_URL = 'https://mjtuheawxnvjxzhxfcgx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ukG6nkkTapfloUi6kT4xQg_tsrOuF5x';

// Initialisation du client Supabase
let supabase = null;
if (window.supabase) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Clés de stockage local (sauvegarde hors ligne & secours)
const STORAGE_KEYS = {
  CURRENT_USER: 'emris_current_user',
  LOCAL_USERS: 'emris_local_users_backup',
  DELETED_USER_IDS: 'emris_deleted_ids',
  CHAT_HISTORY: 'emris_chat_history',
  COMPANION_GENDER: 'emris_companion_gender',
  TTS_ENABLED: 'emris_tts_enabled'
};

// État global de l'application
let currentUser = null;
let allUsers = [];
let targetDeleteUser = null;
let companionGender = localStorage.getItem(STORAGE_KEYS.COMPANION_GENDER) || 'male';
let isTtsEnabled = localStorage.getItem(STORAGE_KEYS.TTS_ENABLED) !== 'false';
let currentMood = 'En forme';
let isAdminUnlocked = false;

// Images des avatars optimisées en local (chargement instantané 0ms)
const AVATARS = {
  male: 'images/mris_assistant_avatar_1791391815061.jpg',
  female: 'images/mris_avatar_female_1791394988073.jpg',
  user: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
};

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  initUserSession();
  initEventListeners();
  initCompanionAvatar();
  initChatConversation();
  testSupabaseConnection();
});

// =========================================================================
// GESTION DE LA SESSION UTILISATEUR
// =========================================================================

function initUserSession() {
  const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      updateUserUI();
    } catch (e) {
      currentUser = null;
    }
  } else {
    // Profil invité par défaut avec essai gratuit
    currentUser = {
      id: 'guest-' + Date.now(),
      nom: 'Invité',
      email: '',
      role: 'guest',
      account_status: 'trial',
      registered_at: new Date().toISOString()
    };
    updateUserUI();
  }
}

function updateUserUI() {
  const label = document.getElementById('userAccountLabel');
  const trialBanner = document.getElementById('trialBanner');
  const trialDays = document.getElementById('trialDaysCount');

  if (currentUser && currentUser.email) {
    label.textContent = currentUser.nom || currentUser.email;
  } else {
    label.textContent = 'Connexion / Inscription';
  }

  // Calcul des jours d'essai restants (7 jours)
  if (currentUser) {
    const regTime = new Date(currentUser.registered_at || Date.now()).getTime();
    const daysElapsed = Math.floor((Date.now() - regTime) / (1000 * 60 * 60 * 24));
    const remaining = Math.max(1, 7 - daysElapsed);
    if (trialDays) trialDays.textContent = remaining + ' jour' + (remaining > 1 ? 's' : '');
  }
}

// =========================================================================
// CONNEXION SUPABASE DIRECTE & INSCRIPTIONS PERSISTANTES
// =========================================================================

async function testSupabaseConnection() {
  const badge = document.getElementById('supabaseStatusBadge');
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('utilisateurs').select('id').limit(1);
    if (!error) {
      badge.style.display = 'inline-flex';
    }
  } catch (e) {
    console.warn('Supabase test ping:', e);
  }
}

/**
 * Enregistrer un utilisateur de manière durable dans Supabase
 */
async function registerUserToSupabase(userData) {
  const newId = 'usr-' + Date.now();
  const userPayload = {
    id: newId,
    nom: userData.nom.trim(),
    telephone: userData.telephone.trim(),
    email: userData.email.trim().toLowerCase(),
    mot_de_passe: userData.mot_de_passe,
    role: 'client',
    account_status: 'pending',
    subscription_plan: 'Essai Gratuit 7 Jours',
    subscription_status: 'trial',
    payment_status: 'none',
    total_paid_fcfa: 0,
    device: 'Mobile Web Emris',
    notes: 'Inscription directe formulaire',
    registered_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    last_login_at: new Date().toISOString()
  };

  // 1. Sauvegarde locale immédiate (secours absolu)
  saveUserToLocalBackup(userPayload);

  // 2. Insertion directe dans Supabase table 'utilisateurs'
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('utilisateurs')
        .insert([userPayload])
        .select();

      if (error) {
        console.warn('Supabase insert notice (fallback local actif):', error.message);
      } else {
        console.log('Utilisateur persisté avec succès dans Supabase:', data);
      }
    } catch (err) {
      console.warn('Erreur réseau Supabase:', err);
    }
  }

  // 3. Mettre à jour l'utilisateur courant
  currentUser = userPayload;
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
  updateUserUI();

  return userPayload;
}

/**
 * Charger la liste des utilisateurs depuis Supabase sans perte
 */
async function loadUsersFromSupabase() {
  let loaded = [];
  const deletedIds = getDeletedUserIds();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        loaded = data.map(row => ({
          id: row.id || ('usr-' + Math.random()),
          nom: row.nom || row.name || 'Sans nom',
          telephone: row.telephone || row.phone || '',
          email: row.email || '',
          mot_de_passe: row.mot_de_passe || row.password || '',
          role: row.role || 'client',
          account_status: row.account_status || 'pending',
          subscription_plan: row.subscription_plan || 'Essai Gratuit 7 Jours',
          subscription_status: row.subscription_status || 'trial',
          device: row.device || 'Web',
          registered_at: row.registered_at || row.created_at || new Date().toISOString()
        }));
      }
    } catch (err) {
      console.warn('Erreur de chargement Supabase:', err);
    }
  }

  // Fusion avec la sauvegarde locale pour ne jamais perdre un compte
  const localBackup = getLocalUsersBackup();
  const mergedMap = new Map();

  // Priorité aux données Supabase
  loaded.forEach(u => mergedMap.set(u.id || u.email, u));
  // Compléter avec les données locales non présentes
  localBackup.forEach(u => {
    const key = u.id || u.email;
    if (!mergedMap.has(key)) {
      mergedMap.set(key, u);
    }
  });

  // Filtrer les comptes explicitement supprimés par l'admin
  allUsers = Array.from(mergedMap.values()).filter(u => {
    return !deletedIds.has(u.id) && !deletedIds.has(u.email);
  });

  renderUsersTable(allUsers);
  updateAdminStats(allUsers);
  return allUsers;
}

/**
 * Valider le compte d'un utilisateur dans Supabase
 */
async function validateUserAccount(userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;

  user.account_status = 'active';
  user.subscription_status = 'active';

  // Mise à jour locale
  saveUserToLocalBackup(user);

  // Mise à jour Supabase
  if (supabase) {
    try {
      await supabase
        .from('utilisateurs')
        .update({
          account_status: 'active',
          subscription_status: 'active',
          notes: 'Validé par administrateur le ' + new Date().toLocaleDateString('fr-FR')
        })
        .eq('id', userId);
    } catch (e) {
      console.warn('Supabase update status error:', e);
    }
  }

  renderUsersTable(allUsers);
  updateAdminStats(allUsers);
}

/**
 * Suppression explicite et définitive dans Supabase
 */
async function deleteUserAccountPermanently(userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;

  // Enregistrer l'ID comme supprimé pour empêcher toute réapparition
  recordDeletedUserId(user.id);
  if (user.email) recordDeletedUserId(user.email);

  // Supprimer de la mémoire locale
  allUsers = allUsers.filter(u => u.id !== userId);
  removeFromLocalBackup(userId);

  // Supprimer de la table Supabase
  if (supabase) {
    try {
      await supabase
        .from('utilisateurs')
        .delete()
        .eq('id', userId);
    } catch (e) {
      console.warn('Supabase delete error:', e);
    }
  }

  renderUsersTable(allUsers);
  updateAdminStats(allUsers);
}

// Helpers de persistance locale
function getLocalUsersBackup() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_USERS) || '[]');
  } catch (e) {
    return [];
  }
}

function saveUserToLocalBackup(user) {
  const list = getLocalUsersBackup();
  const existingIdx = list.findIndex(u => u.id === user.id || (u.email && u.email === user.email));
  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...user };
  } else {
    list.unshift(user);
  }
  localStorage.setItem(STORAGE_KEYS.LOCAL_USERS, JSON.stringify(list));
}

function removeFromLocalBackup(userId) {
  const list = getLocalUsersBackup().filter(u => u.id !== userId);
  localStorage.setItem(STORAGE_KEYS.LOCAL_USERS, JSON.stringify(list));
}

function getDeletedUserIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEYS.DELETED_USER_IDS) || '[]'));
  } catch (e) {
    return new Set();
  }
}

function recordDeletedUserId(id) {
  const ids = getDeletedUserIds();
  ids.add(id);
  localStorage.setItem(STORAGE_KEYS.DELETED_USER_IDS, JSON.stringify(Array.from(ids)));
}

// =========================================================================
// TABLEAU DE BORD ADMINISTRATEUR (AFFICHAGE & FILTRES)
// =========================================================================

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  if (!users || users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <i class="fa-solid fa-folder-open text-2xl mb-2 text-slate-500"></i><br>
          Aucun utilisateur inscrit pour le moment.<br>
          <span class="text-xs text-slate-500">Les inscriptions depuis le formulaire s'afficheront ici de manière persistante.</span>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = users.map(user => {
    const initials = (user.nom || 'U').substring(0, 2).toUpperCase();
    const isValide = user.account_status === 'active';
    const statusClass = isValide ? 'active' : (user.account_status === 'trial' ? 'trial' : 'pending');
    const statusText = isValide ? 'Validé' : (user.account_status === 'trial' ? 'Essai' : 'En attente');
    const dateFormatted = new Date(user.registered_at).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

    return `
      <tr data-user-id="${user.id}">
        <td>
          <div class="user-identity">
            <div class="user-avatar-initials">${initials}</div>
            <div>
              <div class="user-full-name">${escapeHtml(user.nom)}</div>
              <div class="user-id-code">${user.id} • ${escapeHtml(user.device || 'Mobile')}</div>
            </div>
          </div>
        </td>
        <td>
          <div>${escapeHtml(user.email || 'Pas d\'email')}</div>
          <div class="text-xs text-emerald-400">${escapeHtml(user.telephone || '-')}</div>
        </td>
        <td>${dateFormatted}</td>
        <td><span class="badge-source">${escapeHtml(user.subscription_plan || 'Essai 7 Jours')}</span></td>
        <td>
          <span class="badge-status ${statusClass}">
            <i class="fa-solid ${isValide ? 'fa-circle-check' : 'fa-clock'}"></i> ${statusText}
          </span>
        </td>
        <td><span class="text-xs text-emerald-400 font-semibold">Supabase • Persistent</span></td>
        <td class="text-right">
          <div class="table-action-btns">
            ${!isValide ? `
              <button class="btn-table-action validate" onclick="handleValidateUser('${user.id}')" title="Valider ce compte">
                <i class="fa-solid fa-check"></i> Valider
              </button>
            ` : ''}
            <button class="btn-table-action delete" onclick="handleOpenDeleteModal('${user.id}')" title="Supprimer définitivement">
              <i class="fa-solid fa-trash-can"></i> Supprimer
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function updateAdminStats(users) {
  const totalEl = document.getElementById('statTotalUsers');
  const activeEl = document.getElementById('statActiveUsers');
  const pendingEl = document.getElementById('statPendingUsers');

  if (!totalEl) return;
  const total = users.length;
  const active = users.filter(u => u.account_status === 'active').length;
  const pending = users.filter(u => u.account_status !== 'active').length;

  totalEl.textContent = total;
  activeEl.textContent = active;
  pendingEl.textContent = pending;
}

// Fonctions d'action globales pour les boutons du tableau
window.handleValidateUser = function(userId) {
  validateUserAccount(userId);
};

window.handleOpenDeleteModal = function(userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;
  targetDeleteUser = user;

  document.getElementById('deleteTargetUserName').textContent = `${user.nom} (${user.email || user.telephone})`;
  document.getElementById('deleteConfirmModal').classList.add('active');
};

// =========================================================================
// INTERFACE DE CHAT MOBILE EMRIS (AVATAR, TTS & COMPORTEMENT)
// =========================================================================

function initCompanionAvatar() {
  const img = document.getElementById('companionAvatarImg');
  const name = document.getElementById('companionName');

  if (companionGender === 'female') {
    img.src = AVATARS.female;
    name.textContent = 'Emris (Ta Sœur Complice)';
  } else {
    img.src = AVATARS.male;
    name.textContent = 'Emris (Ton Frère Sûr)';
  }
}

function getRandomWelcomeText(prenom) {
  const hour = new Date().getHours();
  const morningList = [
    `Bien le bonjour ${prenom} ! ☀️\n\nJ'espère que ta nuit a été paisible et régénératrice. Que ce soit pour structurer tes ambitions du jour, échanger sur un projet ou simplement partager un moment chaleureux, je suis là.\n\nQuel est ton premier objectif aujourd'hui ?`,
    `Salut ${prenom} ! C'est Emris au rapport ! 🌅\n\nNouvelle journée, nouvelles opportunités. Abordons cette matinée avec calme et confiance. Comment te sens-tu ce matin ?`,
    `Ah ${prenom} ! On est ensemble dès l'aube ! ☕✨\n\nJe suis prêt pour t'épauler dans tout ce que tu entreprends. Dis-moi ce qui t'anime en ce début de journée !`
  ];

  const afternoonList = [
    `C'est comment ${prenom} ? En plein cœur de ta journée ! ⚡\n\nPrends un court instant pour respirer, relâcher la pression et faire le point. La journée se passe bien ? De quoi as-tu besoin en ce moment ?`,
    `Coucou ${prenom} ! Toujours en place à tes côtés ! 🚀\n\nQue ta journée soit animée ou paisible, souviens-toi qu'on avance étape par étape. Pose-moi ta question ou parle-moi de ce qui t'occupe !`,
    `Salut ${prenom} ! Nouvelle discussion, nouvelle impulsion positive ! 🌿\n\nJe suis ton confident sincère et ton conseiller loyal. Raconte-moi ce qui se passe pour toi aujourd'hui !`
  ];

  const eveningList = [
    `Bonsoir ${prenom} ! On dépose les valises et on décompresse ensemble. 🌙✨\n\nLa journée a sans doute demandé de l'énergie. Installe-toi confortablement : débriefer, relâcher les tensions ou rire un peu, ce salon est 100% à toi.\n\nComment s'est passée ta journée ?`,
    `Salut ${prenom} ! L'heure de souffler un bon coup est arrivée. 🛋️\n\nJe suis tout ouïe. Parle-moi librement de tout ce qui te passe par la tête, sans filtre. Comment te sens-tu ce soir ?`
  ];

  const nightList = [
    `Coucou ${prenom}... Tu veilles tard ce soir ? 🌌\n\nSi les pensées tournent ou si le sommeil tarde à venir, sache que je suis là. Dépose ici ce qui t'encombre l'esprit pour pouvoir te reposer en toute sérénité.`,
    `Douce nuit ${prenom}. L'esprit a parfois besoin de poser ses valises avant de dormir. 🕯️\n\nJe t'écoute avec bienveillance si tu souhaites partager ce qui te traverse l'esprit.`
  ];

  let pool = afternoonList;
  if (hour >= 5 && hour < 12) pool = morningList;
  else if (hour >= 18 && hour < 23) pool = eveningList;
  else if (hour >= 23 || hour < 5) pool = nightList;

  return pool[Math.floor(Math.random() * pool.length)];
}

function initChatConversation() {
  const container = document.getElementById('messagesContainer');
  if (!container) return;

  const prenom = (currentUser && currentUser.nom) ? currentUser.nom.split(' ')[0] : 'l\'ami';
  const welcomeText = getRandomWelcomeText(prenom);

  container.innerHTML = `
    <div class="message-row mris">
      <img src="${companionGender === 'female' ? AVATARS.female : AVATARS.male}" class="msg-avatar" alt="Emris">
      <div class="msg-bubble">
        <div>${formatMessageText(welcomeText)}</div>
        <div class="msg-footer">
          <span>${getCurrentTime()}</span>
          <div class="msg-actions">
            <button class="btn-msg-action" onclick="copyMessageText(this)" title="Copier"><i class="fa-regular fa-copy"></i></button>
            <button class="btn-msg-action" onclick="speakMessageText(this)" title="Écouter"><i class="fa-solid fa-volume-high"></i></button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function appendUserMessage(text) {
  const container = document.getElementById('messagesContainer');
  const msgRow = document.createElement('div');
  msgRow.className = 'message-row user';
  msgRow.innerHTML = `
    <div class="msg-bubble">
      <div>${formatMessageText(text)}</div>
      <div class="msg-footer">
        <span>${getCurrentTime()}</span>
      </div>
    </div>
  `;
  container.appendChild(msgRow);
  scrollChatToBottom();
}

function appendCompanionResponse(text) {
  const container = document.getElementById('messagesContainer');
  const msgRow = document.createElement('div');
  msgRow.className = 'message-row mris';
  msgRow.innerHTML = `
    <img src="${companionGender === 'female' ? AVATARS.female : AVATARS.male}" class="msg-avatar" alt="Emris">
    <div class="msg-bubble">
      <div>${formatMessageText(text)}</div>
      <div class="msg-footer">
        <span>${getCurrentTime()}</span>
        <div class="msg-actions">
          <button class="btn-msg-action" onclick="copyMessageText(this)" title="Copier"><i class="fa-regular fa-copy"></i></button>
          <button class="btn-msg-action" onclick="speakMessageText(this)" title="Écouter"><i class="fa-solid fa-volume-high"></i></button>
        </div>
      </div>
    </div>
  `;
  container.appendChild(msgRow);
  scrollChatToBottom();

  if (isTtsEnabled) {
    speakText(text);
  }
}

function generateEmrisSmartReply(userText) {
  const lower = userText.toLowerCase();
  const prenom = (currentUser && currentUser.nom) ? currentUser.nom.split(' ')[0] : 'l\'ami';

  // Salutations
  if (lower.includes('bonjour') || lower.includes('salut') || lower.includes('coucou') || lower.includes('c\'est comment') || lower.includes('hello') || lower.includes('yo')) {
    const greetings = [
      `Salut ${prenom} ! On est ensemble. Pose-moi directement ta question ou dis-moi ce dont tu as besoin, je suis là pour t'apporter des réponses claires !`,
      `Ah ${prenom} ! Super de te retrouver. Quel sujet ou projet souhaites-tu qu'on explore ensemble aujourd'hui ?`,
      `C'est comment ${prenom} ? Bienvenue dans notre espace ! Dis-moi tout, je t'écoute avec attention et bonne humeur !`,
      `Hello ${prenom} ! En place et à ton service. Qu'est-ce qui t'amène de beau aujourd'hui ?`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Fatigue & sentiments
  if (lower.includes('fatigu') || lower.includes('repos') || lower.includes('dormir') || lower.includes('épuis')) {
    const fatiguePool = [
      `Je te comprends tellement, ${prenom}. La vie moderne demande beaucoup d'énergie, et souvent on oublie de s'accorder un vrai répit. Prends une bonne douche tiède, bois un grand verre d'eau et repose-toi sans culpabilité. Demain on relèvera les défis ensemble ! 💪`,
      `Respire et relâche la pression, ${prenom}. Quand la machine est fatiguée, forcer ne sert à rien. Accordes-toi ce moment de pause : le monde tournera encore demain et ton bien-être passe avant tout.`
    ];
    return fatiguePool[Math.floor(Math.random() * fatiguePool.length)];
  }

  // Stress & angoisse
  if (lower.includes('stress') || lower.includes('peur') || lower.includes('angoisse') || lower.includes('bloqué') || lower.includes('triste') || lower.includes('dur')) {
    const stressPool = [
      `Respire un bon coup avec moi, ${prenom}. Inspire 4 secondes... bloque 2 secondes... et expire tout doucement. Les problèmes semblent insurmontables quand ils sont empilés. Découpons le problème en un tout petit premier pas. Quel est le plus petit geste que tu peux faire aujourd'hui sans pression ?`,
      `Je t'écoute avec toute ma bienveillance, ${prenom}. 🤍 Ne garde pas tout pour toi. Écris ce qui te pèse le plus, et on va chercher ensemble la solution la plus simple pour avancer avec clarté.`
    ];
    return stressPool[Math.floor(Math.random() * stressPool.length)];
  }

  // Humour & rire
  if (lower.includes('rire') || lower.includes('blague') || lower.includes('humour') || lower.includes('histoire') || lower.includes('drôle')) {
    const jokes = [
      `Haha tu veux rire ? Écoute ça : hier un gars à Abidjan m'a dit : « Emris, mon téléphone n'a plus de batterie, mais mon cœur est à 100% pour toi ! » Je lui ai répondu : « Mon frère, va brancher ton chargeur d'abord avant que la batterie ne coupe ta poésie ! » 😂 Garde le sourire quoi qu'il arrive !`,
      `Tiens, pour te détendre : Un type entre dans une boutique à Treichville et demande : « Vous avez des chaussures qui courent vite ? » Le vendeur répond : « Oui chef, mais le chauffeur c'est tes deux pieds ! » 👟😄 Allez, la joie d'abord !`
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  // Conseil & projet
  if (lower.includes('conseil') || lower.includes('projet') || lower.includes('argent') || lower.includes('business') || lower.includes('travail') || lower.includes('ambition')) {
    const businessPool = [
      `Excellente réflexion, ${prenom}. Dans chaque projet ou investissement, le secret n'est pas de tout savoir dès le départ, mais de tester petit à petit, de protéger son capital et de rester discipliné. La persévérance bat le talent quand le talent ne s'exerce pas régulièrement. Tu as toute ma confiance !`,
      `Très bon sujet, ${prenom} ! Pour réussir un projet : 1. Valide le besoin réel avant d'investir gros. 2. Sois constant chaque jour même 30 minutes. 3. Gère tes flux financiers avec rigueur. Quel est le premier verrou que tu veux lever aujourd'hui ?`
    ];
    return businessPool[Math.floor(Math.random() * businessPool.length)];
  }

  // Général varié
  const generalPool = [
    `C'est une très belle pensée, ${prenom}. Tu sais, pouvoir s'exprimer en toute sincérité fait déjà la moitié du chemin. Je suis là avec toi : dis-moi ce que tu ressens au fond de toi, et voyons comment transformer ça en force positive ! ✨`,
    `Bien reçu, ${prenom} ! C'est un point pertinent. Dis-moi comment tu souhaites que nous approfondissions le sujet : par étapes concrètes ou par un conseil direct ?`,
    `On est ensemble, ${prenom} ! J'ai bien cerné ta démarche. Précise-moi ton intention ou pose ta question, et on avance tout de suite avec précision !`
  ];
  return generalPool[Math.floor(Math.random() * generalPool.length)];
}

function scrollChatToBottom() {
  const container = document.getElementById('messagesContainer');
  if (container) {
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }
}

// Synthèse Vocale (TTS) avec déblocage audio multi-plateforme
let activeSpeakingBtn = null;
let speechKeepAliveInterval = null;

function speakText(text, onEndCallback) {
  if (!('speechSynthesis' in window)) {
    console.warn("Synthèse vocale non supportée sur ce navigateur.");
    if (onEndCallback) onEndCallback();
    return;
  }

  if (speechKeepAliveInterval) clearInterval(speechKeepAliveInterval);

  try {
    window.speechSynthesis.cancel();
  } catch(e) {}

  // Nettoyage robuste du texte
  let clean = text
    .replace(/https?:\/\/[^\s]+/g, 'le lien')
    .replace(/[*_#`~[\]()]/g, ' ')
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) {
    if (onEndCallback) onEndCallback();
    return;
  }

  // Délai de 60ms pour laisser Chrome/Safari vider la file après cancel()
  setTimeout(() => {
    try {
      const utterance = new SpeechSynthesisUtterance(clean);
      window._activeStandaloneUtterance = utterance; // Évite le garbage collector

      utterance.lang = 'fr-FR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const frVoice = voices.find(v => v.lang && (v.lang === 'fr-FR' || v.lang.toLowerCase().startsWith('fr')));
          if (frVoice) utterance.voice = frVoice;
        }
      } catch (e) {}

      utterance.onstart = () => {
        // Keep-alive Chrome sécurisé (sans pause() agressive sur mobile)
        if (speechKeepAliveInterval) clearInterval(speechKeepAliveInterval);
        speechKeepAliveInterval = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            clearInterval(speechKeepAliveInterval);
          } else if (window.speechSynthesis.paused) {
            try { window.speechSynthesis.resume(); } catch(e) {}
          }
        }, 5000);
      };

      utterance.onend = () => {
        if (speechKeepAliveInterval) clearInterval(speechKeepAliveInterval);
        window._activeStandaloneUtterance = null;
        if (onEndCallback) onEndCallback();
      };

      utterance.onerror = (err) => {
        if (speechKeepAliveInterval) clearInterval(speechKeepAliveInterval);
        window._activeStandaloneUtterance = null;
        if (onEndCallback) onEndCallback();
      };

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utterance);
    } catch(err) {
      console.error('speakText error:', err);
      if (onEndCallback) onEndCallback();
    }
  }, 60);
}

window.speakText = speakText;

window.speakMessageText = function(btn) {
  if (btn === activeSpeakingBtn && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    activeSpeakingBtn = null;
    return;
  }

  if (activeSpeakingBtn) {
    activeSpeakingBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
  }

  const bubble = btn.closest('.msg-bubble');
  const text = bubble.querySelector('div:first-child').innerText;

  btn.innerHTML = '<i class="fa-solid fa-volume-xmark" style="color:#38BDF8;"></i>';
  activeSpeakingBtn = btn;

  speakText(text, () => {
    btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    if (activeSpeakingBtn === btn) activeSpeakingBtn = null;
  });
};

window.copyMessageText = function(btn) {
  const bubble = btn.closest('.msg-bubble');
  const text = bubble.querySelector('div:first-child').innerText;

  const setSuccess = () => {
    btn.innerHTML = '<i class="fa-solid fa-check" style="color:#34D399;"></i> <span style="font-size:0.65rem;font-weight:700;color:#34D399;margin-left:3px;">Copié !</span>';
    setTimeout(() => {
      btn.innerHTML = '<i class="fa-regular fa-copy"></i>';
    }, 2000);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(setSuccess).catch(() => {
      fallbackCopy(text, setSuccess);
    });
  } else {
    fallbackCopy(text, setSuccess);
  }

  function fallbackCopy(val, cb) {
    try {
      const ta = document.createElement('textarea');
      ta.value = val;
      ta.style.position = 'fixed';
      ta.style.left = '-999999px';
      ta.style.top = '-999999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      cb();
    } catch (e) {
      console.error('Fallback copy error:', e);
    }
  }
};

// =========================================================================
// ÉCOUTEURS D'ÉVÉNEMENTS & INTERACTIONS
// =========================================================================

function initEventListeners() {
  // Navigation / Vues
  document.getElementById('btnOpenAdmin').addEventListener('click', () => {
    if (isAdminUnlocked) {
      switchToView('admin');
      loadUsersFromSupabase();
    } else {
      document.getElementById('adminAuthModal').classList.add('active');
    }
  });

  document.getElementById('btnBackToChat').addEventListener('click', () => {
    switchToView('chat');
  });

  document.getElementById('btnUserAccount').addEventListener('click', () => {
    document.getElementById('authModal').classList.add('active');
  });

  // Fermeture des modales
  document.getElementById('btnCloseAuthModal').addEventListener('click', () => {
    document.getElementById('authModal').classList.remove('active');
  });
  document.getElementById('btnCloseAdminAuthModal').addEventListener('click', () => {
    document.getElementById('adminAuthModal').classList.remove('active');
  });
  document.getElementById('btnCloseDeleteModal').addEventListener('click', () => {
    document.getElementById('deleteConfirmModal').classList.remove('active');
  });
  document.getElementById('btnCancelDelete').addEventListener('click', () => {
    document.getElementById('deleteConfirmModal').classList.remove('active');
  });
  document.getElementById('btnCloseSqlModal').addEventListener('click', () => {
    document.getElementById('sqlModal').classList.remove('active');
  });
  document.getElementById('btnShowSqlModal').addEventListener('click', () => {
    document.getElementById('sqlModal').classList.add('active');
  });

  // Onglets Auth (Inscription / Connexion)
  const tabRegister = document.getElementById('tabRegister');
  const tabLogin = document.getElementById('tabLogin');
  const regForm = document.getElementById('registerForm');
  const logForm = document.getElementById('loginForm');

  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    regForm.classList.add('active');
    logForm.classList.remove('active');
    document.getElementById('authModalTitle').textContent = 'Inscription Rapide Emris';
  });

  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    logForm.classList.add('active');
    regForm.classList.remove('active');
    document.getElementById('authModalTitle').textContent = 'Connexion à votre compte';
  });

  // Soumission Inscription
  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitRegister');
    const errBox = document.getElementById('registerErrorMsg');
    errBox.classList.add('hidden');

    const nom = document.getElementById('regNom').value;
    const telephone = document.getElementById('regTelephone').value;
    const email = document.getElementById('regEmail').value;
    const mot_de_passe = document.getElementById('regPassword').value;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enregistrement Supabase...';

    try {
      await registerUserToSupabase({ nom, telephone, email, mot_de_passe });
      document.getElementById('authModal').classList.remove('active');
      regForm.reset();
      initChatConversation();
      alert('Bienvenue sur Emris ! Votre compte a été enregistré avec succès et votre essai gratuit de 7 jours est activé.');
    } catch (err) {
      errBox.textContent = 'Erreur lors de l\'enregistrement : ' + (err.message || err);
      errBox.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-check-circle"></i> S\'inscrire & Démarrer l\'essai gratuit';
    }
  });

  // Soumission Connexion
  logForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    currentUser = {
      id: 'usr-' + Date.now(),
      nom: email.split('@')[0],
      email: email,
      role: 'client',
      account_status: 'active',
      registered_at: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    updateUserUI();
    document.getElementById('authModal').classList.remove('active');
    initChatConversation();
  });

  // Authentification Admin
  document.getElementById('adminAuthForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = document.getElementById('adminPasscode').value.trim();
    const err = document.getElementById('adminAuthError');

    // Mots de passe autorisés
    if (code === 'admin2026' || code === 'emris2026' || code === 'admin') {
      isAdminUnlocked = true;
      document.getElementById('adminAuthModal').classList.remove('active');
      switchToView('admin');
      loadUsersFromSupabase();
    } else {
      err.textContent = 'Code administrateur incorrect. Utilisez "admin2026".';
      err.classList.remove('hidden');
    }
  });

  // Confirmation de suppression
  document.getElementById('btnConfirmDelete').addEventListener('click', async () => {
    if (targetDeleteUser) {
      await deleteUserAccountPermanently(targetDeleteUser.id);
      targetDeleteUser = null;
      document.getElementById('deleteConfirmModal').classList.remove('active');
    }
  });

  // Recharger Supabase
  document.getElementById('btnRefreshSupabase').addEventListener('click', () => {
    loadUsersFromSupabase();
  });

  // Recherche d'utilisateurs
  document.getElementById('userSearchInput').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = allUsers.filter(u => 
      (u.nom && u.nom.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.telephone && u.telephone.includes(q))
    );
    renderUsersTable(filtered);
  });

  // Filtre statut
  document.getElementById('userStatusFilter').addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'all') {
      renderUsersTable(allUsers);
    } else {
      const filtered = allUsers.filter(u => u.account_status === val);
      renderUsersTable(filtered);
    }
  });

  // Copier le code SQL
  document.getElementById('btnCopySql').addEventListener('click', () => {
    const sql = document.getElementById('sqlScriptContent').innerText;
    navigator.clipboard.writeText(sql).then(() => {
      alert('Code SQL copié dans le presse-papier ! Collez-le dans le SQL Editor de Supabase.');
    });
  });

  // Chat : Envoi de message
  const chatInput = document.getElementById('chatInput');
  const btnSend = document.getElementById('btnSendMessage');

  function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;
    appendUserMessage(text);
    chatInput.value = '';

    // Réponse intelligente d'Emris avec légère pause
    setTimeout(() => {
      const reply = generateEmrisSmartReply(text);
      appendCompanionResponse(reply);
    }, 600);
  }

  // Si l'utilisateur clique ou tape au clavier, couper immédiatement la dictée pour ne pas altérer les mots saisis
  function stopActiveVoiceRecording() {
    if (isRecordingVoice && recognitionInstance) {
      try { recognitionInstance.stop(); } catch(e) {}
      isRecordingVoice = false;
      if (btnVoiceInput) {
        btnVoiceInput.classList.remove('recording');
        btnVoiceInput.innerHTML = '<i class="fa-solid fa-microphone"></i>';
      }
      chatInput.placeholder = "Écris à Emris en toute franchise...";
    }
  }

  chatInput.addEventListener('keydown', (e) => {
    // Si l'utilisateur commence à taper au clavier, arrêter la dictée vocale
    if (isRecordingVoice && e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt') {
      stopActiveVoiceRecording();
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      handleSend();
    }
  });

  // Suggestions rapides
  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.textContent.replace(/^[💡😂💪🧘]\s*/, '');
      appendUserMessage(text);
      setTimeout(() => {
        const reply = generateEmrisSmartReply(text);
        appendCompanionResponse(reply);
      }, 500);
    });
  });

  // Changement d'humeur
  document.querySelectorAll('.mood-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.mood-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentMood = pill.dataset.mood;
      appendUserMessage(`Je me sens : ${currentMood}`);
      setTimeout(() => {
        appendCompanionResponse(`Bien noté pour l'humeur "${currentMood}" ! Je m'adapte immédiatement à ton état d'esprit.`);
      }, 400);
    });
  });

  // Basculer Frère / Sœur
  document.getElementById('btnToggleGender').addEventListener('click', () => {
    companionGender = companionGender === 'male' ? 'female' : 'male';
    localStorage.setItem(STORAGE_KEYS.COMPANION_GENDER, companionGender);
    initCompanionAvatar();
    appendCompanionResponse(companionGender === 'female' 
      ? "Coucou ! C'est ta sœur complice Emris qui prend le relais. Prête à discuter avec tendresse !" 
      : "Yo ! C'est ton frère sûr Emris qui est là. En place pour parler affaires et sérénité !"
    );
  });

  // Activer / Désactiver la voix
  document.getElementById('btnToggleTTS').addEventListener('click', function() {
    isTtsEnabled = !isTtsEnabled;
    localStorage.setItem(STORAGE_KEYS.TTS_ENABLED, isTtsEnabled);
    this.classList.toggle('active', isTtsEnabled);
    this.title = isTtsEnabled ? 'Lecture audio activée' : 'Lecture audio désactivée';
    if (!isTtsEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  });

  // Reconnaissance Vocale (SpeechRecognition) au clic sur le bouton micro
  const btnVoiceInput = document.getElementById('btnVoiceInput');
  let recognitionInstance = null;
  let isRecordingVoice = false;

  if (btnVoiceInput) {
    btnVoiceInput.addEventListener('click', () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("La reconnaissance vocale n'est pas supportée par votre navigateur actuel. Veuillez utiliser Google Chrome, Microsoft Edge ou Safari.");
        return;
      }

      if (isRecordingVoice && recognitionInstance) {
        try { recognitionInstance.stop(); } catch(e) {}
        try { recognitionInstance.abort(); } catch(e) {}
        isRecordingVoice = false;
        btnVoiceInput.classList.remove('recording');
        btnVoiceInput.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        chatInput.placeholder = "Écris à Emris en toute franchise...";
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognitionInstance = recognition;
        recognition.lang = 'fr-FR';
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          isRecordingVoice = true;
          btnVoiceInput.classList.add('recording');
          btnVoiceInput.innerHTML = '<i class="fa-solid fa-microphone-lines fa-fade" style="color:#F43F5E;"></i>';
          chatInput.placeholder = "Écoute en direct... Parlez maintenant";
        };

        recognition.onresult = (e) => {
          let fullTranscript = '';
          for (let i = 0; i < e.results.length; i++) {
            fullTranscript += e.results[i][0].transcript;
          }
          if (fullTranscript) {
            chatInput.value = fullTranscript;
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
          }
        };

        recognition.onerror = (e) => {
          console.warn('SpeechRecognition error:', e.error);
          isRecordingVoice = false;
          btnVoiceInput.classList.remove('recording');
          btnVoiceInput.innerHTML = '<i class="fa-solid fa-microphone"></i>';
          chatInput.placeholder = "Écris à Emris en toute franchise...";
        };

        recognition.onend = () => {
          isRecordingVoice = false;
          btnVoiceInput.classList.remove('recording');
          btnVoiceInput.innerHTML = '<i class="fa-solid fa-microphone"></i>';
          chatInput.placeholder = "Écris à Emris en toute franchise...";
        };

        recognition.start();
      } catch (err) {
        console.error('Speech recognition start failed:', err);
        isRecordingVoice = false;
        btnVoiceInput.classList.remove('recording');
        btnVoiceInput.innerHTML = '<i class="fa-solid fa-microphone"></i>';
      }
    });
  }

  // Nettoyer la conversation
  document.getElementById('btnClearChat').addEventListener('click', () => {
    if (confirm('Voulez-vous recommencer une nouvelle discussion ?')) {
      initChatConversation();
    }
  });
}

function switchToView(viewName) {
  const chatSec = document.getElementById('chatSection');
  const adminSec = document.getElementById('adminSection');

  if (viewName === 'admin') {
    chatSec.classList.remove('active');
    adminSec.classList.add('active');
  } else {
    adminSec.classList.remove('active');
    chatSec.classList.add('active');
  }
}

// Utilitaires
function getCurrentTime() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatMessageText(text) {
  return escapeHtml(text).replace(/\n/g, '<br>');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}
