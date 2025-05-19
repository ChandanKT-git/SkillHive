import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  auth,
  signIn as firebaseSignIn,
  signUp as firebaseSignUp,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordReset,
  onAuthStateChanged,
  getUserProfile,
  signInWithGoogle as firebaseSignInWithGoogle
} from '../lib/firebase';

const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  signIn: () => {},
  signUp: () => {},
  signOut: () => {},
  sendPasswordResetEmail: () => {},
  signInWithGoogle: () => {}
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

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

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const firebaseUser = await firebaseSignInWithGoogle();
      
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

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    sendPasswordResetEmail,
    signInWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};