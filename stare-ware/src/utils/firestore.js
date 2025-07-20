// Firestore utility functions for user profiles and tests
import { db } from '../firebase';
import {
  collection,
  addDoc,
  setDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc // Add deleteDoc import
} from 'firebase/firestore';

// Save or update a user profile
export async function saveUserProfile(user, extraData = {}) {
  if (!user) throw new Error('No user');
  await setDoc(doc(db, 'users', user.uid), {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    ...extraData
  });
}

// Load a user profile
export async function loadUserProfile(uid) {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

// Save or update a test (if test.id exists, update; else, create new)
export async function saveTest(test, user) {
  if (!user) throw new Error('No user');
  const now = new Date().toISOString();
  if (test.id) {
    await setDoc(doc(db, 'tests', test.id), {
      ...test,
      ownerUid: user.uid,
      ownerEmail: user.email,
      updatedAt: now,
      createdAt: test.createdAt || now
    });
    return test.id;
  } else {
    const docRef = await addDoc(collection(db, 'tests'), {
      ...test,
      ownerUid: user.uid,
      ownerEmail: user.email,
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  }
}

// Delete a test by id
export async function deleteTest(testId) {
  await deleteDoc(doc(db, 'tests', testId));
}

// Load all tests for a user
export async function loadUserTests(user) {
  if (!user) throw new Error('No user');
  const q = query(collection(db, 'tests'), where('ownerUid', '==', user.uid));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Get a single test by id
export async function getTestById(testId) {
  const docRef = doc(db, 'tests', testId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
} 