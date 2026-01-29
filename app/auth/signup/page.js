'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import SocialAuth from '../components/SocialAuth';
import PhoneAuth from '../components/PhoneAuth';

export default function SignupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <Toaster position="top-center" />

      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-gray-900 dark:text-gray-100 mb-2">
            Join 8a6ya
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create an account to sync your expenses across devices
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Social Auth Buttons */}
          <SocialAuth />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Or sign up with phone
              </span>
            </div>
          </div>

          {/* Phone Auth */}
          <PhoneAuth />

          {/* Guest Mode Button */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/dashboard"
              className="block w-full text-center px-4 py-3 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
            >
              Continue as Guest
            </Link>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              Try the app without creating an account
            </p>
          </div>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Benefits */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
          <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-2">
            Why create an account?
          </p>
          <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-400">
            <li>• Sync expenses across all your devices</li>
            <li>• Never lose your data</li>
            <li>• Collaborate with friends in real-time</li>
            <li>• Access your groups from anywhere</li>
          </ul>
        </div>

        {/* Footer */}
        <p className="mt-8 text-xs text-gray-400 dark:text-gray-500 text-center">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
