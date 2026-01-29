'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { firebaseApp } from '../../lib/firebase';
import toast from 'react-hot-toast';

export default function PhoneAuth() {
  const { verifyPhoneCode } = useAuth();
  const router = useRouter();
  const recaptchaVerifierRef = useRef(null);
  const recaptchaWidgetIdRef = useRef(null);

  const [countryCode, setCountryCode] = useState('+965');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  // Initialize reCAPTCHA on mount
  useEffect(() => {
    const auth = getAuth(firebaseApp);

    // Small delay to ensure the DOM element exists
    const timer = setTimeout(() => {
      try {
        if (recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current.clear();
        }

        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'normal',
          callback: () => {
            console.log('reCAPTCHA verified');
            setRecaptchaReady(true);
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            setRecaptchaReady(false);
          }
        });

        recaptchaVerifierRef.current = verifier;

        verifier.render().then((widgetId) => {
          recaptchaWidgetIdRef.current = widgetId;
        });
      } catch (error) {
        console.error('Error setting up reCAPTCHA:', error);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          // Already cleared
        }
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 7) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (!recaptchaVerifierRef.current) {
      toast.error('reCAPTCHA not ready. Please refresh the page.');
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth(firebaseApp);
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifierRef.current);

      setConfirmationResult(result);
      setCodeSent(true);
      toast.success('Verification code sent!');
    } catch (error) {
      console.error('Send code error:', error);

      let errorMessage = 'Failed to send code. Please try again.';
      switch (error.code) {
        case 'auth/invalid-phone-number':
          errorMessage = 'Invalid phone number. Use format: +1234567890';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        case 'auth/quota-exceeded':
          errorMessage = 'SMS quota exceeded. Try again later.';
          break;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(verificationCode);
      if (result.user) {
        toast.success('Phone verified successfully!');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Verify code error:', error);

      let errorMessage = 'Invalid code. Please try again.';
      if (error.code === 'auth/code-expired') {
        errorMessage = 'Code expired. Please request a new one.';
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    setCodeSent(false);
    setVerificationCode('');
    setConfirmationResult(null);
    setRecaptchaReady(false);

    // Reset reCAPTCHA for new attempt
    if (window.grecaptcha && recaptchaWidgetIdRef.current !== null) {
      window.grecaptcha.reset(recaptchaWidgetIdRef.current);
    }
  };

  const countryCodes = [
    { code: '+965', name: 'Kuwait', flag: '🇰🇼' },
    { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+971', name: 'UAE', flag: '🇦🇪' },
    { code: '+973', name: 'Bahrain', flag: '🇧🇭' },
    { code: '+974', name: 'Qatar', flag: '🇶🇦' },
    { code: '+968', name: 'Oman', flag: '🇴🇲' },
    { code: '+20', name: 'Egypt', flag: '🇪🇬' },
    { code: '+962', name: 'Jordan', flag: '🇯🇴' },
    { code: '+961', name: 'Lebanon', flag: '🇱🇧' },
    { code: '+1', name: 'USA/Canada', flag: '🇺🇸' },
    { code: '+44', name: 'UK', flag: '🇬🇧' },
  ];

  return (
    <div className="space-y-4">
      {!codeSent ? (
        <>
          {/* Phone Number Input */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2">
              Phone Number
            </label>
            <div className="flex gap-2">
              {/* Country Code Selector */}
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                disabled={loading}
                className="px-3 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 disabled:opacity-50"
              >
                {countryCodes.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </select>

              {/* Phone Number Input */}
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="12345678"
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 disabled:opacity-50"
                onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter your phone number without the country code
            </p>
          </div>

          {/* reCAPTCHA Widget */}
          <div className="flex justify-center my-3">
            <div id="recaptcha-container"></div>
          </div>

          {/* Send Code Button */}
          <button
            onClick={handleSendCode}
            disabled={loading || !phoneNumber || !recaptchaReady}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending...</span>
              </div>
            ) : (
              'Send Verification Code'
            )}
          </button>
        </>
      ) : (
        <>
          {/* Verification Code Input */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md text-center text-2xl tracking-widest focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 disabled:opacity-50"
              onKeyDown={(e) => e.key === 'Enter' && verificationCode.length === 6 && handleVerifyCode()}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter the 6-digit code sent to {countryCode} {phoneNumber}
            </p>
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerifyCode}
            disabled={loading || verificationCode.length !== 6}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying...</span>
              </div>
            ) : (
              'Verify Code'
            )}
          </button>

          {/* Resend Code Button */}
          <button
            onClick={handleResendCode}
            disabled={loading}
            className="w-full text-blue-600 dark:text-blue-400 py-2 text-sm hover:underline disabled:opacity-50"
          >
            Resend Code
          </button>
        </>
      )}

    </div>
  );
}
