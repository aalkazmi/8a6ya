'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { PlusCircle, Trash2, Users, DollarSign, Share2, Copy, Check, RefreshCw, Moon, Sun, ChevronDown, Edit2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';
import { listenToDeviceGroups, touchDeviceDoc, addGroupToDevice, removeGroupFromDevice } from '../lib/device';
import { CURRENCIES, getDefaultCurrency, formatAmount, getCurrencyByCode } from '../lib/currencies';
function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initializing, setInitializing] = useState(true);
  const [groupId, setGroupId] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [groupIdInput, setGroupIdInput] = useState('');
  const [userName, setUserName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharedPersonId, setSharedPersonId] = useState(null);
  const [savedGroups, setSavedGroups] = useState([]);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  
  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [modalGroupName, setModalGroupName] = useState('');
  const [modalJoinCode, setModalJoinCode] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalCurrency, setModalCurrency] = useState('USD');
  const [groupCurrency, setGroupCurrency] = useState('USD');

  // Rename Modal State
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameGroupId, setRenameGroupId] = useState(null);
  const [renameGroupName, setRenameGroupName] = useState('');
  const [renameError, setRenameError] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);
  
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

        // Hydrate from URL params if present (Handover from Welcome page)
        const paramGid = searchParams.get('gid');
        const paramUname = searchParams.get('uname');
        if (paramGid) localStorage.setItem('currentGroupId', paramGid);
        if (paramUname) localStorage.setItem('currentUserName', paramUname);
        if (paramGid || paramUname) {
          router.replace('/dashboard');
        }

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

  // Listen to device groups
  useEffect(() => {
    const unsubscribe = listenToDeviceGroups(db, setSavedGroups);
    return () => unsubscribe();
  }, []);

  // DEBUG: Audit Rules - Temporary instrumentation
  useEffect(() => {
    const DEBUG_RULES_AUDIT = false; // TOGGLE TO TRUE TO AUDIT
    if (!DEBUG_RULES_AUDIT || !groupId) return;

    const audit = async () => {
      console.log('--- START FIRESTORE AUDIT ---');
      try {
        // 1. Group Doc
        const groupSnap = await getDoc(doc(db, 'groups', groupId));
        if (groupSnap.exists()) {
          console.log(`[AUDIT] groups/${groupId} keys:`, Object.keys(groupSnap.data()));
        }

        // 2. People Doc
        const peopleSnap = await getDoc(doc(db, 'storage', `group-${groupId}-people`));
        if (peopleSnap.exists()) {
          const data = peopleSnap.data();
          console.log(`[AUDIT] storage/group-${groupId}-people keys:`, Object.keys(data));
          if (Array.isArray(data.value) && data.value.length > 0) {
            console.log('[AUDIT] People item keys:', Object.keys(data.value[0]));
          }
        }

        // 3. Expenses Doc
        const expensesSnap = await getDoc(doc(db, 'storage', `group-${groupId}-expenses`));
        if (expensesSnap.exists()) {
          const data = expensesSnap.data();
          console.log(`[AUDIT] storage/group-${groupId}-expenses keys:`, Object.keys(data));
          if (Array.isArray(data.value) && data.value.length > 0) {
            console.log('[AUDIT] Expense item keys:', Object.keys(data.value[0]));
          }
        }

        // 4. Device Doc
        const deviceId = localStorage.getItem('a6ya_device_id');
        if (deviceId) {
          const memSnap = await getDoc(doc(db, 'devices', deviceId, 'groups', groupId));
          if (memSnap.exists()) {
            console.log(`[AUDIT] devices/${deviceId}/groups/${groupId} keys:`, Object.keys(memSnap.data()));
          }
        }
      } catch (e) {
        console.error('[AUDIT] Failed:', e);
      }
      console.log('--- END FIRESTORE AUDIT ---');
    };
    audit();
  }, [groupId]);

  // Backfill device membership for current group (Debug & Fix)
  useEffect(() => {
    const syncGroupToDevice = async () => {
      if (!groupId) return;

      console.log('Starting backfill for group:', groupId);

      try {
        // 1. Get or create Device ID
        let deviceId = localStorage.getItem('a6ya_device_id');
        if (!deviceId) {
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            deviceId = crypto.randomUUID();
          } else {
            deviceId = Date.now().toString(36) + Math.random().toString(36).slice(2);
          }
          localStorage.setItem('a6ya_device_id', deviceId);
          console.log('Created new device ID:', deviceId);
        } else {
          console.log('Using existing device ID:', deviceId);
        }

        // 2. Fetch Group Metadata
        const groupDoc = await getDoc(doc(db, 'groups', groupId));
        let groupName = `Group ${groupId}`;
        let currency = 'USD';

        if (groupDoc.exists()) {
          const data = groupDoc.data();
          groupName = data.name || groupName;
          currency = data.currency || currency;
          setGroupCurrency(currency);
        } else {
          console.warn('Group metadata not found for:', groupId);
        }

        // 3. Write Membership directly
        const membershipRef = doc(db, 'devices', deviceId, 'groups', groupId);
        const membershipSnap = await getDoc(membershipRef);
        
        const updateData = {
          groupCode: groupId,
          groupName: groupName,
          currency: currency,
          lastOpenedAt: serverTimestamp()
        };

        if (!membershipSnap.exists()) {
          updateData.joinedAt = serverTimestamp();
        }

        await setDoc(membershipRef, updateData, { merge: true });
        console.log('Successfully backfilled membership for:', groupId);

      } catch (error) {
        console.error('Error backfilling group to device:', error);
      }
    };

    syncGroupToDevice();
  }, [groupId]);

  // Handle Escape key for modals
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') closeModals();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Set default currency when create modal opens
  useEffect(() => {
    if (showCreateModal) {
      setModalCurrency(getDefaultCurrency());
    }
  }, [showCreateModal]);

  const switchGroup = (groupCode) => {
    if (groupCode !== groupId) {
      setGroupId(groupCode);
      localStorage.setItem('currentGroupId', groupCode);
    }
    setIsGroupMenuOpen(false);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowJoinModal(false);
    setModalGroupName('');
    setModalJoinCode('');
    setModalError('');
    setModalLoading(false);
    setModalCurrency('USD');
    setShowRenameModal(false);
    setRenameGroupId(null);
    setRenameGroupName('');
    setRenameError('');
    setRenameLoading(false);
  };

  const handleCreateGroup = async (e) => {
    if (e) e.preventDefault();

    setModalLoading(true);
    setModalError('');
    try {
      const newGroupId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const defaultGroupName = language === 'ar' ? `مجموعة ${userName.trim()}` : `${userName.trim()}'s Group`;
      const groupName = modalGroupName.trim() || defaultGroupName;
      const currency = modalCurrency;
      const initialPerson = { id: Date.now().toString(), name: userName.trim() };

      // 1. Create group metadata
      await setDoc(doc(db, 'groups', newGroupId), {
        code: newGroupId,
        name: groupName,
        currency: currency,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 2. Initialize storage
      await setDoc(doc(db, 'storage', `group-${newGroupId}-people`), { value: [initialPerson] });
      await setDoc(doc(db, 'storage', `group-${newGroupId}-expenses`), { value: [] });

      // 3. Update device history
      await touchDeviceDoc(db);
      await addGroupToDevice(db, {
        groupCode: newGroupId,
        groupName: groupName,
        currency: currency
      });

      switchGroup(newGroupId);
      closeModals();
      setMessage(getText('groupCreated', { code: newGroupId }));
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Error creating group:', error);
      setModalError('Failed to create group');
    } finally {
      setModalLoading(false);
    }
  };

  const handleJoinGroup = async (e) => {
    if (e) e.preventDefault();
    if (modalJoinCode.length !== 6) {
      setModalError('Code must be 6 characters');
      return;
    }
    setModalLoading(true);
    setModalError('');

    try {
      const code = modalJoinCode.toUpperCase();
      const groupDoc = await getDoc(doc(db, 'groups', code));

      if (!groupDoc.exists()) {
        setModalError('Group not found');
        setModalLoading(false);
        return;
      }

      const groupData = groupDoc.data();
      const groupName = groupData.name || `Group ${code}`;
      const currency = groupData.currency || 'USD';

      // Add user to people list if needed
      const peopleRef = doc(db, 'storage', `group-${code}-people`);
      const peopleDoc = await getDoc(peopleRef);
      
      if (peopleDoc.exists()) {
        const existingPeople = peopleDoc.data().value || [];
        const nameExists = existingPeople.some(p => p.name.toLowerCase() === userName.trim().toLowerCase());
        
        if (!nameExists) {
          await updateDoc(peopleRef, {
            value: arrayUnion({ id: Date.now().toString(), name: userName.trim() })
          });
        }
      }

      await touchDeviceDoc(db);
      await addGroupToDevice(db, {
        groupCode: code,
        groupName: groupName,
        currency: currency
      });

      switchGroup(code);
      closeModals();
    } catch (error) {
      console.error('Error joining group:', error);
      setModalError('Failed to join group');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRenameGroup = async (e) => {
    if (e) e.preventDefault();
    const name = renameGroupName.trim();
    if (!name) {
      setRenameError(getText('nameRequired'));
      return;
    }
    if (name.length > 40) {
      setRenameError(getText('nameTooLong'));
      return;
    }

    setRenameLoading(true);
    setRenameError('');

    try {
      const deviceId = localStorage.getItem('a6ya_device_id');

      // 1. Update global group doc
      await updateDoc(doc(db, 'groups', renameGroupId), {
        name: name,
        updatedAt: serverTimestamp(),
        lastDeviceId: deviceId
      });

      // 2. Update device membership doc (so dropdown updates immediately)
      if (deviceId) {
        await updateDoc(doc(db, 'devices', deviceId, 'groups', renameGroupId), {
          groupName: name
        });
      }

      closeModals();
    } catch (error) {
      console.error('Error renaming group:', error);
      setRenameError('Failed to update group name');
    } finally {
      setRenameLoading(false);
    }
  };

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
      createNewGroup: 'Create new group',
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
      editGroupName: 'Edit group name',
      groupName: 'Group name',
      save: 'Save',
      cancel: 'Cancel',
      nameRequired: 'Name is required',
      nameTooLong: 'Name is too long (max 40 characters)',
      groupNameOptional: 'Group Name (Optional)',
      create: 'Create',
      creating: 'Creating...',
      currency: 'Currency',
      settleUpGreeting: 'Hey {{name}}! 👋',
      settleUpMessage: 'It seems like you have an unsettled balance of {{amount}} in 8a6ya.',
      settleUpCTA: "Let's settle up! 🤝",
    },
    ar: {
      appName: '8a6ya',
      tagline: 'ادفع مستحقاتك بسهولة',
      yourName: 'اسمك',
      enterName: 'أدخل اسمك',
      createGroup: 'إنشاء مجموعة',
      createNewGroup: 'إنشاء مجموعة جديدة',
      joinGroup: 'الانضمام إلى مجموعة',
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
      editGroupName: 'تعديل اسم المجموعة',
      groupName: 'اسم المجموعة',
      save: 'حفظ',
      cancel: 'إلغاء',
      nameRequired: 'الاسم مطلوب',
      nameTooLong: 'الاسم طويل جداً',
      groupNameOptional: 'اسم المجموعة (اختياري)',
      create: 'إنشاء',
      creating: 'جاري الإنشاء...',
      currency: 'العملة',
      settleUpGreeting: 'مرحباً {{name}}! 👋',
      settleUpMessage: 'يبدو أن لديك رصيد غير مسوّى بقيمة {{amount}} في 8a6ya.',
      settleUpCTA: 'هيا نسوّي الحساب! 🤝',
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
    const formattedAmount = formatAmount(Math.abs(amount), groupCurrency);
    const message = `www.8a6ya.com ${getText('settleUp')}
${getText('settleUpGreeting', { name: personName })}

${getText('settleUpMessage', { amount: formattedAmount })}

${getText('settleUpCTA')}`;

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
    const groupName = `${userName.trim()}'s Group`;
    const currency = 'USD';
    const initialPerson = { id: Date.now().toString(), name: userName.trim() };
    const initialPeople = [initialPerson];
    
      try {
      setGroupId(newGroupId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentGroupId', newGroupId);
        localStorage.setItem('currentUserName', userName.trim());
        
        await setDoc(doc(db, 'groups', newGroupId), {
          code: newGroupId,
          name: groupName,
          currency: currency,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        await setDoc(doc(db, 'storage', `group-${newGroupId}-people`), { value: initialPeople });
        await setDoc(doc(db, 'storage', `group-${newGroupId}-expenses`), { value: [] });

        await touchDeviceDoc(db);
        await addGroupToDevice(db, {
          groupCode: newGroupId,
          groupName: groupName,
          currency: currency
        });
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
          const groupDoc = await getDoc(doc(db, 'groups', code));
          let groupName = `Group ${code}`;
          let currency = 'USD';

          if (groupDoc.exists()) {
            const data = groupDoc.data();
            groupName = data.name || groupName;
            currency = data.currency || currency;
          }

          const peopleDoc = await getDoc(doc(db, 'storage', `group-${code}-people`));
          
          if (!peopleDoc.exists()) {
            setMessage('Group not found');
            setTimeout(() => setMessage(''), 3000);
            return;
          }

          const existingPeople = peopleDoc.data().value || [];
          const nameExists = existingPeople.some(p => p.name.toLowerCase() === userName.trim().toLowerCase());
          
          if (!nameExists) {
            const newPerson = { id: Date.now().toString(), name: userName.trim() };
            await updateDoc(doc(db, 'storage', `group-${code}-people`), { value: arrayUnion(newPerson) });
          }

          await touchDeviceDoc(db);
          await addGroupToDevice(db, {
            groupCode: code,
            groupName: groupName,
            currency: currency
          });

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
      
      await removeGroupFromDevice(db, groupId);

      const remainingGroups = savedGroups.filter(g => g.id !== groupId);

      if (remainingGroups.length > 0) {
        switchGroup(remainingGroups[0].id);
      } else {
        localStorage.removeItem('currentGroupId');
        localStorage.removeItem('currentUserName');
        router.push('/');
      }
    } catch (error) {
      console.error('Error leaving group in Firestore:', error);
    }
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

  const handleAmountChange = (e) => {
    let val = e.target.value;
    
    // Convert Arabic numerals to Western
    val = val.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => d.charCodeAt(0) - 1632)
             .replace(/[۰۱۲۳۴۵۶۷۸۹]/g, d => d.charCodeAt(0) - 1776)
             .replace(/٫/g, '.');

    // Allow only numbers and one decimal point
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setExpenseAmount(val);
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
        currency: groupCurrency || 'USD',
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
              
              <div className="relative">
                <button
                  onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
                  className="flex items-center gap-2 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition max-w-[200px] sm:max-w-xs"
                >
                  <span className="font-medium text-sm truncate flex items-center gap-2">
                    {savedGroups.find(g => g.id === groupId)?.groupName || `Group ${groupId}`}
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full font-normal">
                      {savedGroups.find(g => g.id === groupId)?.currency || 'USD'}
                    </span>
                  </span>
                  <ChevronDown className="w-4 h-4 flex-shrink-0 text-gray-500 dark:text-slate-400" />
                </button>

                {isGroupMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-[min(90vw,320px)] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                    <div className="max-h-[60vh] overflow-y-auto py-1">
                      {savedGroups.map((group) => (
                        <div
                          key={group.id}
                          className={`px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer ${
                            group.id === groupId ? 'bg-blue-50 dark:bg-slate-800/50' : ''
                          }`}
                          onClick={() => switchGroup(group.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium truncate ${
                                group.id === groupId ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-slate-100'
                              }`}>
                                {group.groupName || `Group ${group.id}`}
                              </p>
                              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{group.currency || 'USD'}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-mono truncate">
                              {group.id}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {group.id === groupId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyGroupCode();
                                }}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                              >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              </button>
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenameGroupId(group.id);
                                setRenameGroupName(group.groupName || '');
                                setShowRenameModal(true);
                              }}
                              className="p-2 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {savedGroups.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
                          No saved groups
                        </div>
                      )}

                      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                      <button
                        onClick={() => {
                          setIsGroupMenuOpen(false);
                          setShowCreateModal(true);
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer text-left"
                      >
                        <PlusCircle className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-slate-100">{getText('createNewGroup')}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsGroupMenuOpen(false);
                          setShowJoinModal(true);
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer text-left"
                      >
                        <Users className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-slate-100">{getText('joinGroup')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addPerson();
                }
              }}
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
                type="text"
                inputMode="decimal"
                value={expenseAmount}
                onChange={handleAmountChange}
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatAmount(expense.amount, groupCurrency)} · {payerName}</p>
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
                        {balance > 0 ? `+${formatAmount(balance, groupCurrency)}` : formatAmount(balance, groupCurrency)}
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
                      {fromName} <span className="text-gray-400">{getText('pays')}</span> {toName} <span className="text-gray-900 dark:text-white font-medium">{formatAmount(settlement.amount, groupCurrency)}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModals}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{getText('createNewGroup')}</h2>
            
            {modalError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-sm text-red-600 dark:text-red-400 rounded-md">
                {modalError}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {getText('groupNameOptional')}
              </label>
              <input
                type="text"
                autoFocus
                value={modalGroupName}
                onChange={(e) => setModalGroupName(e.target.value)}
                placeholder={language === 'ar' ? `مجموعة ${userName}` : `${userName}'s Group`}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateGroup(e);
                  }
                }}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {getText('currency')}
              </label>
              <select
                value={modalCurrency}
                onChange={(e) => setModalCurrency(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) - {language === 'ar' ? c.name_ar : c.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModals}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition"
              >
                {getText('cancel')}
              </button>
              <button
                type="button"
                onClick={handleCreateGroup}
                disabled={modalLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition disabled:opacity-50"
              >
                {modalLoading ? getText('creating') : getText('create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModals}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Join group</h2>
            
            {modalError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-sm text-red-600 dark:text-red-400 rounded-md">
                {modalError}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Group Code
              </label>
              <input
                type="text"
                autoFocus
                maxLength={6}
                value={modalJoinCode}
                onChange={(e) => setModalJoinCode(e.target.value.toUpperCase())}
                placeholder="XY7Z9A"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase tracking-widest text-center font-mono text-lg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleJoinGroup(e);
                  }
                }}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModals}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleJoinGroup}
                disabled={modalLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition disabled:opacity-50"
              >
                {modalLoading ? 'Joining...' : 'Join'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Group Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModals}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{getText('editGroupName')}</h2>
            
            {renameError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-sm text-red-600 dark:text-red-400 rounded-md">
                {renameError}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {getText('groupName')}
              </label>
              <input
                type="text"
                autoFocus
                value={renameGroupName}
                onChange={(e) => setRenameGroupName(e.target.value)}
                placeholder={getText('groupName')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRenameGroup(e);
                  }
                }}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                {renameGroupName.length}/40
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModals}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition"
              >
                {getText('cancel')}
              </button>
              <button
                type="button"
                onClick={handleRenameGroup}
                disabled={renameLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition disabled:opacity-50"
              >
                {renameLoading ? '...' : getText('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExpenseSplitter() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin"></div>
    </div>}>
      <DashboardContent />
    </Suspense>
  );
}