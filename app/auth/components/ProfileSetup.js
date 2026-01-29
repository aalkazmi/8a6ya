'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { firebaseApp } from '../../lib/firebase';
import toast from 'react-hot-toast';

export default function ProfileSetup() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user?.displayName || '');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
    { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'BHD', symbol: 'د.ب', name: 'Bahraini Dinar' },
    { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal' },
    { code: 'OMR', symbol: 'ر.ع', name: 'Omani Rial' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'EGP', symbol: 'ج.م', name: 'Egyptian Pound' },
    { code: 'JOD', symbol: 'د.ا', name: 'Jordanian Dinar' },
    { code: 'LBP', symbol: 'ل.ل', name: 'Lebanese Pound' },
  ];

  const handleCompleteSetup = async () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const db = getFirestore(firebaseApp);
      const userDocRef = doc(db, 'users', user.uid);

      const profileData = {
        uid: user.uid,
        displayName: name.trim(),
        email: user.email,
        phoneNumber: user.phoneNumber,
        photoURL: user.photoURL,
        currency,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        setupCompleted: true,
      };

      await setDoc(userDocRef, profileData, { merge: true });

      toast.success('Profile setup complete!');
      router.push('/');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100 mb-2">
        Complete Your Profile
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Help us personalize your experience
      </p>

      <div className="space-y-4">
        {/* Name Input */}
        <div>
          <label className="block text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 disabled:opacity-50"
            onKeyDown={(e) => e.key === 'Enter' && handleCompleteSetup()}
          />
        </div>

        {/* Currency Dropdown */}
        <div>
          <label className="block text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2">
            Preferred Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 disabled:opacity-50"
          >
            {currencies.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.symbol} {curr.code} - {curr.name}
              </option>
            ))}
          </select>
        </div>

        {/* Complete Setup Button */}
        <button
          onClick={handleCompleteSetup}
          disabled={loading || !name.trim()}
          className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium mt-6"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </div>
          ) : (
            'Complete Setup'
          )}
        </button>
      </div>
    </div>
  );
}
