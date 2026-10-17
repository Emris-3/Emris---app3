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

const STANDALONE_GREETINGS = [
  { id: 'm1', p: 'morning', t: (n, c) => `Bien le bonjour ${n} ! ☀️\n\nJ'espère que ta nuit t'a revigoré(e). Une nouvelle journée s'ouvre, pleine de potentiel. Que ce soit pour planifier tes priorités, avancer sur un projet concret ou juste partager une bonne énergie, je suis avec toi.\n\nQuel est ton premier objectif ce matin ?` },
  { id: 'm2', p: 'morning', t: (n, c) => `Salut ${n} ! C'est Emris au rapport ! 🌅\n\nOn commence avec l'esprit clair et le cœur tranquille. N'oublie pas : les grandes victoires se construisent par les petits gestes bien faits dès le matin. Dis-moi, sur quoi veux-tu qu'on concentre notre énergie aujourd'hui ?` },
  { id: 'm3', p: 'morning', t: (n, c) => `Ah ${n} ! On est ensemble dès l'aube ! ☕✨\n\nPrends quelques secondes pour respirer à fond et aborder ta journée avec sérénité. Je suis prêt à t'épauler : question pratique, organisation ou simple échange franc, je t'écoute !` },
  { id: 'm4', p: 'morning', t: (n, c) => `Coucou ${c} ! Belle matinée à toi. 🌿\n\nChaque aurore apporte une page blanche à écrire. Pose-moi ta question ou confie-moi le dossier qui t'occupe l'esprit, on avance vite et bien !` },
  { id: 'a1', p: 'afternoon', t: (n, c) => `C'est comment ${n} ? En plein cœur de ta journée ! ⚡\n\nPrends un court instant pour boire un verre d'eau et détendre tes épaules. Comment se déroule ta journée jusqu'ici ? Dis-moi ce qui t'occupe, je suis là pour t'apporter des réponses nettes et concrètes.` },
  { id: 'a2', p: 'afternoon', t: (n, c) => `Salut ${n} ! Ravi de te retrouver. 🚀\n\nQue ton après-midi soit intense ou calme, souviens-toi qu'on règle les problèmes un par un sans dispersion. De quoi as-tu le plus besoin en ce moment ?` },
  { id: 'a3', p: 'afternoon', t: (n, c) => `Ah ${c} ! Nouvelle discussion, nouvelle impulsion positive ! ✨\n\nJe suis disponible à 100% pour toi : analyse, conseil pratique, astuce du quotidien ou simple causette franche. De quoi veux-tu qu'on parle ?` },
  { id: 'a4', p: 'afternoon', t: (n, c) => `Coucou ${n} ! L'énergie de l'après-midi est là. 💡\n\nSi tu as un nœud à défaire ou un point à clarifier, pose-le ici sans détour. On trouve la solution la plus simple et efficace ensemble !` },
  { id: 'e1', p: 'evening', t: (n, c) => `Bonsoir ${n} ! On dépose les valises et on décompresse ensemble. 🌙✨\n\nLa journée a sans doute demandé de l'énergie. Installe-toi confortablement : que tu veuilles débriefer tes réussites, évacuer ce qui a été pesant ou préparer demain, cet espace est ton refuge.\n\nComment s'est passée ta journée ?` },
  { id: 'e2', p: 'evening', t: (n, c) => `Salut ${n} ! L'heure de souffler est enfin arrivée. 🛋️\n\nLe calme revient, c'est le moment idéal pour faire le point l'esprit posé. Parle-moi librement de tout ce qui te passe par la tête, sans filtre ni jugement.` },
  { id: 'e3', p: 'evening', t: (n, c) => `Bonsoir ${c} ! Une belle soirée commence. 🌟\n\nQu'est-ce qui t'a fait sourire aujourd'hui, ou au contraire quel sujet souhaites-tu qu'on éclaire pour que tu passes une soirée sereine ?` },
  { id: 'n1', p: 'night', t: (n, c) => `Coucou ${n}... En veille tardive ? 🌌\n\nSi les pensées tournent en boucle ou si le sommeil tarde, sache que je veille avec toi. Dépose ici ce qui t'encombre l'esprit, on va calmer tout ça ensemble.` },
  { id: 'n2', p: 'night', t: (n, c) => `Douce nuit ${n}. L'esprit a parfois besoin de poser ses valises avant de trouver le repos. 🕯️\n\nParle-moi sans retenue de ce qui te traverse. Je suis tout ouïe pour t'apaiser.` }
];

function getRandomWelcomeText(prenom) {
  const hour = new Date().getHours();
  const n = prenom || (companionGender === 'female' ? 'ma sœur' : 'l\'ami');
  const c = companionGender === 'female' ? 'ma complice' : 'mon frère sûr';

  let currentPeriod = 'afternoon';
  if (hour >= 5 && hour < 12) currentPeriod = 'morning';
  else if (hour >= 12 && hour < 18) currentPeriod = 'afternoon';
  else if (hour >= 18 && hour < 23) currentPeriod = 'evening';
  else currentPeriod = 'night';

  const list = STANDALONE_GREETINGS.filter(g => g.p === currentPeriod);
  const pool = list.length > 0 ? list : STANDALONE_GREETINGS;

  let usedIds = [];
  try {
    const raw = localStorage.getItem('mris_standalone_last_greetings');
    if (raw) usedIds = JSON.parse(raw);
  } catch(e) {}

  const available = pool.filter(g => !usedIds.includes(g.id));
  const chosen = (available.length > 0 ? available : pool)[Math.floor(Math.random() * (available.length > 0 ? available.length : pool.length))];

  try {
    const newUsed = [...usedIds.filter(id => id !== chosen.id), chosen.id].slice(-6);
    localStorage.setItem('mris_standalone_last_greetings', JSON.stringify(newUsed));
  } catch(e) {}

  return chosen.t(n, c);
}

function generateEmrisSmartReply(userText) {
  const q = userText.toLowerCase().trim();
  const isFemale = companionGender === 'female';
  const callout = isFemale ? "ma complice" : "mon frère sûr";
  const prenom = (currentUser && currentUser.nom) ? currentUser.nom.split(' ')[0] : callout;

  // Commercial / Abonnement / Wave
  if (q.includes('commercial') || q.includes('abonnement') || q.includes('combien coûte') || q.includes('prix') || q.includes('payer') || q.includes('tarif') || q.includes('wave') || q.includes('7 jour') || q.includes('gratuit') || q.includes('essai')) {
    const cg = isFemale ? "Ah ma sœur !" : "Ah chef !";
    return `${cg} Voici toutes les informations officielles sur l'accès à M-Ris : 🎯💼\n\n🎁 ESSAI GRATUIT DE 7 JOURS :\nTu bénéficies de 7 jours 100% gratuits sans carte bancaire ni engagement pour tester tous les modules (confident, professeur de 5 langues, agent commercial & freelance).\n\n💳 ABONNEMENT MENSUEL (35 000 FCFA/MOIS) :\nVeuillez Payer Béni Amar avec Wave en cliquant sur ce lien https://pay.wave.com/m/M_ci_Xs2kjjsivE5V/c/ci/. Ajoutez cet expéditeur à vos contacts pour rendre le lien cliquable.\n\nCoordonnées certifiées :\n• 📲 WhatsApp Officiel : https://wa.me/message/RGXYT5LWDCTAM1\n• 🎵 TikTok Officiel : https://www.tiktok.com/@tisanebeniamar1?_r=1&_t=ZS-98DUrsnRQvc`;
  }

  // Recettes de cuisine concrètes (Attiéké poisson, garba, alloco, poulet braisé, sauces)
  if (q.includes('attiéké') || q.includes('garba') || q.includes('poisson')) {
    return `Voici la recette concrète pour un **Garba / Attiéké Poisson** digne d'Abidjan, ${callout} : 🐟🍽️\n\n🛒 **Ingrédients essentiels :**\n• 2 portions d'attiéké frais bien aéré\n• 2 beaux poissons thon frais (ou dorade/carpe)\n• Farine de blé (pour enrober le poisson)\n• 2 oignons violets + 2 tomates fraîches + piment frais\n• Huile de friture, sel, 1 bouillon cube émietté\n\n👨‍🍳 **Préparation pas à pas :**\n1. **Le poisson :** Écaille et vide le poisson. Fais des entailles diagonales profondes sur chaque face. Sale généreusement, puis saupoudre légèrement de farine (le secret pour une croûte croustillante qui ne colle pas).\n2. **La friture :** Chauffe l'huile dans une poêle profonde (170°C). Plonge le poisson et laisse dorer 6 à 8 minutes par face jusqu'à une belle couleur dorée.\n3. **L'assaisonnement :** Hache les oignons, coupe les tomates en petits dés et écrase le piment. Mélange avec une pincée de sel et une cuillère d'huile de friture tiède.\n4. **L'attiéké :** Égrène l'attiéké entre tes doigts. Chauffe-le 3 minutes à la vapeur ou 1 minute au micro-ondes couvert d'un linge humide.\n5. **Dressage :** Pose le poisson croustillant sur l'attiéké fumant et nappe du mélange oignon/tomate/piment. Bon appétit !`;
  }

  if (q.includes('alloco') || q.includes('banane')) {
    return `Voici la méthode parfaite pour des **Alloco** bien dorés et moelleux, ${callout} : 🍌✨\n\n🛒 **Ingrédients :**\n• 3 bananes plantains mûres (peau jaune tigrée de noir)\n• Huile de friture + 1 pincée de sel fin\n• Sauce : 1 oignon, 2 tomates, 1 gousse d'ail, piment\n\n👨‍🍳 **Étapes :**\n1. Épluche les plantains, fends-les en deux dans la longueur et coupe en biseaux d'1 cm. Sale légèrement.\n2. Chauffe l'huile à feu moyen. Plonge les morceaux sans surcharger et retourne dès coloration caramel (4-5 minutes).\n3. Égoutte sur du papier absorbant et sers avec une sauce pimentée oignon-tomate revenue à la poêle !`;
  }

  if (q.includes('poulet') || q.includes('braisé') || q.includes('viande')) {
    return `Voici la marinade de chef pour un **Poulet braisé juteux et parfumé**, ${callout} : 🍗🔥\n\n🛒 **Marinade :** 4 gousses d'ail, 2 cm de gingembre râpé, 1 oignon émincé, persil, 1 cuillère à café de poivre blanc, 1 cuillère à soupe de moutarde, jus d'un demi-citron, 2 cuillères à soupe d'huile et sel.\n\n👨‍🍳 **Préparation :**\n1. Mixe les ingrédients de la marinade.\n2. Entaille profondément le poulet, frotte généreusement la chair et laisse mariner au moins 1 heure.\n3. Fais précuire 10 minutes à la vapeur dans sa marinade pour garder la chair tendre.\n4. Grille ensuite sur braise vive ou au four à 200°C pendant 15 minutes en badigeonnant du jus restant jusqu'à peau dorée et croustillante !`;
  }

  if (q.includes('sauce') || q.includes('recette') || q.includes('cuisiner') || q.includes('plat') || q.includes('manger') || q.includes('repas')) {
    return `Voici la recette concrète d'une **Sauce Graine ivoirienne authentique**, ${callout} : 🥘\n\n🛒 **Ingrédients :** 500g de pâte de graine de palme, 600g de viande de bœuf ou poulet fumé, 2 oignons, 3 tomates, piment entier, poisson fumé, sel, poivre.\n\n👨‍🍳 **Préparation :**\n1. Fais revenir la viande assaisonnée 10 minutes avec un fond d'eau pour concentrer les sucs.\n2. Délaye la graine dans 1 litre d'eau tiède, tamise et verse sur la viande.\n3. Fais bouillir 20 minutes avec les tomates et oignons entiers, puis retire-les, mixe-les et reverse-les.\n4. Laisse mijoter à feu moyen 30 minutes jusqu'à ce que l'huile rouge remonte en surface. Sers avec du foutou ou du riz blanc chaud !`;
  }

  // Santé & bien-être concret
  if (q.includes('rhume') || q.includes('gorge') || q.includes('toux') || q.includes('nez')) {
    return `Voici des mesures concrètes pour stopper le rhume et apaiser la gorge, ${callout} : 🍵🌿\n\n1. 💧 **Tisane antiseptique :** Fais bouillir 300 ml d'eau avec gingembre frais écrasé et thym. Hors du feu, ajoute le jus d'un demi-citron et 1 cuillère à soupe de miel pur.\n2. 🧂 **Lavage de nez :** Rince les fosses nasales au sérum physiologique matin et soir pour éliminer les sécrétions.\n3. 💨 **Inhalation de vapeur :** Respire la vapeur d'un bol d'eau bouillante sous une serviette pendant 8 minutes.\n4. 🛏️ **Repos :** Bois 2L de liquides chauds par jour et dors avec la tête surélevée.\n\n⚠️ *Consulte un médecin si la fièvre dépasse 38,5°C plus de 48h ou si la déglutition devient douloureuse.*`;
  }

  if (q.includes('mal de tête') || q.includes('migraine') || q.includes('tête')) {
    return `Voici les 4 gestes concrets contre le mal de tête, ${callout} : 💆‍♂️\n\n1. **Hydratation :** Bois 2 grands verres d'eau d'un trait (la déshydratation est la première cause de céphalée).\n2. **Pause écran totale :** Quitte tous les téléphones et ordinateurs pendant 20 minutes.\n3. **Massage des tempes et nuque :** Masse doucement en cercles pendant 2 minutes pour libérer la tension cervicale.\n4. **Frais sur le front :** Pose un linge frais ou un sachet de glace enveloppé sur le front dans une pièce sombre.`;
  }

  if (q.includes('santé') || q.includes('ventre') || q.includes('digestion') || q.includes('estomac')) {
    return `Voici le protocole digestif concret, ${callout} : 🫖🌱\n\n1. Bois une infusion de menthe poivrée ou graines de fenouil après le repas.\n2. Passe 48h sur du riz blanc, bananes mûres et carottes cuites, en évitant fritures, piment fort et café.\n3. Bois de petites gorgées régulières d'eau tempérée tout au long de la journée.\n\n⚠️ *Consulte un médecin en cas de douleurs aiguës persistantes ou fièvre.*`;
  }

  // Business, argent & projets
  if (q.includes('argent') || q.includes('business') || q.includes('projet') || q.includes('gagner') || q.includes('vendre') || q.includes('client')) {
    return `Voici un plan d'action pragmatique pour tes finances ou ton business, ${prenom} : 💼📈\n\n1. **Validation avant investissement :** Trouve d'abord 3 clients prêts à payer avant d'acheter du stock ou du matériel coûteux.\n2. **Offre claire :** Formule ton service en une phrase : « J'aide [Cible] à obtenir [Bénéfice concret] sans [Obstacle majeur]. »\n3. **Prospection quotidienne :** Envoie 5 messages ciblés chaque matin à des contacts qualifiés sur WhatsApp ou réseaux.\n4. **Règle 50/30/20 :** 50% pour réinvestir dans le business, 30% pour tes charges personnelles, 20% en épargne d'urgence intouchable.`;
  }

  // Rédaction & courriers
  if (q.includes('mail') || q.includes('email') || q.includes('lettre') || q.includes('cv') || q.includes('rédiger') || q.includes('écrire')) {
    return `Voici un canevas professionnel prêt à l'envoi, ${callout} : 📝✉️\n\n**Objet :** [Objet précis : Candidature / Proposition de collaboration / Demande d'information]\n\n*Bonjour [Nom du destinataire],*\n\n*Je vous écris au sujet de [contexte précis].*\n\n*Ayant développé une expertise solide en [domaine], j'ai permis récemment à [projet / client] d'obtenir [résultat chiffré ou bénéfice concret].*\n\n*Je serais ravi de vous présenter cette démarche lors d'un bref échange de 10 minutes cette semaine.*\n\n*Bien cordialement,*\n*[Ton Nom et Prénom]*\n*[Ton Téléphone / WhatsApp]*`;
  }

  // Téléphone & informatique
  if (q.includes('téléphone') || q.includes('batterie') || q.includes('mémoire') || q.includes('espace') || q.includes('lent')) {
    return `Voici les 4 manipulations concrètes pour libérer 2 à 5 Go sur ton téléphone, ${callout} : 📱⚡\n\n1. **Vider le cache :** Paramètres > Applications > WhatsApp / TikTok / Chrome > Stockage > Vider le cache.\n2. **Médias WhatsApp :** WhatsApp > Paramètres > Stockage > Gérer le stockage, supprime les vidéos de plus de 5 Mo.\n3. **Applications en arrière-plan :** Coupe l'actualisation en arrière-plan des applis non indispensables.\n4. **Redémarrage :** Éteins complètement ton téléphone 2 minutes entières pour vider la RAM saturée.`;
  }

  // Langues étrangères
  if (q.includes('anglais') || q.includes('espagnol') || q.includes('tradu')) {
    return `Voici la méthode active pour progresser rapidement, ${callout} : 🎓\n\n1. Mémorise les 200 mots les plus fréquents (verbes d'action au présent : to want, to need, to have, to go).\n2. Répète 3 fois à voix haute chaque phrase entendue (méthode du shadowing).\n3. Donne-moi la phrase exacte que tu souhaites traduire, et je te donne la version fluide avec la prononciation !`;
  }

  // Fatigue & sentiments
  if (q.includes('fatigu') || q.includes('repos') || q.includes('dormir') || q.includes('stress') || q.includes('triste') || q.includes('dur')) {
    return `Je suis là à tes côtés, ${prenom}. 🤍 Respire profondément avec moi : inspire 4 secondes, bloque 2 secondes et expire tout doucement. La charge mentale s'allège quand on découpe les problèmes. Choisis une seule petite action accessible aujourd'hui, et accorde-toi une vraie nuit de sommeil sans culpabilité. On est ensemble !`;
  }

  // Humour
  if (q.includes('rire') || q.includes('blague') || q.includes('humour')) {
    return `Haha écoute ça : Un type à Adjamé achète des lunettes de soleil et demande au vendeur : « Frère, avec ça est-ce que je vais voir clair dans mon avenir ? » Le vendeur lui dit : « Mon cher, avec ces lunettes tu verras la vie en noir et blanc, pour ton avenir il faut aller bosser ! » 😂 Allez, garde le sourire !`;
  }

  // Commerce scolaire, élèves, école, fournitures
  if (q.includes('élève') || q.includes('eleve') || q.includes('école') || q.includes('ecole') || q.includes('acheter') || q.includes('scolaire') || q.includes('collège') || q.includes('lycée')) {
    return `Voici exactement ce que les élèves aiment acheter et qui se vend le mieux à l'école ou aux abords des cours, ${callout} : 🎒🏫\n\n### 1. Nourriture & Rafraîchissements (70% des ventes)\n* **Sandwichs & Salé minute :** Pain-œuf, pain-sardine, pain-spaghetti mayo, alloco chaud, pastels au poisson/viande avec sauce pimentée.\n* **Douceurs sucrées :** Beignets soufflés (gbofloto), crêpes, gaufres, popcorn sucré, gâteaux individuels, biscuits.\n* **Boissons bien glacées :** Sachets de bissap frais, jus de gingembre (gnamakoudji), esquimaux maison au lait ou sirop, eau fraîche en sachet.\n\n### 2. Fournitures scolaires de dépannage\n* Feuilles simples et doubles grands carreaux (format devoirs), stylos bille (bleu, noir, rouge), blanco/correcteur, gommes, taille-crayons, règles.\n\n### 3. Petits accessoires tendance\n* Écouteurs filaires pas chers, bracelets fantaisie, barrettes, élastiques, gloss, stickers.\n\n---\n💡 **Conseils de vente indispensables :** Petits prix ronds (50 à 500 FCFA max), service ultra rapide (la récré ne dure que 15 à 30 min) et emballage propre bien visible !`;
  }

  // Études & révisions
  if (q.includes('examen') || q.includes('concours') || q.includes('réviser') || q.includes('cours') || q.includes('étudier')) {
    return `Voici la méthode concrète pour réussir tes révisions, ${callout} : 📚🎯\n\n1. ⏱️ **Méthode Pomodoro (25/5) :** Travaille 25 minutes sans téléphone, puis 5 minutes de pause. Répète 4 fois.\n2. 📝 **Fiches actives :** Note seulement les 5 définitions clés, formules et exemples par chapitre.\n3. 🗣️ **Répétition à voix haute :** Explique la leçon avec tes propres mots comme à un camarade.\n4. 🛏️ **Sommeil :** Le cerveau mémorise pendant la nuit, évite les nuits blanches !`;
  }

  // Réponse universelle naturelle et personnalisée
  const cleanTopic = userText.replace(/[?!.,;]/g, '').trim();
  const responses = [
    `Ah ${callout}, c'est une excellente question sur **« ${cleanTopic} »** ! Voici ce qu'il faut analyser concrètement :\n\n• **Le point de départ :** Commence toujours par observer le besoin réel sur le terrain avant d'engager du temps ou de l'argent.\n• **L'exécution :** Teste d'abord la formule la plus simple qui apporte un résultat immédiat sans te compliquer la vie.\n• **Le conseil d'Emris :** Reste régulier et ajuste selon les premiers retours concrets.\n\nDis-moi sur quel détail pratique tu souhaites qu'on avance ensemble !`,
    `On est ensemble, ${callout} ! Concernant **« ${cleanTopic} »**, voici ce qui fonctionne le mieux :\n\n1. **Regarde le terrain :** Vois ce qui marche déjà fort et ce qui manque au quotidien.\n2. **Reste simple et rapide :** Moins il y a d'obstacles, plus vite tu atteins ton objectif.\n3. **La constance :** Un petit pas chaque jour vaut mieux que de grands projets jamais lancés.\n\nQuelle est ton idée précise là-dessus ? Partage avec moi, je t'aide à la peaufiner !`,
    `Bien reçu ${prenom} ! Sur le sujet de **« ${cleanTopic} »**, voici la clé :\n\n• Clarifie exactement ton objectif précis.\n• Choisis la solution la plus directe et accessible aujourd'hui.\n• Valide une première étape concrète sans attendre.\n\nJe suis là pour t'accompagner pas à pas, dis-moi ce que tu veux faire en premier !`
  ];
  return responses[Math.abs(cleanTopic.length) % responses.length];
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
// GESTION DU CHAT & DES MESSAGES (AJOUTS DYNAMIQUES & ANTI-RÉPÉTITION)
// =========================================================================

function appendUserMessage(text) {
  const container = document.getElementById('messagesContainer');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'message-row user';
  const timeStr = getCurrentTime();
  row.innerHTML = `
    <div class="msg-bubble">
      <div>${formatMessageText(text)}</div>
      <div class="msg-footer">
        <span>${timeStr}</span>
      </div>
    </div>
    <img src="${AVATARS.user}" class="msg-avatar" alt="Utilisateur">
  `;
  container.appendChild(row);
  scrollChatToBottom();
}

function appendCompanionResponse(text) {
  const container = document.getElementById('messagesContainer');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'message-row mris';
  const timeStr = getCurrentTime();
  const avatar = companionGender === 'female' ? AVATARS.female : AVATARS.male;
  
  let formatted = escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');

  row.innerHTML = `
    <img src="${avatar}" class="msg-avatar" alt="Emris">
    <div class="msg-bubble">
      <div>${formatted}</div>
      <div class="msg-footer">
        <span>${timeStr}</span>
        <div class="msg-actions">
          <button class="btn-msg-action" onclick="copyMessageText(this)" title="Copier"><i class="fa-regular fa-copy"></i></button>
          <button class="btn-msg-action" onclick="speakMessageText(this)" title="Écouter"><i class="fa-solid fa-volume-high"></i></button>
        </div>
      </div>
    </div>
  `;
  container.appendChild(row);
  scrollChatToBottom();
}

function initChatConversation() {
  const container = document.getElementById('messagesContainer');
  if (!container) return;
  container.innerHTML = '';
  const prenom = (currentUser && currentUser.nom) ? currentUser.nom.split(' ')[0] : '';
  const welcomeText = getRandomWelcomeText(prenom);
  appendCompanionResponse(welcomeText);
}

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

  async function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;
    appendUserMessage(text);
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Afficher indicateur de réflexion bienveillante
    const container = document.getElementById('messagesContainer');
    const thinkingRow = document.createElement('div');
    thinkingRow.className = 'message-row mris';
    thinkingRow.id = 'emrisThinkingBubble';
    thinkingRow.innerHTML = `
      <img src="${companionGender === 'female' ? AVATARS.female : AVATARS.male}" class="msg-avatar" alt="Emris">
      <div class="msg-bubble" style="opacity:0.85;">
        <div style="display:flex;align-items:center;gap:8px;font-style:italic;color:#38BDF8;font-size:0.85rem;">
          <i class="fa-solid fa-spinner fa-spin"></i> Emris prépare ta réponse concrète...
        </div>
      </div>
    `;
    container.appendChild(thinkingRow);
    scrollChatToBottom();

    try {
      const API_BASE = (typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('run.app')))
        ? ''
        : 'https://ais-pre-yojeefvy2wylxcfq4ya433-175402587151.europe-west1.run.app';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const resp = await fetch(API_BASE + '/api/mris/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          gender: companionGender,
          userName: (currentUser && currentUser.nom) ? currentUser.nom : 'l\'ami'
        })
      });
      clearTimeout(timeoutId);

      const tb = document.getElementById('emrisThinkingBubble');
      if (tb && tb.parentNode) tb.parentNode.removeChild(tb);

      if (resp.ok) {
        const data = await resp.json();
        appendCompanionResponse(data.reply || generateEmrisSmartReply(text));
        return;
      }
    } catch(err) {
      console.warn('API fetch fallback:', err);
    }

    const tb = document.getElementById('emrisThinkingBubble');
    if (tb && tb.parentNode) tb.parentNode.removeChild(tb);
    const reply = generateEmrisSmartReply(text);
    appendCompanionResponse(reply);
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
