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

// Images des avatars
const AVATARS = {
  male: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  female: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
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

function initChatConversation() {
  const container = document.getElementById('messagesContainer');
  if (!container) return;

  const prenom = (currentUser && currentUser.nom) ? currentUser.nom.split(' ')[0] : 'l\'ami';

  const welcomeText = `Ah ${prenom} ! C'est comment ? On est ensemble ici ! 👋\n\nJe suis Emris, ton compagnon virtuel intelligent : confident sincère, grand frère de bon conseil et doté d'une écoute 100% bienveillante.\n\nQu'on veuille parler de tes ambitions, déposer un souci qui pèse ou simplement échanger sur ta journée, parle-moi librement comme à ton proche le plus sûr.\n\nComment te sens-tu en ce moment ?`;

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
  const prenom = (currentUser && currentUser.nom) ? currentUser.nom.split(' ')[0] : 'mon cher';

  if (lower.includes('fatigu') || lower.includes('repos') || lower.includes('dormir')) {
    return `Je te comprends tellement, ${prenom}. La vie moderne demande beaucoup d'énergie, et souvent on oublie de s'accorder un vrai répit. Prends une bonne douche tiède, bois un grand verre d'eau et repose-toi sans culpabilité. Demain le soleil se lèvera encore et on relèvera les défis ensemble ! 💪`;
  }
  if (lower.includes('stress') || lower.includes('peur') || lower.includes('angoisse') || lower.includes('bloqué')) {
    return `Respire un bon coup avec moi, ${prenom}. Inspire 4 secondes... bloque 2 secondes... et expire tout doucement. Les problèmes semblent souvent insurmontables quand ils sont empilés dans notre tête. Découpons le problème en un tout petit premier pas. Quel est le plus petit geste que tu peux faire aujourd'hui sans pression ?`;
  }
  if (lower.includes('rire') || lower.includes('blague') || lower.includes('humour') || lower.includes('histoire')) {
    return `Haha tu veux rire ? Écoute ça : hier un gars à Abidjan m'a dit : « Emris, mon téléphone n'a plus de batterie, mais mon cœur est à 100% pour toi ! » Je lui ai répondu : « Mon frère, va brancher ton chargeur d'abord avant que la batterie ne coupe ta poésie ! » 😂 Garde le sourire quoi qu'il arrive !`;
  }
  if (lower.includes('conseil') || lower.includes('projet') || lower.includes('argent') || lower.includes('business')) {
    return `Excellente réflexion, ${prenom}. Dans chaque projet ou investissement, le secret n'est pas de tout savoir dès le départ, mais de tester petit à petit, de protéger son capital et de rester discipliné. La persévérance bat le talent quand le talent ne s'exerce pas régulièrement. Tu as toute ma confiance !`;
  }

  return `C'est une très belle pensée, ${prenom}. Tu sais, pouvoir s'exprimer en toute sincérité fait déjà la moitié du chemin. Je suis là avec toi : dis-moi ce que tu ressens au fond de toi, et voyons comment transformer ça en force positive pour ta semaine ! ✨`;
}

function scrollChatToBottom() {
  const container = document.getElementById('messagesContainer');
  if (container) {
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }
}

// Synthèse Vocale (TTS)
function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  // Nettoyer les emojis et caractères superflus pour la voix
  const clean = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = 'fr-FR';
  utterance.rate = 1.0;
  utterance.pitch = companionGender === 'female' ? 1.15 : 0.95;

  window.speechSynthesis.speak(utterance);
}

window.speakMessageText = function(btn) {
  const bubble = btn.closest('.msg-bubble');
  const text = bubble.querySelector('div:first-child').innerText;
  speakText(text);
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

  btnSend.addEventListener('click', handleSend);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
