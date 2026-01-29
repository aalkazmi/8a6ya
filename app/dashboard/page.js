'use client';
import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Users, DollarSign, Share2, Copy, Check, RefreshCw, Moon, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { db } from '../lib/firebase';
import{
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  arrayUnion
} from 'firebase/firestore';
export default function ExpenseSplitter() {
  const router = useRouter();
  const [initializing, setInitializing] = useState(true);
  const [groupId, setGroupId] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [groupIdInput, setGroupIdInput] = useState('');
  const [userName, setUserName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharedPersonId, setSharedPersonId] = useState(null);
  
  const [people, setPeople] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [newPersonName, setNewPersonName] = useState('');
  
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePaidBy, setExpensePaidBy] = useState('');
  const [expenseSplitAmong, setExpenseSplitAmong] = useState([]);
  const [message, setMessage] = useState('');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (typeof window === 'undefined') return;

        const savedGroupId = localStorage.getItem('currentGroupId');
        const languageDoc = await getDoc(doc(db, 'storage', 'language'));
        const savedLanguage = languageDoc.exists() ? languageDoc.data().value : 'en';
        setLanguage(savedLanguage);
        setIsDark(document.documentElement.classList.contains('dark'));

        // Guest user
        const savedUserName = localStorage.getItem('currentUserName');
        if (savedGroupId) setGroupId(savedGroupId);
        if (savedUserName) setUserName(savedUserName);
      } catch (error) {
        console.error('Error loading user data from Firestore:', error);
      } finally {
        setInitializing(false);
      }
    };

    loadUserData();
  }, []);

  // Real-time listeners
  useEffect(() => {
    if (!groupId) return;

    const unsubPeople = onSnapshot(doc(db, 'storage', `group-${groupId}-people`), (doc) => {
      if (doc.exists()) setPeople(doc.data().value || []);
    });

    const unsubExpenses = onSnapshot(doc(db, 'storage', `group-${groupId}-expenses`), (doc) => {
      if (doc.exists()) setExpenses(doc.data().value || []);
    });

    return () => {
      unsubPeople();
      unsubExpenses();
    };
  }, [groupId]);

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

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    if (typeof window !== 'undefined') {
      try {
        await setDoc(doc(db, 'storage', 'language'), { value: lang });
      } catch (error) {
        console.error('Error saving language to Firestore:', error);
      }
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
      loggedInAs: 'Logged in as {{name}}',
      leave: 'Leave',
      people: 'People',
      addPerson: 'Add person',
      add: 'Add',
      addExpense: 'Add Expense',
      description: 'Description',
      amount: 'Amount',
      whoPaid: 'Who paid?',
      splitAmong: 'Split among',
      selected: 'selected',
      expenses: 'Expenses',
      addedBy: 'Added by {{name}}',
      balances: 'Balances',
      left: 'left',
      settlements: 'Settlements',
      pays: 'pays',
      pleaseEnterName: 'Please enter your name',
      pleaseFillFields: 'Please fill all fields',
      groupCreated: 'Group created: {{code}}',
      settleUp: 'Settle up',
      copied: 'Copied!',
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
      loggedInAs: 'مسجل الدخول كـ {{name}}',
      leave: 'مغادرة',
      people: 'الأشخاص',
      addPerson: 'إضافة شخص',
      add: 'إضافة',
      addExpense: 'إضافة مصروف',
      description: 'الوصف',
      amount: 'المبلغ',
      whoPaid: 'من دفع؟',
      splitAmong: 'تقسيم بين',
      selected: 'محدد',
      expenses: 'المصروفات',
      addedBy: 'أضافه {{name}}',
      balances: 'الأرصدة',
      left: 'غادر',
      settlements: 'التسويات',
      pays: 'يدفع لـ',
      pleaseEnterName: 'الرجاء إدخال اسمك',
      pleaseFillFields: 'الرجاء ملء جميع الحقول',
      groupCreated: 'تم إنشاء المجموعة: {{code}}',
      settleUp: 'تصفية الحساب',
      copied: 'تم النسخ!',
    }
  };

  const getText = (key, params = {}) => {
    let text = t[language][key] || key;
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(`{{${param}}}`, value);
    });
    return text;
  };

  const handleShareSettleUp = async (personName, amount, personId) => {
    const message = `www.8a6ya.com Settle Up
Hey ${personName}! 👋

It seems like you have an unsettled balance of $${Math.abs(amount).toFixed(2)} in 8a6ya.

Let's settle up! 💸`;

    try {
      if (navigator.share) {
        await navigator.share({
          text: message
        });
      } else {
        await navigator.clipboard.writeText(message);
        setSharedPersonId(personId);
        setTimeout(() => setSharedPersonId(null), 2000);
      }
    } catch (error) {
      // If share fails, try clipboard
      if (error.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(message);
          setSharedPersonId(personId);
          setTimeout(() => setSharedPersonId(null), 2000);
        } catch (clipboardError) {
          console.error('Error copying to clipboard:', clipboardError);
        }
      }
    }
  };

  const createGroup = async () => {
    if (!userName.trim()) {
      setMessage(getText('pleaseEnterName'));
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    const newGroupId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const initialPerson = { id: Date.now(), name: userName.trim() };
    const initialPeople = [initialPerson];
    
      try {
      setGroupId(newGroupId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentGroupId', newGroupId);
        localStorage.setItem('currentUserName', userName.trim());
        await setDoc(doc(db, 'storage', `group-${newGroupId}-people`), { value: initialPeople });
        await setDoc(doc(db, 'storage', `group-${newGroupId}-expenses`), { value: [] });
      }
      setMessage(getText('groupCreated', { code: newGroupId }));
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Error creating group in Firestore:', error);
      setMessage('Error creating group. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const joinGroup = async () => {
    if (!userName.trim() || !groupIdInput.trim()) {
      setMessage(getText('pleaseFillFields'));
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    const code = groupIdInput.trim().toUpperCase();
    
        if (typeof window !== 'undefined') {
        try {
          const peopleDoc = await getDoc(doc(db, 'storage', `group-${code}-people`));
          
          if (!peopleDoc.exists()) {
            setMessage('Group not found');
            setTimeout(() => setMessage(''), 3000);
            return;
          }

          const existingPeople = peopleDoc.data().value || [];
          const nameExists = existingPeople.some(p => p.name.toLowerCase() === userName.trim().toLowerCase());
          
          if (!nameExists) {
            const newPerson = { id: Date.now(), name: userName.trim() };
            const updatedPeople = [...existingPeople, newPerson];
            await updateDoc(doc(db, 'storage', `group-${code}-people`), { value: arrayUnion(newPerson) });
          }

          localStorage.setItem('currentGroupId', code);
          localStorage.setItem('currentUserName', userName.trim());
          
          setGroupId(code);
        } catch (error) {
          console.error('Error joining group from Firestore:', error);
          setMessage('Error joining group. Please try again.');
          setTimeout(() => setMessage(''), 3000);
        }
      }
  };

  const leaveGroup = async () => {
    const updatedPeople = people.filter(p => p.name.toLowerCase() !== userName.toLowerCase());
    try {
      if (updatedPeople.length > 0) {
        await setDoc(doc(db, 'storage', `group-${groupId}-people`), { value: updatedPeople });
      }
      localStorage.removeItem('currentGroupId');
      localStorage.removeItem('currentUserName');
    } catch (error) {
      console.error('Error leaving group in Firestore:', error);
    }

    router.push('/');
  };

  const copyGroupCode = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(groupId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const addPerson = async () => {
    if (newPersonName.trim()) {
      try {
        const newPerson = { id: Date.now().toString(), name: newPersonName.trim() };
        if (typeof window !== 'undefined') {
          await updateDoc(doc(db, 'storage', `group-${groupId}-people`), { value: arrayUnion(newPerson) });
        }
        setNewPersonName('');
      } catch (error) {
        console.error('Error adding person to Firestore:', error);
      }
    }
  };

  const removePerson = async (id) => {
    const updatedPeople = people.filter(p => String(p.id) !== String(id));
    if (typeof window !== 'undefined') {
      try {
        await setDoc(doc(db, 'storage', `group-${groupId}-people`), { value: updatedPeople });
      } catch (error) {
        console.error('Error removing person from Firestore:', error);
      }
    }
  };

  const handleAddExpense = async () => {
    if (!expenseDescription.trim() || !expenseAmount || !expensePaidBy) {
      setMessage(getText('pleaseFillFields'));
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    if (expenseSplitAmong.length === 0) {
      setMessage('Please select who to split among');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    const amountVal = parseFloat(expenseAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setMessage('Please enter a valid amount');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const payerId = String(expensePaidBy);
      const payer = people.find(p => String(p.id) === payerId);

      const newExpense = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        description: expenseDescription.trim(),
        amount: amountVal,
        paidBy: payerId,
        paidByName: payer ? payer.name : 'Unknown',
        splitAmong: expenseSplitAmong.map(String),
        splitAmongNames: [], // Empty to avoid undefined values
        addedBy: userName || 'Unknown'
      };
      if (typeof window !== 'undefined') {
        await updateDoc(doc(db, 'storage', `group-${groupId}-expenses`), { value: arrayUnion(newExpense) });
      }
      setExpenseDescription('');
      setExpenseAmount('');
      setExpensePaidBy('');
      setExpenseSplitAmong([]);
    } catch (error) {
      console.error('Error adding expense to Firestore:', error);
      setMessage('Error adding expense. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const removeExpense = async (id) => {
    const updatedExpenses = expenses.filter(e => e.id !== id);
    if (typeof window !== 'undefined') {
      try {
        await setDoc(doc(db, 'storage', `group-${groupId}-expenses`), { value: updatedExpenses });
      } catch (error) {
        console.error('Error removing expense from Firestore:', error);
      }
    }
  };

  const toggleSplitPerson = (personId) => {
    const pid = String(personId);
    setExpenseSplitAmong(prev => 
      prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
    );
  };

  const calculateBalances = () => {
    const balances = {};
    people.forEach(p => balances[String(p.id)] = 0);
    expenses.forEach(expense => {
      const payerId = String(expense.paidBy);
      if (balances[payerId] === undefined) balances[payerId] = 0;
      
      const splitCount = expense.splitAmong ? expense.splitAmong.length : 0;
      if (splitCount > 0) {
        const perPerson = expense.amount / splitCount;
        
        expense.splitAmong.forEach(personId => {
          const pid = String(personId);
          if (balances[pid] === undefined) balances[pid] = 0;
          balances[pid] -= perPerson;
        });
        
        balances[payerId] += expense.amount;
      }
    });
    return balances;
  };

  const calculateSettlements = () => {
    const balances = calculateBalances();
    const creditors = [];
    const debtors = [];
    Object.entries(balances).forEach(([id, balance]) => {
      if (balance > 0.01) creditors.push({ id: String(id), amount: balance });
      if (balance < -0.01) debtors.push({ id: String(id), amount: -balance });
    });
    const settlements = [];
    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const payment = Math.min(creditors[i].amount, debtors[j].amount);
      settlements.push({ from: String(debtors[j].id), to: String(creditors[i].id), amount: payment });
      creditors[i].amount -= payment;
      debtors[j].amount -= payment;
      if (creditors[i].amount < 0.01) i++;
      if (debtors[j].amount < 0.01) j++;
    }
    return settlements;
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!groupId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center transition-colors">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 p-8 mb-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h1 className="text-3xl font-light text-gray-900 dark:text-white mb-2">{getText('appName')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{getText('tagline')}</p>
            
            {message && (
              <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 border-l-2 border-gray-400">
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
                      ? 'bg-gray-900 text-white'
                      : 'border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => changeLanguage('ar')}
                  className={`flex-1 py-2 text-sm transition ${
                    language === 'ar'
                      ? 'bg-gray-900 text-white'
                      : 'border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  العربية
                </button>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2">{getText('yourName')}</label>
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
                  value={groupIdInput}
                  onChange={(e) => setGroupIdInput(e.target.value.toUpperCase())}
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

  const balances = calculateBalances();
  const settlements = calculateSettlements();
  const isRTL = language === 'ar';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 p-8 mb-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
            <div>
              <h1 className="text-3xl font-light text-gray-900 dark:text-white">{getText('appName')}</h1>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition"
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                onClick={() => changeLanguage(language === 'en' ? 'ar' : 'en')}
                className="px-3 py-2 text-xs border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
              >
                {language === 'en' ? 'العربية' : 'English'}
              </button>
              <button
                onClick={copyGroupCode}
                className="flex items-center gap-2 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition max-w-[160px] sm:max-w-none"
              >
                {copied ? <Check className="w-4 h-4 flex-shrink-0" /> : <Copy className="w-4 h-4 flex-shrink-0" />}
                <span className="font-mono text-sm truncate">{groupId}</span>
              </button>
              <button
                onClick={leaveGroup}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:text-gray-900 hover:bg-gray-50 dark:hover:text-white dark:hover:bg-slate-800 transition"
              >
                {getText('leave')}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {getText('loggedInAs', { name: userName })}
          </p>
        </div>

        {message && (
          <div className="bg-white p-4 mb-8 border-l-2 border-gray-400">
            <p className="text-sm text-gray-700">{message}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 p-8 mb-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-6">{getText('people')} · {people.length}</h2>
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPerson()}
              placeholder={getText('addPerson')}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 transition"
            />
            <button
              onClick={addPerson}
              className="px-6 py-2 bg-gray-900 dark:bg-blue-600 text-white hover:bg-gray-800 dark:hover:bg-blue-700 transition text-sm"
            >
              {getText('add')}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {people.map(person => (
              <div key={person.id} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded">
                <span className="text-sm">{person.name}</span>
                <button
                  onClick={() => removePerson(person.id)}
                  className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {people.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-8 mb-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-6">{getText('addExpense')}</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder={getText('description')}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400"
              />
              <input
                type="number"
                step="0.01"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder={getText('amount')}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400"
              />
              <select
                value={expensePaidBy}
                onChange={(e) => setExpensePaidBy(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400"
              >
                <option value="">{getText('whoPaid')}</option>
                {people.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{getText('splitAmong')} · {expenseSplitAmong.length} {getText('selected')}</p>
                <div className="flex flex-wrap gap-2">
                  {people.map(person => (
                    <button
                      key={person.id}
                      onClick={() => toggleSplitPerson(person.id)}
                      className={`px-4 py-2 text-sm transition ${
                        expenseSplitAmong.includes(person.id)
                          ? 'bg-gray-900 dark:bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {person.name}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleAddExpense}
                className="w-full bg-gray-900 dark:bg-blue-600 text-white py-3 hover:bg-gray-800 dark:hover:bg-blue-700 transition text-sm tracking-wide mt-6"
              >
                {getText('addExpense')}
              </button>
            </div>
          </div>
        )}

        {expenses.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-8 mb-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-6">{getText('expenses')} · {expenses.length}</h2>
            <div className="space-y-4">
              {expenses.map(expense => {
                const payer = people.find(p => String(p.id) === String(expense.paidBy));
                const payerName = payer?.name || expense.paidByName || 'Unknown';
                return (
                  <div key={expense.id} className="flex justify-between items-start py-4 border-b border-gray-100 dark:border-gray-700">
                    <div>
                      <p className="text-gray-900 dark:text-white mb-1">{expense.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">${expense.amount.toFixed(2)} · {payerName}</p>
                      {expense.addedBy && (
                        <p className="text-xs text-gray-400 mt-1">{getText('addedBy', { name: expense.addedBy })}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeExpense(expense.id)}
                      className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {Object.keys(balances).length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-8 mb-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-6">{getText('balances')}</h2>
            <div className="space-y-3">
              {Object.entries(balances).map(([personId, balance]) => {
                const person = people.find(p => String(p.id) === String(personId));
                let personName = person?.name;
                if (!personName) {
                  const exp = expenses.find(e => String(e.paidBy) === String(personId));
                  personName = exp?.paidByName || 'Unknown';
                }
                return (
                  <div key={personId} className="flex justify-between items-center py-2">
                    <span className="text-gray-900 dark:text-white">
                      {personName}
                      {!person && <span className="text-xs text-gray-400 ml-2">({getText('left')})</span>}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className={balance > 0 ? 'text-gray-900 dark:text-white' : balance < 0 ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}>
                        {balance > 0 ? `+$${balance.toFixed(2)}` : balance < 0 ? `-$${Math.abs(balance).toFixed(2)}` : '$0.00'}
                      </span>
                      {balance < 0 && (
                        <button
                          onClick={() => handleShareSettleUp(personName, balance, String(personId))}
                          className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-slate-100 rounded hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          {sharedPersonId === String(personId) ? (
                            <>
                              <Check size={16} />
                              <span>{getText('copied')}</span>
                            </>
                          ) : (
                            <>
                              <Share2 size={16} />
                              <span>{getText('settleUp')}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {settlements.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-6">{getText('settlements')}</h2>
            <div className="space-y-3">
              {settlements.map((settlement, idx) => {
                const from = people.find(p => String(p.id) === String(settlement.from));
                const to = people.find(p => String(p.id) === String(settlement.to));
                let fromName = from?.name;
                let toName = to?.name;
                if (!fromName) {
                  const exp = expenses.find(e => String(e.paidBy) === String(settlement.from));
                  fromName = exp?.paidByName || 'Unknown';
                }
                if (!toName) {
                  const exp = expenses.find(e => String(e.paidBy) === String(settlement.to));
                  toName = exp?.paidByName || 'Unknown';
                }
                return (
                  <div key={idx} className={`py-3 pl-4 ${isRTL ? 'border-r-2' : 'border-l-2'} border-gray-900 dark:border-gray-500`}>
                    <p className="text-gray-900 dark:text-white">
                      {fromName} <span className="text-gray-400">{getText('pays')}</span> {toName} <span className="text-gray-900 dark:text-white font-medium">${settlement.amount.toFixed(2)}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}