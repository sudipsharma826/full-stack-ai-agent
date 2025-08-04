import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUserStore = create(
  persist(
    (set) => ({
      userInfo: null,
      token: null,
      isAuthenticated: false,
      
      setUser: (user, token) => set({ 
        userInfo: user, 
        token, 
        isAuthenticated: true 
      }),
      
      logoutUser: () => set({ 
        userInfo: null, 
        token: null, 
        isAuthenticated: false 
      }),
      
      updateUserInfo: (updates) => set((state) => ({
        userInfo: state.userInfo ? { ...state.userInfo, ...updates } : null
      })),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        userInfo: state.userInfo,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useUserStore;
