import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, Timestamp, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../config/firebase.config';

// Initialize Firebase
let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw new Error("Failed to initialize Firebase. Check your configuration.");
}

// Firestore Collections
export const COLLECTIONS = {
  USERS: 'users',
  COMPANIES: 'companies',
  TIME_ENTRIES: 'time_entries'
};

// Auth Functions
export const signInAnonymous = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error("Anonymous sign-in error:", error);
    throw error;
  }
};

// User Functions
export const createUser = async (userData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
      name: userData.name || '',
      title: userData.title || '',
      role: userData.role || 'employee',
      accessCode: userData.accessCode || '',
      assignedCompanyIds: userData.assignedCompanyIds || [],
      isBlocked: false,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const getUserByAccessCode = async (accessCode) => {
  try {
    const q = query(collection(db, COLLECTIONS.USERS), where("accessCode", "==", accessCode));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    console.error("Error fetching user by access code:", error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, userData);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

// Company Functions
export const createCompany = async (companyData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.COMPANIES), {
      name: companyData.name || '',
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating company:", error);
    throw error;
  }
};

export const getAllCompanies = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.COMPANIES));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
};

export const updateCompany = async (companyId, companyData) => {
  try {
    const companyRef = doc(db, COLLECTIONS.COMPANIES, companyId);
    await updateDoc(companyRef, companyData);
  } catch (error) {
    console.error("Error updating company:", error);
    throw error;
  }
};

export const deleteCompany = async (companyId) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.COMPANIES, companyId));
  } catch (error) {
    console.error("Error deleting company:", error);
    throw error;
  }
};

// Time Entry Functions
export const createTimeEntry = async (entryData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.TIME_ENTRIES), {
      userId: entryData.userId || '',
      userName: entryData.userName || '',
      userTitle: entryData.userTitle || '',
      companyName: entryData.companyName || '',
      description: entryData.description || '',
      seconds: entryData.seconds || 0,
      date: entryData.date || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating time entry:", error);
    throw error;
  }
};

export const getAllTimeEntries = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.TIME_ENTRIES));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching time entries:", error);
    throw error;
  }
};

export const getTimeEntriesByUser = async (userId) => {
  try {
    const q = query(collection(db, COLLECTIONS.TIME_ENTRIES), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching user time entries:", error);
    throw error;
  }
};

export const updateTimeEntry = async (entryId, entryData) => {
  try {
    const entryRef = doc(db, COLLECTIONS.TIME_ENTRIES, entryId);
    await updateDoc(entryRef, entryData);
  } catch (error) {
    console.error("Error updating time entry:", error);
    throw error;
  }
};

export const deleteTimeEntry = async (entryId) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.TIME_ENTRIES, entryId));
  } catch (error) {
    console.error("Error deleting time entry:", error);
    throw error;
  }
};

// Export Firebase instances
export { auth, db };
