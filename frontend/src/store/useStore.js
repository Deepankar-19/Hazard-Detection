import { create } from 'zustand';

// Simulated current user for the demo
const MOCK_CURRENT_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  username: 'citizen_john',
  city: 'Chennai',
  points: 150
};

const MOCK_ADMIN_USER = {
  id: '00000000-0000-0000-0000-000000000099',
  username: 'Admin1',
  city: 'Chennai',
  points: 0
};

export const useStore = create((set) => ({
  user: MOCK_CURRENT_USER,
  role: null, // null = not logged in, 'user' = citizen, 'admin' = authority
  location: null,
  setRole: (role) => set({ 
    role, 
    user: role === 'admin' ? MOCK_ADMIN_USER : MOCK_CURRENT_USER 
  }),
  logout: () => set({ role: null, user: MOCK_CURRENT_USER }),
  setLocation: (lat, lng) => set({ location: { lat, lng } }),
  clearLocation: () => set({ location: null })
}));
