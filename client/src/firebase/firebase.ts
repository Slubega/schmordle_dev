import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import firebaseConfig from './firebaseConfig'; 
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Authentication instance
export const auth = getAuth(app);

// Export the app instance if needed elsewhere
export default app; 
