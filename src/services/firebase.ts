import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

// Vite environment variables check
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: any;
let auth: any;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('Firebase client SDK initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Firebase Client SDK:', error);
  }
} else {
  console.log('Firebase credentials not set in Vite env. Running in MOCK AUTHENTICATION MODE.');
}

// User object type definitions
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

// Global Auth wrapper API that resolves to real Firebase or local mock state
export const authService = {
  isRealFirebase: () => isRealFirebaseConfigured(),

  async signUp(email: string, password: string) {
    if (isFirebaseConfigured && auth) {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || email.split('@')[0]
      };
    } else {
      // Mock signup
      const mockUser = { uid: 'guest_user_123', email, displayName: email.split('@')[0] };
      localStorage.setItem('lifesaver_mock_user', JSON.stringify(mockUser));
      localStorage.setItem('lifesaver_token', 'guest-token');
      triggerMockAuthListeners(mockUser);
      return mockUser;
    }
  },

  async signIn(email: string, password: string) {
    if (isFirebaseConfigured && auth) {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      localStorage.setItem('lifesaver_token', token);
      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || email.split('@')[0]
      };
    } else {
      // Mock signin
      const mockUser = { uid: 'guest_user_123', email, displayName: email.split('@')[0] };
      localStorage.setItem('lifesaver_mock_user', JSON.stringify(mockUser));
      localStorage.setItem('lifesaver_token', 'guest-token');
      triggerMockAuthListeners(mockUser);
      return mockUser;
    }
  },

  async signInWithGoogle() {
    if (isFirebaseConfigured && auth) {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const token = await userCredential.user.getIdToken();
      localStorage.setItem('lifesaver_token', token);
      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || '',
        photoURL: userCredential.user.photoURL || ''
      };
    } else {
      // Mock Google signin
      const mockUser = { uid: 'guest_user_123', email: 'guest@soum.ai', displayName: 'Hackathon Guest' };
      localStorage.setItem('lifesaver_mock_user', JSON.stringify(mockUser));
      localStorage.setItem('lifesaver_token', 'guest-token');
      triggerMockAuthListeners(mockUser);
      return mockUser;
    }
  },

  async logout() {
    localStorage.removeItem('lifesaver_mock_user');
    localStorage.removeItem('lifesaver_token');
    
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    } else {
      triggerMockAuthListeners(null);
    }
  },

  getToken() {
    return localStorage.getItem('lifesaver_token') || 'guest-token';
  },

  getCurrentUser(): UserProfile | null {
    if (isFirebaseConfigured && auth) {
      const u = auth.currentUser;
      if (!u) return null;
      return {
        uid: u.uid,
        email: u.email || '',
        displayName: u.displayName || '',
        photoURL: u.photoURL || ''
      };
    } else {
      const mockUserStr = localStorage.getItem('lifesaver_mock_user');
      return mockUserStr ? JSON.parse(mockUserStr) : null;
    }
  },

  // Monitor auth changes
  subscribe(callback: (user: UserProfile | null) => void) {
    if (isFirebaseConfigured && auth) {
      return onAuthStateChanged(auth, async (user) => {
        if (user) {
          const token = await user.getIdToken();
          localStorage.setItem('lifesaver_token', token);
          callback({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || ''
          });
        } else {
          localStorage.removeItem('lifesaver_token');
          callback(null);
        }
      });
    } else {
      mockAuthListeners.push(callback);
      // Run initial check
      const current = this.getCurrentUser();
      callback(current);
      // Return unsubscribe function
      return () => {
        const index = mockAuthListeners.indexOf(callback);
        if (index > -1) mockAuthListeners.splice(index, 1);
      };
    }
  }
};

function isRealFirebaseConfigured() {
  return isFirebaseConfigured;
}

// Local mock auth listener array
const mockAuthListeners: Array<(user: UserProfile | null) => void> = [];

function triggerMockAuthListeners(user: UserProfile | null) {
  mockAuthListeners.forEach(listener => {
    try {
      listener(user);
    } catch (e) {
      console.error('Error triggering auth listener:', e);
    }
  });
}
