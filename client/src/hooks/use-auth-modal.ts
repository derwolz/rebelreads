import { create } from 'zustand';

interface AuthModalStore {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const useAuthModal = create<AuthModalStore>((set) => ({
  isOpen: false,
  setIsOpen: (open) => set({ isOpen: open }),
}));
