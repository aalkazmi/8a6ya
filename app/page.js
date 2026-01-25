'use client';
import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Users, DollarSign, LogIn, Share2, Copy, Check, RefreshCw } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
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
  getDocs
} from 'firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBOg9OljjLnmOkCrB7GLXUFoOY3ArMf6ig",
  authDomain: "a6ya-47c4a.firebaseapp.com",
  projectId: "a6ya-47c4a",
  storageBucket: "a6ya-47c4a.firebasestorage.app",
  messagingSenderId: "718401213991",
  appId: "1:718401213991:web:fa8f6fc53bb46dd3eea002"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export default function ExpenseSplitter() {
  const [groupId, setGroupId] = useState(null);
  const [groupIdInput, setGroupIdInput] = useState('');
  const [userName, setUserName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  
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
      if (typeof window !== 'undefined') {
        try {
          // Load basic user data
          const groupIdDoc = await getDoc(doc(db, 'storage', 'currentGroupId'));
          const userNameDoc = await getDoc(doc(db, 'storage', 'currentUserName'));
          const languageDoc = await getDoc(doc(db, 'storage', 'language'));

          const savedGroupId = groupIdDoc.exists() ? groupIdDoc.data().value : null;
          const savedUserName = userNameDoc.exists() ? userNameDoc.data().value : null;
          const savedLanguage = languageDoc.exists() ? languageDoc.data().value : 'en';

          if (savedGroupId) setGroupId(savedGroupId);
          if (savedUserName) setUserName(savedUserName);
          setLanguage(savedLanguage);

          // Load group data if groupId exists
          if (savedGroupId) {
            const peopleDoc = await getDoc(doc(db, 'storage', `group-${savedGroupId}-people`));
            const expensesDoc = await getDoc(doc(db, 'storage', `group-${savedGroupId}-expenses`));

            if (peopleDoc.exists()) {
              setPeople(peopleDoc.data().value || []);
            }

            if (expensesDoc.exists()) {
              setExpenses(expensesDoc.data().value || []);
            }
          }
        } catch (error) {
          console.error('Error loading user data from Firestore:', error);
        }
      }
    };

    loadUserData();
  }, []);

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
    }
  };

  const getText = (key, params = {}) => {
    let text = t[language][key] || key;
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(`{{${param}}}`, value);
    });
    return text;
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
        await setDoc(doc(db, 'storage', 'currentGroupId'), { value: newGroupId });
        await setDoc(doc(db, 'storage', 'currentUserName'), { value: userName.trim() });
        await setDoc(doc(db, 'storage', `group-${newGroupId}-people`), { value: initialPeople });
        await setDoc(doc(db, 'storage', `group-${newGroupId}-expenses`), { value: [] });
      }
      setPeople(initialPeople);
      setExpenses([]);
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
        const expensesDoc = await getDoc(doc(db, 'storage', `group-${code}-expenses`));
        
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
          await setDoc(doc(db, 'storage', `group-${code}-people`), { value: updatedPeople });
          setPeople(updatedPeople);
        } else {
          setPeople(existingPeople);
        }

        await setDoc(doc(db, 'storage', 'currentGroupId'), { value: code });
        await setDoc(doc(db, 'storage', 'currentUserName'), { value: userName.trim() });
        
        setGroupId(code);
        setExpenses(expensesDoc.exists() ? expensesDoc.data().value || [] : []);
      } catch (error) {
        console.error('Error joining group from Firestore:', error);
        setMessage('Error joining group. Please try again.');
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  const leaveGroup = async () => {
    const updatedPeople = people.filter(p => p.name.toLowerCase() !== userName.toLowerCase());
    if (typeof window !== 'undefined') {
      try {
        if (updatedPeople.length > 0) {
          await setDoc(doc(db, 'storage', `group-${groupId}-people`), { value: updatedPeople });
        }
        await deleteDoc(doc(db, 'storage', 'currentGroupId'));
        await deleteDoc(doc(db, 'storage', 'currentUserName'));
      } catch (error) {
        console.error('Error leaving group in Firestore:', error);
      }
    }
    setGroupId(null);
    setPeople([]);
    setExpenses([]);
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
        const newPerson = { id: Date.now(), name: newPersonName.trim() };
        const updatedPeople = [...people, newPerson];
        setPeople(updatedPeople);
        if (typeof window !== 'undefined') {
          await setDoc(doc(db, 'storage', `group-${groupId}-people`), { value: updatedPeople });
        }
        setNewPersonName('');
      } catch (error) {
        console.error('Error adding person to Firestore:', error);
      }
    }
  };

  const removePerson = async (id) => {
    const updatedPeople = people.filter(p => p.id !== id);
    setPeople(updatedPeople);
    if (typeof window !== 'undefined') {
      try {
        await setDoc(doc(db, 'storage', `group-${groupId}-people`), { value: updatedPeople });
      } catch (error) {
        console.error('Error removing person from Firestore:', error);
      }
    }
  };

  const handleAddExpense = async () => {
    if (!expenseDescription.trim() || !expenseAmount || !expensePaidBy || expenseSplitAmong.length === 0) {
      setMessage(getText('pleaseFillFields'));
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    try {
      const newExpense = {
        id: Date.now(),
        description: expenseDescription.trim(),
        amount: parseFloat(expenseAmount),
        paidBy: parseInt(expensePaidBy),
        paidByName: people.find(p => p.id === parseInt(expensePaidBy))?.name,
        splitAmong: expenseSplitAmong.map(id => parseInt(id)),
        splitAmongNames: expenseSplitAmong.map(id => ({
          id: parseInt(id),
          name: people.find(p => p.id === parseInt(id))?.name
        })),
        addedBy: userName
      };
      const updatedExpenses = [...expenses, newExpense];
      setExpenses(updatedExpenses);
      if (typeof window !== 'undefined') {
        await setDoc(doc(db, 'storage', `group-${groupId}-expenses`), { value: updatedExpenses });
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
    setExpenses(updatedExpenses);
    if (typeof window !== 'undefined') {
      try {
        await setDoc(doc(db, 'storage', `group-${groupId}-expenses`), { value: updatedExpenses });
      } catch (error) {
        console.error('Error removing expense from Firestore:', error);
      }
    }
  };

  const toggleSplitPerson = (personId) => {
    setExpenseSplitAmong(prev => 
      prev.includes(personId) ? prev.filter(id => id !== personId) : [...prev, personId]
    );
  };

  const calculateBalances = () => {
    const balances = {};
    people.forEach(p => balances[p.id] = 0);
    expenses.forEach(expense => {
      if (!balances[expense.paidBy]) balances[expense.paidBy] = 0;
      expense.splitAmong.forEach(personId => {
        if (!balances[personId]) balances[personId] = 0;
      });
    });
    expenses.forEach(expense => {
      const perPerson = expense.amount / expense.splitAmong.length;
      expense.splitAmong.forEach(personId => {
        balances[personId] -= perPerson;
      });
      balances[expense.paidBy] += expense.amount;
    });
    return balances;
  };

  const calculateSettlements = () => {
    const balances = calculateBalances();
    const creditors = [];
    const debtors = [];
    Object.entries(balances).forEach(([id, balance]) => {
      if (balance > 0.01) creditors.push({ id: parseInt(id), amount: balance });
      if (balance < -0.01) debtors.push({ id: parseInt(id), amount: -balance });
    });
    const settlements = [];
    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const payment = Math.min(creditors[i].amount, debtors[j].amount);
      settlements.push({ from: debtors[j].id, to: creditors[i].id, amount: payment });
      creditors[i].amount -= payment;
      debtors[j].amount -= payment;
      if (creditors[i].amount < 0.01) i++;
      if (debtors[j].amount < 0.01) j++;
    }
    return settlements;
  };

  if (!groupId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white p-8 mb-6">
            <h1 className="text-3xl font-light text-gray-900 mb-2">{getText('appName')}</h1>
            <p className="text-sm text-gray-500 mb-8">{getText('tagline')}</p>
            
            {message && (
              <div className="mb-6 p-3 bg-gray-100 text-sm text-gray-700 border-l-2 border-gray-400">
                {message}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2">
                {language === 'en' ? 'Language' : 'اللغة'}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => changeLanguage('en')}
                  className={`flex-1 py-2 text-sm transition ${
                    language === 'en'
                      ? 'bg-gray-900 text-white'
                      : 'border border-gray-300 text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => changeLanguage('ar')}
                  className={`flex-1 py-2 text-sm transition ${
                    language === 'ar'
                      ? 'bg-gray-900 text-white'
                      : 'border border-gray-300 text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  العربية
                </button>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2">{getText('yourName')}</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={getText('enterName')}
                className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:border-gray-400 transition"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>

            {!isJoining ? (
              <div className="space-y-3">
                <button
                  onClick={createGroup}
                  className="w-full bg-gray-900 text-white py-3 hover:bg-gray-800 transition text-sm tracking-wide"
                >
                  {getText('createGroup')}
                </button>
                <button
                  onClick={() => setIsJoining(true)}
                  className="w-full border border-gray-300 text-gray-900 py-3 hover:bg-gray-50 transition text-sm tracking-wide"
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
                  className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:border-gray-400 uppercase text-center tracking-widest"
                />
                <button
                  onClick={joinGroup}
                  className="w-full bg-gray-900 text-white py-3 hover:bg-gray-800 transition text-sm tracking-wide"
                >
                  {getText('join')}
                </button>
                <button
                  onClick={() => setIsJoining(false)}
                  className="w-full text-gray-500 py-2 hover:text-gray-900 transition text-sm"
                >
                  {getText('back')}
                </button>
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-400 text-center">{getText('autoSync')}</p>
        </div>
      </div>
    );
  }

  const balances = calculateBalances();
  const settlements = calculateSettlements();
  const isRTL = language === 'ar';

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-light text-gray-900">{getText('appName')}</h1>
            </div>
            <div className="flex gap-3 items-center">
              <button
                onClick={() => changeLanguage(language === 'en' ? 'ar' : 'en')}
                className="px-3 py-2 text-xs border border-gray-300 hover:bg-gray-50 transition"
              >
                {language === 'en' ? 'العربية' : 'English'}
              </button>
              <button
                onClick={copyGroupCode}
                className="flex items-center gap-2 border border-gray-300 px-4 py-2 hover:bg-gray-50 transition"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="font-mono text-sm">{groupId}</span>
              </button>
              <button
                onClick={leaveGroup}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
              >
                {getText('leave')}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500">{getText('loggedInAs', { name: userName })}</p>
        </div>

        {message && (
          <div className="bg-white p-4 mb-8 border-l-2 border-gray-400">
            <p className="text-sm text-gray-700">{message}</p>
          </div>
        )}

        <div className="bg-white p-8 mb-8">
          <h2 className="text-sm uppercase tracking-wide text-gray-600 mb-6">{getText('people')} · {people.length}</h2>
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPerson()}
              placeholder={getText('addPerson')}
              className="flex-1 px-4 py-2 border border-gray-200 focus:outline-none focus:border-gray-400 transition"
            />
            <button
              onClick={addPerson}
              className="px-6 py-2 bg-gray-900 text-white hover:bg-gray-800 transition text-sm"
            >
              {getText('add')}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {people.map(person => (
              <div key={person.id} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-900">
                <span className="text-sm">{person.name}</span>
                <button
                  onClick={() => removePerson(person.id)}
                  className="text-gray-400 hover:text-gray-900"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {people.length > 0 && (
          <div className="bg-white p-8 mb-8">
            <h2 className="text-sm uppercase tracking-wide text-gray-600 mb-6">{getText('addExpense')}</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder={getText('description')}
                className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:border-gray-400"
              />
              <input
                type="number"
                step="0.01"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder={getText('amount')}
                className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:border-gray-400"
              />
              <select
                value={expensePaidBy}
                onChange={(e) => setExpensePaidBy(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:border-gray-400"
              >
                <option value="">{getText('whoPaid')}</option>
                {people.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div>
                <p className="text-xs text-gray-500 mb-3">{getText('splitAmong')} · {expenseSplitAmong.length} {getText('selected')}</p>
                <div className="flex flex-wrap gap-2">
                  {people.map(person => (
                    <button
                      key={person.id}
                      onClick={() => toggleSplitPerson(person.id)}
                      className={`px-4 py-2 text-sm transition ${
                        expenseSplitAmong.includes(person.id)
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {person.name}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleAddExpense}
                className="w-full bg-gray-900 text-white py-3 hover:bg-gray-800 transition text-sm tracking-wide mt-6"
              >
                {getText('addExpense')}
              </button>
            </div>
          </div>
        )}

        {expenses.length > 0 && (
          <div className="bg-white p-8 mb-8">
            <h2 className="text-sm uppercase tracking-wide text-gray-600 mb-6">{getText('expenses')} · {expenses.length}</h2>
            <div className="space-y-4">
              {expenses.map(expense => {
                const payer = people.find(p => p.id === expense.paidBy);
                const payerName = payer?.name || expense.paidByName || 'Unknown';
                return (
                  <div key={expense.id} className="flex justify-between items-start py-4 border-b border-gray-100">
                    <div>
                      <p className="text-gray-900 mb-1">{expense.description}</p>
                      <p className="text-sm text-gray-500">${expense.amount.toFixed(2)} · {payerName}</p>
                      {expense.addedBy && (
                        <p className="text-xs text-gray-400 mt-1">{getText('addedBy', { name: expense.addedBy })}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeExpense(expense.id)}
                      className="text-gray-400 hover:text-gray-900"
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
          <div className="bg-white p-8 mb-8">
            <h2 className="text-sm uppercase tracking-wide text-gray-600 mb-6">{getText('balances')}</h2>
            <div className="space-y-3">
              {Object.entries(balances).map(([personId, balance]) => {
                const person = people.find(p => p.id === parseInt(personId));
                let personName = person?.name;
                if (!personName) {
                  const exp = expenses.find(e => e.paidBy === parseInt(personId));
                  personName = exp?.paidByName || 'Unknown';
                }
                return (
                  <div key={personId} className="flex justify-between items-center py-2">
                    <span className="text-gray-900">
                      {personName}
                      {!person && <span className="text-xs text-gray-400 ml-2">({getText('left')})</span>}
                    </span>
                    <span className={balance > 0 ? 'text-gray-900' : balance < 0 ? 'text-gray-500' : 'text-gray-400'}>
                      {balance > 0 ? `+$${balance.toFixed(2)}` : balance < 0 ? `$${Math.abs(balance).toFixed(2)}` : '$0.00'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {settlements.length > 0 && (
          <div className="bg-white p-8">
            <h2 className="text-sm uppercase tracking-wide text-gray-600 mb-6">{getText('settlements')}</h2>
            <div className="space-y-3">
              {settlements.map((settlement, idx) => {
                const from = people.find(p => p.id === settlement.from);
                const to = people.find(p => p.id === settlement.to);
                let fromName = from?.name;
                let toName = to?.name;
                if (!fromName) {
                  const exp = expenses.find(e => e.paidBy === settlement.from);
                  fromName = exp?.paidByName || 'Unknown';
                }
                if (!toName) {
                  const exp = expenses.find(e => e.paidBy === settlement.to);
                  toName = exp?.paidByName || 'Unknown';
                }
                return (
                  <div key={idx} className={`py-3 pl-4 ${isRTL ? 'border-r-2' : 'border-l-2'} border-gray-900`}>
                    <p className="text-gray-900">
                      {fromName} <span className="text-gray-400">{getText('pays')}</span> {toName} <span className="text-gray-900 font-medium">${settlement.amount.toFixed(2)}</span>
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