'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { firebaseApp } from '../lib/firebase';
import {
  initAuth,
  onAuthStateChange,
  signInWithPhone as authSignInWithPhone,
  verifyPhoneCode as authVerifyPhoneCode,
  signInWithGoogle as authSignInWithGoogle,
  signInWithApple as authSignInWithApple,
  signOut as authSignOut,
  getCurrentUser,
  setupRecaptcha
} from '../lib/auth';

// Create the AuthContext
const AuthContext = createContext({
  user: null,
  userProfile: null,
  loading: true,
  error: null,
  signInWithPhone: async () => {},
  verifyPhoneCode: async () => {},
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signOut: async () => {},
  setupRecaptcha: () => {}
});

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * AuthProvider component - wraps the app to provide authentication state
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [db, setDb] = useState(null);

  // Initialize Firebase Auth and Firestore
  useEffect(() => {
    try {
      // Initialize auth
      initAuth(firebaseApp);

      // Initialize Firestore
      const firestore = getFirestore(firebaseApp);
      setDb(firestore);

      console.log('Auth initialized successfully');
    } catch (err) {
      console.error('Error initializing auth:', err);
      setError('Failed to initialize authentication');
    }
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    let unsubscribe = () => {};

    try {
      unsubscribe = onAuthStateChange(async (firebaseUser) => {
        setLoading(true);
        setError(null);

        if (firebaseUser) {
          // User is signed in
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            phoneNumber: firebaseUser.phoneNumber,
            emailVerified: firebaseUser.emailVerified
          };

          setUser(userData);

          // Fetch user profile from Firestore
          if (db) {
            try {
              const userDocRef = doc(db, 'users', firebaseUser.uid);
              const userDoc = await getDoc(userDocRef);

              if (userDoc.exists()) {
                setUserProfile(userDoc.data());
              } else {
                // Create initial user profile if it doesn't exist
                const initialProfile = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName,
                  photoURL: firebaseUser.photoURL,
                  phoneNumber: firebaseUser.phoneNumber,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };

                await setDoc(userDocRef, initialProfile);
                setUserProfile(initialProfile);
              }
            } catch (err) {
              console.error('Error fetching user profile:', err);
              setError('Failed to load user profile');
            }
          }
        } else {
          // User is signed out
          setUser(null);
          setUserProfile(null);
        }

        setLoading(false);
      });
    } catch (err) {
      console.error('Error setting up auth listener:', err);
      setError('Failed to setup authentication listener');
      setLoading(false);
    }

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [db]);

  // Wrapper functions for auth methods with error handling
  const handleSignInWithPhone = async (phoneNumber, recaptchaVerifier) => {
    try {
      setError(null);
      const result = await authSignInWithPhone(phoneNumber, recaptchaVerifier);

      if (!result.success) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      console.error('Error in handleSignInWithPhone:', err);
      const errorMsg = 'An unexpected error occurred. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const handleVerifyPhoneCode = async (confirmationResult, code) => {
    try {
      setError(null);
      const result = await authVerifyPhoneCode(confirmationResult, code);

      if (!result.success) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      console.error('Error in handleVerifyPhoneCode:', err);
      const errorMsg = 'An unexpected error occurred. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      setError(null);
      const result = await authSignInWithGoogle();

      if (!result.success) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      console.error('Error in handleSignInWithGoogle:', err);
      const errorMsg = 'An unexpected error occurred. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const handleSignInWithApple = async () => {
    try {
      setError(null);
      const result = await authSignInWithApple();

      if (!result.success) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      console.error('Error in handleSignInWithApple:', err);
      const errorMsg = 'An unexpected error occurred. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      const result = await authSignOut();

      if (!result.success) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      console.error('Error in handleSignOut:', err);
      const errorMsg = 'An unexpected error occurred. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    error,
    signInWithPhone: handleSignInWithPhone,
    verifyPhoneCode: handleVerifyPhoneCode,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithApple: handleSignInWithApple,
    signOut: handleSignOut,
    setupRecaptcha,
    getCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
