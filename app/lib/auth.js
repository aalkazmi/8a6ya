import {
  getAuth,
  signInWithPhoneNumber,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as firebaseSignOut,
  RecaptchaVerifier,
  onAuthStateChanged
} from 'firebase/auth';

// Get auth instance (will be initialized from firebase.js)
let auth = null;

// Initialize auth instance
export const initAuth = (firebaseApp) => {
  auth = getAuth(firebaseApp);
  return auth;
};

// Get current auth instance
export const getAuthInstance = () => {
  if (!auth) {
    throw new Error('Auth not initialized. Call initAuth first.');
  }
  return auth;
};

/**
 * Setup reCAPTCHA verifier for phone authentication
 * @param {string} containerId - The ID of the container element for reCAPTCHA
 * @returns {RecaptchaVerifier} The reCAPTCHA verifier instance
 */
export const setupRecaptcha = (containerId = 'recaptcha-container') => {
  try {
    const auth = getAuthInstance();
    const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: (response) => {
        // reCAPTCHA solved - will proceed with phone auth
        console.log('reCAPTCHA verified');
      },
      'expired-callback': () => {
        console.error('reCAPTCHA expired. Please try again.');
      }
    });
    return recaptchaVerifier;
  } catch (error) {
    console.error('Error setting up reCAPTCHA:', error);
    throw new Error('Failed to setup reCAPTCHA. Please refresh and try again.');
  }
};

/**
 * Sign in with phone number - sends SMS verification code
 * @param {string} phoneNumber - Phone number in E.164 format (e.g., +1234567890)
 * @param {RecaptchaVerifier} recaptchaVerifier - The reCAPTCHA verifier instance
 * @returns {Promise<{success: boolean, confirmationResult?: any, error?: string}>}
 */
export const signInWithPhone = async (phoneNumber, recaptchaVerifier) => {
  try {
    const auth = getAuthInstance();

    // Validate phone number format
    if (!phoneNumber || !phoneNumber.startsWith('+')) {
      return {
        success: false,
        error: 'Please enter a valid phone number with country code (e.g., +1234567890)'
      };
    }

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );

    console.log('SMS sent successfully');

    return {
      success: true,
      confirmationResult
    };
  } catch (error) {
    console.error('Error signing in with phone:', error);

    // Handle specific error codes
    let errorMessage = 'Failed to send verification code. Please try again.';

    switch (error.code) {
      case 'auth/invalid-phone-number':
        errorMessage = 'Invalid phone number format. Please use format: +1234567890';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many requests. Please try again later.';
        break;
      case 'auth/quota-exceeded':
        errorMessage = 'SMS quota exceeded. Please try again later.';
        break;
      case 'auth/captcha-check-failed':
        errorMessage = 'reCAPTCHA verification failed. Please refresh and try again.';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Verify phone verification code
 * @param {any} confirmationResult - The confirmation result from signInWithPhone
 * @param {string} code - The 6-digit verification code from SMS
 * @returns {Promise<{success: boolean, user?: any, error?: string}>}
 */
export const verifyPhoneCode = async (confirmationResult, code) => {
  try {
    if (!confirmationResult) {
      return {
        success: false,
        error: 'No confirmation result. Please request a new code.'
      };
    }

    // Validate code format
    if (!code || code.length !== 6) {
      return {
        success: false,
        error: 'Please enter a valid 6-digit verification code'
      };
    }

    const result = await confirmationResult.confirm(code);
    const user = result.user;

    console.log('Phone verification successful');

    return {
      success: true,
      user: {
        uid: user.uid,
        phoneNumber: user.phoneNumber,
        displayName: user.displayName,
        email: user.email
      }
    };
  } catch (error) {
    console.error('Error verifying code:', error);

    let errorMessage = 'Invalid verification code. Please try again.';

    switch (error.code) {
      case 'auth/invalid-verification-code':
        errorMessage = 'Invalid verification code. Please check and try again.';
        break;
      case 'auth/code-expired':
        errorMessage = 'Verification code expired. Please request a new code.';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Sign in with Google using popup
 * @returns {Promise<{success: boolean, user?: any, error?: string}>}
 */
export const signInWithGoogle = async () => {
  try {
    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();

    // Add custom parameters
    provider.addScope('profile');
    provider.addScope('email');

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    console.log('Google sign-in successful');

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber
      }
    };
  } catch (error) {
    console.error('Error signing in with Google:', error);

    let errorMessage = 'Failed to sign in with Google. Please try again.';

    switch (error.code) {
      case 'auth/popup-closed-by-user':
        errorMessage = 'Sign-in cancelled. Please try again.';
        break;
      case 'auth/popup-blocked':
        errorMessage = 'Popup blocked. Please allow popups and try again.';
        break;
      case 'auth/account-exists-with-different-credential':
        errorMessage = 'An account already exists with the same email. Please use a different sign-in method.';
        break;
      case 'auth/cancelled-popup-request':
        errorMessage = 'Sign-in cancelled. Please try again.';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Sign in with Apple using popup
 * @returns {Promise<{success: boolean, user?: any, error?: string}>}
 */
export const signInWithApple = async () => {
  try {
    const auth = getAuthInstance();
    const provider = new OAuthProvider('apple.com');

    // Add custom scopes
    provider.addScope('email');
    provider.addScope('name');

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    console.log('Apple sign-in successful');

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber
      }
    };
  } catch (error) {
    console.error('Error signing in with Apple:', error);

    let errorMessage = 'Failed to sign in with Apple. Please try again.';

    switch (error.code) {
      case 'auth/popup-closed-by-user':
        errorMessage = 'Sign-in cancelled. Please try again.';
        break;
      case 'auth/popup-blocked':
        errorMessage = 'Popup blocked. Please allow popups and try again.';
        break;
      case 'auth/account-exists-with-different-credential':
        errorMessage = 'An account already exists with the same email. Please use a different sign-in method.';
        break;
      case 'auth/cancelled-popup-request':
        errorMessage = 'Sign-in cancelled. Please try again.';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Sign out the current user
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const signOut = async () => {
  try {
    const auth = getAuthInstance();
    await firebaseSignOut(auth);

    console.log('Sign-out successful');

    return {
      success: true
    };
  } catch (error) {
    console.error('Error signing out:', error);

    return {
      success: false,
      error: 'Failed to sign out. Please try again.'
    };
  }
};

/**
 * Get the current authenticated user
 * @returns {any | null} The current user or null if not authenticated
 */
export const getCurrentUser = () => {
  try {
    const auth = getAuthInstance();
    return auth.currentUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Listen to authentication state changes
 * @param {function} callback - Callback function that receives the user object
 * @returns {function} Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  try {
    const auth = getAuthInstance();
    return onAuthStateChanged(auth, callback);
  } catch (error) {
    console.error('Error setting up auth state listener:', error);
    return () => {}; // Return empty unsubscribe function
  }
};
