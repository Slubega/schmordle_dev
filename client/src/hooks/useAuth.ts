import { useState, useEffect } from 'react';
import { auth } from '../firebase/firebase';
import { User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';

/**
 * Custom hook for managing Firebase Authentication state.
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // Automatically sign in as a guest if no user is signed in
        signInAnonymously(auth)
          .then((result) => {
            setUser(result.user);
          })
          .catch((error) => {
            console.error("Anonymous sign-in failed:", error);
          });
      }
      setLoading(false);
    });

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, []);

  // Simple way to get a user's display name, prioritizing email if available, otherwise 'Guest'
  const userName = user?.displayName || user?.email || (user?.isAnonymous ? `Guest-${user.uid.substring(0, 4)}` : 'Player');

  return { user, loading, userName, signInAnonymously: () => signInAnonymously(auth) };
};
