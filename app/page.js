'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { Moon, Sun } from 'lucide-react';
import { db } from './lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export default function HomePage() {
  const router = useRouter();

  const [isDark, setIsDark] = useState(false);
  const [userName, setUserName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [groupCodeInput, setGroupCodeInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  const t = {
    en: {
      appName: '8a6ya',
      tagline: 'Pay your dues easily',
      yourName: 'Your Name',
      enterName: 'Enter your name',
      createGroup: 'Create Group',
      joinGroup: 'Join Group',
      groupCode: 'GROUP CODE',
      join: 'Join',
      back: 'Back',
      autoSync: 'Data saves automatically',
      groupCreated: 'Group created: {{code}}',
    },
    ar: {
      appName: '8a6ya',
      tagline: 'ادفع مستحقاتك بسهولة',
      yourName: 'اسمك',
      enterName: 'أدخل اسمك',
      createGroup: 'إنشاء مجموعة',
      joinGroup: 'الانضمام لمجموعة',
      groupCode: 'رمز المجموعة',
      join: 'انضم',
      back: 'رجوع',
      autoSync: 'الحفظ التلقائي للبيانات',
      groupCreated: 'تم إنشاء المجموعة: {{code}}',
    }
  };

  const getText = (key, params = {}) => {
    let text = t[language][key] || key;
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(`{{${param}}}`, value);
    });
    return text;
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  const createGroup = async () => {
    if (!userName.trim()) {
      setMessage(language === 'en' ? 'Please enter your name' : 'الرجاء إدخال اسمك');
      return;
    }

    try {
      const groupId = Math.random().toString(36).substring(2, 8).toUpperCase();

      await setDoc(doc(db, 'storage', `group-${groupId}-people`), {
        value: [{ id: Date.now().toString(), name: userName.trim() }]
      });
      await setDoc(doc(db, 'storage', `group-${groupId}-expenses`), {
        value: []
      });

      localStorage.setItem('currentGroupId', groupId);
      localStorage.setItem('currentUserName', userName.trim());

      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating group:', error);
      setMessage('Failed to create group');
    }
  };

  const joinGroup = async () => {
    if (!userName.trim()) {
      setMessage(language === 'en' ? 'Please enter your name' : 'الرجاء إدخال اسمك');
      return;
    }
    if (!groupCodeInput.trim()) {
      setMessage(language === 'en' ? 'Please enter a group code' : 'الرجاء إدخال رمز المجموعة');
      return;
    }

    try {
      const groupId = groupCodeInput.trim().toUpperCase();
      const peopleDoc = await getDoc(doc(db, 'storage', `group-${groupId}-people`));

      if (!peopleDoc.exists()) {
        setMessage('Group not found');
        return;
      }

      const existingPeople = peopleDoc.data().value || [];
      const alreadyExists = existingPeople.some(
        (p) => p.name.toLowerCase() === userName.trim().toLowerCase()
      );

      if (!alreadyExists) {
        await updateDoc(doc(db, 'storage', `group-${groupId}-people`), {
          value: arrayUnion({ id: Date.now().toString(), name: userName.trim() })
        });
      }

      localStorage.setItem('currentGroupId', groupId);
      localStorage.setItem('currentUserName', userName.trim());

      router.push('/dashboard');
    } catch (error) {
      console.error('Error joining group:', error);
      setMessage('Failed to join group');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center transition-colors">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 p-8 mb-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-light text-gray-900 dark:text-white mb-2">{getText('appName')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{getText('tagline')}</p>
          
          {message && (
            <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 border-l-2 border-gray-400 dark:border-gray-500">
              {message}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2">
              {language === 'en' ? 'Language' : 'اللغة'}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => changeLanguage('en')}
                className={`flex-1 py-2 text-sm transition ${
                  language === 'en'
                    ? 'bg-gray-900 dark:bg-blue-600 text-white'
                    : 'border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                English
              </button>
              <button
                onClick={() => changeLanguage('ar')}
                className={`flex-1 py-2 text-sm transition ${
                  language === 'ar'
                    ? 'bg-gray-900 dark:bg-blue-600 text-white'
                    : 'border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                العربية
              </button>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2">
              {getText('yourName')}
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder={getText('enterName')}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 transition"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          {!isJoining ? (
            <div className="space-y-3">
              <button
                onClick={createGroup}
                className="w-full bg-gray-900 dark:bg-blue-600 text-white py-3 hover:bg-gray-800 dark:hover:bg-blue-700 transition text-sm tracking-wide"
              >
                {getText('createGroup')}
              </button>
              <button
                onClick={() => setIsJoining(true)}
                className="w-full border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm tracking-wide"
              >
                {getText('joinGroup')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={groupCodeInput}
                onChange={(e) => setGroupCodeInput(e.target.value.toUpperCase())}
                placeholder={getText('groupCode')}
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 uppercase text-center tracking-widest"
              />
              <button
                onClick={joinGroup}
                className="w-full bg-gray-900 dark:bg-blue-600 text-white py-3 hover:bg-gray-800 dark:hover:bg-blue-700 transition text-sm tracking-wide"
              >
                {getText('join')}
              </button>
              <button
                onClick={() => setIsJoining(false)}
                className="w-full text-gray-500 dark:text-gray-400 py-2 hover:text-gray-900 dark:hover:text-white transition text-sm"
              >
                {getText('back')}
              </button>
            </div>
          )}
        </div>
        
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">{getText('autoSync')}</p>
      </div>
    </div>
  );
}
