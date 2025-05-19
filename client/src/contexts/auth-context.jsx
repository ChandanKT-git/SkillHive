import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  auth,
  signIn as firebaseSignIn,
  signUp as firebaseSignUp,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordReset,
  onAuthStateChanged,
  getUserProfile
} from '../lib/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get additional user data from Firestore
          const userProfile = await getUserProfile(firebaseUser.uid);
          setUser({
            ...firebaseUser,
            ...userProfile
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email, password, rememberMe = false) => {
    setError(null);
    try {
      const firebaseUser = await firebaseSignIn(email, password, rememberMe);
      
      // Get additional user data from Firestore
      const userProfile = await getUserProfile(firebaseUser.uid);
      setUser({
        ...firebaseUser,
        ...userProfile
      });
      
      return firebaseUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signUp = async (email, password, userData) => {
    setError(null);
    try {
      const firebaseUser = await firebaseSignUp(email, password, userData);
      
      // User data is created in Firestore during signup
      setUser({
        ...firebaseUser,
        ...userData
      });
      
      return firebaseUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await firebaseSignOut();
      setUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const sendPasswordResetEmail = async (email) => {
    setError(null);
    try {
      await firebaseSendPasswordReset(email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    sendPasswordResetEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
