import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

const DEVICE_ID_KEY = 'a6ya_device_id';

/**
 * Get or create a stable device ID from localStorage
 * @returns {string|null} The device ID or null if on server
 */
export const getDeviceId = () => {
  if (typeof window === 'undefined') return null;
  
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      deviceId = crypto.randomUUID();
    } else {
      // Fallback for environments without crypto.randomUUID
      deviceId = 'dev_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
};

/**
 * Ensure device document exists and update lastSeenAt
 * @param {Firestore} db 
 */
export const touchDeviceDoc = async (db) => {
  const deviceId = getDeviceId();
  if (!deviceId) return;

  const deviceRef = doc(db, 'devices', deviceId);
  
  try {
    // Check if device exists to set createdAt only once
    const snap = await getDoc(deviceRef);
    
    const data = {
      lastSeenAt: serverTimestamp(),
      userAgent: window.navigator.userAgent
    };

    if (!snap.exists()) {
      data.createdAt = serverTimestamp();
    }

    await setDoc(deviceRef, data, { merge: true });
  } catch (error) {
    console.error('Error touching device doc:', error);
  }
};

/**
 * Add or update a group in the device's list
 * @param {Firestore} db 
 * @param {Object} group - { groupCode, groupName, currency }
 */
export const addGroupToDevice = async (db, group) => {
  const deviceId = getDeviceId();
  if (!deviceId || !group?.groupCode) return;

  const { groupCode, groupName, currency } = group;
  const groupRef = doc(db, 'devices', deviceId, 'groups', groupCode);

  try {
    const snap = await getDoc(groupRef);
    
    const data = {
      groupCode,
      lastOpenedAt: serverTimestamp()
    };

    if (groupName) data.groupName = groupName;
    if (currency) data.currency = currency;

    if (!snap.exists()) {
      data.joinedAt = serverTimestamp();
    }

    await setDoc(groupRef, data, { merge: true });
  } catch (error) {
    console.error('Error adding group to device:', error);
  }
};

/**
 * Remove a group from the device's list
 * @param {Firestore} db 
 * @param {string} groupCode 
 */
export const removeGroupFromDevice = async (db, groupCode) => {
  const deviceId = getDeviceId();
  if (!deviceId || !groupCode) return;

  try {
    await deleteDoc(doc(db, 'devices', deviceId, 'groups', groupCode));
  } catch (error) {
    console.error('Error removing group from device:', error);
  }
};

/**
 * Listen to the device's groups, ordered by lastOpenedAt
 * @param {Firestore} db 
 * @param {Function} callback 
 * @returns {Function} unsubscribe
 */
export const listenToDeviceGroups = (db, callback) => {
  const deviceId = getDeviceId();
  if (!deviceId) return () => {};

  const groupsRef = collection(db, 'devices', deviceId, 'groups');
  const q = query(groupsRef, orderBy('lastOpenedAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const groups = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(groups);
  }, (error) => {
    console.error('Error listening to device groups:', error);
  });
};