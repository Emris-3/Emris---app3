export interface DrawerChatMessage {
  id: string;
  sender: 'mris' | 'user';
  text: string;
  time: string;
  action?: {
    label: string;
    type?: 'whatsapp' | 'custom';
  };
  reflection?: string;
  researchSources?: string[];
  isResearched?: boolean;
}

export interface DrawerConversationSession {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
  messages: DrawerChatMessage[];
  messageCount: number;
}
