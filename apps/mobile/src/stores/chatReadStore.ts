import { create } from 'zustand';

interface ChatReadStore {
  // Groups the user has opened (optimistically marked as read) since last server fetch
  readGroups: Set<string>;
  markGroupRead: (groupId: string) => void;
  clearReadGroups: () => void;
}

export const useChatReadStore = create<ChatReadStore>((set) => ({
  readGroups: new Set(),
  markGroupRead: (groupId) =>
    set((state) => {
      const next = new Set(state.readGroups);
      next.add(groupId);
      return { readGroups: next };
    }),
  clearReadGroups: () => set({ readGroups: new Set() }),
}));
