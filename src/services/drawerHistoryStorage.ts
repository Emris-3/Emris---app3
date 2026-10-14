import { DrawerChatMessage, DrawerConversationSession } from '../types/assistantChat';

const STORAGE_KEY_CONVERSATIONS = 'mris_drawer_conversations_v1';
const STORAGE_KEY_ACTIVE_ID = 'mris_drawer_active_conv_id';

const isClient = typeof window !== 'undefined';

/**
 * Retrieves all stored conversation sessions from localStorage, sorted by newest first.
 */
export function getSavedConversations(): DrawerConversationSession[] {
  if (!isClient) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (err) {
    console.error('Failed to load saved drawer conversations from localStorage', err);
    return [];
  }
}

/**
 * Saves or updates a conversation session in localStorage.
 */
export function saveConversationSession(session: DrawerConversationSession): void {
  if (!isClient) return;
  try {
    const existing = getSavedConversations();
    const index = existing.findIndex(c => c.id === session.id);
    
    // Generate a good preview from last message or user query
    const lastMsg = session.messages[session.messages.length - 1];
    const preview = lastMsg ? (lastMsg.text.length > 80 ? lastMsg.text.slice(0, 80) + '...' : lastMsg.text) : 'Discussion sans message';

    const updatedSession: DrawerConversationSession = {
      ...session,
      preview,
      messageCount: session.messages.length,
      updatedAt: new Date().toISOString()
    };

    let updatedList: DrawerConversationSession[];
    if (index >= 0) {
      updatedList = [...existing];
      updatedList[index] = updatedSession;
    } else {
      updatedList = [updatedSession, ...existing];
    }

    localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(updatedList));
  } catch (err) {
    console.error('Failed to save drawer conversation to localStorage', err);
  }
}

/**
 * Deletes a single conversation by ID.
 */
export function deleteConversationSession(id: string): void {
  if (!isClient) return;
  try {
    const existing = getSavedConversations();
    const filtered = existing.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(filtered));

    const activeId = getActiveConversationId();
    if (activeId === id) {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
    }
  } catch (err) {
    console.error('Failed to delete drawer conversation', err);
  }
}

/**
 * Clears all conversation history from localStorage.
 */
export function clearAllConversations(): void {
  if (!isClient) return;
  try {
    localStorage.removeItem(STORAGE_KEY_CONVERSATIONS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
  } catch (err) {
    console.error('Failed to clear drawer conversations', err);
  }
}

/**
 * Gets the ID of the currently active session.
 */
export function getActiveConversationId(): string | null {
  if (!isClient) return null;
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
  } catch {
    return null;
  }
}

/**
 * Sets the ID of the active conversation session.
 */
export function setActiveConversationId(id: string): void {
  if (!isClient) return;
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
  } catch (err) {
    console.error('Failed to set active conversation ID', err);
  }
}

/**
 * Creates a new conversation session object.
 */
export function createNewSession(initialMessages: DrawerChatMessage[] = [], title?: string): DrawerConversationSession {
  const now = new Date().toISOString();
  const id = 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const sessionTitle = title || 'Nouvel échange avec Emris';
  const preview = initialMessages.length > 0 
    ? initialMessages[initialMessages.length - 1].text.slice(0, 80) 
    : 'Début de discussion...';

  const newSession: DrawerConversationSession = {
    id,
    title: sessionTitle,
    preview,
    createdAt: now,
    updatedAt: now,
    messages: initialMessages,
    messageCount: initialMessages.length
  };

  saveConversationSession(newSession);
  setActiveConversationId(id);
  return newSession;
}

/**
 * Formats an ISO date into a user-friendly French format (e.g., "Aujourd'hui à 14:32", "Hier à 10:15", "8 oct. 2026 à 09:20").
 */
export function formatConversationDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return `Aujourd'hui à ${timeStr}`;
    }
    if (isYesterday) {
      return `Hier à ${timeStr}`;
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Récemment';
  }
}
