import { create } from 'zustand';

// Simulated current user for the demo
const MOCK_CURRENT_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  username: 'citizen_john',
  city: 'Chennai',
  points: 150
};

export const useStore = create((set) => ({
  user: MOCK_CURRENT_USER,
  location: null,
  setLocation: (lat, lng) => set({ location: { lat, lng } }),
  clearLocation: () => set({ location: null })
}));
