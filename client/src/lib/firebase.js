import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
  startAfter,
  deleteDoc
} from "firebase/firestore";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";

// Initialize Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Auth functions
export const signUp = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Set display name
    if (userData.displayName) {
      await updateProfile(user, {
        displayName: userData.displayName
      });
    }
    
    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: userData.displayName || '',
      role: userData.role || 'learner',
      createdAt: serverTimestamp(),
      xp: 0,
      sessionsCompleted: 0,
      bio: '',
      skills: []
    });
    
    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const signIn = async (email, password, rememberMe = false) => {
  try {
    // setPersistence based on rememberMe
    // const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    // await setPersistence(auth, persistence);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    // Add scopes if needed
    provider.addScope('profile');
    provider.addScope('email');
    
    const result = await signInWithPopup(auth, provider);
    
    // This gives you a Google Access Token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    
    // The signed-in user info
    const user = result.user;
    
    // Check if user exists in Firestore, if not create a profile
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (!userDoc.exists()) {
      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        role: 'learner', // Default role
        createdAt: serverTimestamp(),
        xp: 0,
        sessionsCompleted: 0,
        bio: '',
        skills: []
      });
    }
    
    return user;
  } catch (error) {
    // Handle errors
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used
    const email = error.customData?.email;
    // The AuthCredential type that was used
    const credential = GoogleAuthProvider.credentialFromError(error);
    
    throw new Error(errorMessage);
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const sendPasswordResetEmail = async (email) => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });
};

// User functions
export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    } else {
      throw new Error("User not found");
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

export const updateUserProfile = async (userId, data) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

// Skill post functions
export const createSkillPost = async (skillData, imageFile) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    let imageUrl = '';
    
    // Upload image if provided
    if (imageFile) {
      const storageRef = ref(storage, `skill-posts/${user.uid}/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(storageRef);
    }
    
    // Add document to Firestore
    const skillRef = await addDoc(collection(db, "skillPosts"), {
      title: skillData.title,
      description: skillData.description,
      mentorId: user.uid,
      mentorName: user.displayName || '',
      imageUrl,
      tags: skillData.tags || [],
      experienceLevel: skillData.experienceLevel,
      sessionLength: skillData.sessionLength,
      availability: skillData.availability,
      active: true,
      rating: 0,
      reviewCount: 0,
      createdAt: serverTimestamp(),
    });
    
    return skillRef.id;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getSkillPosts = async (filters = {}, lastVisible = null, pageSize = 10) => {
  try {
    let q = collection(db, "skillPosts");
    
    // Apply filters
    const queryConstraints = [];
    
    if (filters.tag) {
      queryConstraints.push(where("tags", "array-contains", filters.tag));
    }
    
    if (filters.experienceLevel) {
      queryConstraints.push(where("experienceLevel", "==", filters.experienceLevel));
    }
    
    if (filters.mentorId) {
      queryConstraints.push(where("mentorId", "==", filters.mentorId));
    }
    
    if (filters.active !== undefined) {
      queryConstraints.push(where("active", "==", filters.active));
    }
    
    // Always show most recent first
    queryConstraints.push(orderBy("createdAt", "desc"));
    queryConstraints.push(limit(pageSize));
    
    // Pagination
    if (lastVisible) {
      queryConstraints.push(startAfter(lastVisible));
    }
    
    q = query(q, ...queryConstraints);
    
    const querySnapshot = await getDocs(q);
    const skillPosts = [];
    querySnapshot.forEach((doc) => {
      skillPosts.push({ id: doc.id, ...doc.data() });
    });
    
    return {
      skillPosts,
      lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1]
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getSkillPostById = async (postId) => {
  try {
    const postDoc = await getDoc(doc(db, "skillPosts", postId));
    if (postDoc.exists()) {
      return { id: postDoc.id, ...postDoc.data() };
    } else {
      throw new Error("Skill post not found");
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

export const updateSkillPost = async (postId, data, imageFile) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const postRef = doc(db, "skillPosts", postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      throw new Error("Skill post not found");
    }
    
    // Check ownership
    if (postDoc.data().mentorId !== user.uid) {
      throw new Error("Not authorized to update this post");
    }
    
    const updateData = { ...data, updatedAt: serverTimestamp() };
    
    // Handle image update if provided
    if (imageFile) {
      // Delete old image if exists
      const oldImageUrl = postDoc.data().imageUrl;
      if (oldImageUrl) {
        try {
          const oldImageRef = ref(storage, oldImageUrl);
          await deleteObject(oldImageRef);
        } catch (error) {
          console.error("Error deleting old image:", error);
        }
      }
      
      // Upload new image
      const storageRef = ref(storage, `skill-posts/${user.uid}/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      updateData.imageUrl = await getDownloadURL(storageRef);
    }
    
    await updateDoc(postRef, updateData);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const deleteSkillPost = async (postId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const postRef = doc(db, "skillPosts", postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      throw new Error("Skill post not found");
    }
    
    // Check ownership
    if (postDoc.data().mentorId !== user.uid) {
      throw new Error("Not authorized to delete this post");
    }
    
    // Delete image if exists
    const imageUrl = postDoc.data().imageUrl;
    if (imageUrl) {
      try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      } catch (error) {
        console.error("Error deleting image:", error);
      }
    }
    
    await deleteDoc(postRef);
  } catch (error) {
    throw new Error(error.message);
  }
};

// Session functions
export const requestSession = async (skillPostId, message) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    // Get skill post info
    const postDoc = await getDoc(doc(db, "skillPosts", skillPostId));
    if (!postDoc.exists()) {
      throw new Error("Skill post not found");
    }
    
    const postData = postDoc.data();
    
    // Create session request
    await addDoc(collection(db, "sessions"), {
      skillPostId,
      skillPostTitle: postData.title,
      mentorId: postData.mentorId,
      learnerId: user.uid,
      learnerName: user.displayName || '',
      message,
      status: "pending",
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getUserSessions = async (role) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    let q;
    if (role === 'mentor') {
      q = query(
        collection(db, "sessions"),
        where("mentorId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        collection(db, "sessions"),
        where("learnerId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
    }
    
    const querySnapshot = await getDocs(q);
    const sessions = [];
    querySnapshot.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() });
    });
    
    return sessions;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const updateSessionStatus = async (sessionId, status, jitsiLink = null) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const sessionRef = doc(db, "sessions", sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      throw new Error("Session not found");
    }
    
    const sessionData = sessionDoc.data();
    
    // Check permissions
    if (sessionData.mentorId !== user.uid && sessionData.learnerId !== user.uid) {
      throw new Error("Not authorized to update this session");
    }
    
    // Only mentor can confirm/reject
    if ((status === "confirmed" || status === "rejected") && sessionData.mentorId !== user.uid) {
      throw new Error("Only the mentor can confirm or reject sessions");
    }
    
    const updateData = { 
      status,
      updatedAt: serverTimestamp()
    };
    
    if (jitsiLink) {
      updateData.jitsiLink = jitsiLink;
    }
    
    await updateDoc(sessionRef, updateData);
  } catch (error) {
    throw new Error(error.message);
  }
};

// Review functions
export const submitReview = async (sessionId, rating, comment) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const sessionRef = doc(db, "sessions", sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      throw new Error("Session not found");
    }
    
    const sessionData = sessionDoc.data();
    
    // Only learner can submit review
    if (sessionData.learnerId !== user.uid) {
      throw new Error("Only the learner can submit a review");
    }
    
    // Check if session is completed
    if (sessionData.status !== "completed") {
      throw new Error("Cannot review a session that isn't completed");
    }
    
    // Check if already reviewed
    if (sessionData.reviewed) {
      throw new Error("Session already reviewed");
    }
    
    // Create review
    const reviewRef = await addDoc(collection(db, "reviews"), {
      sessionId,
      skillPostId: sessionData.skillPostId,
      mentorId: sessionData.mentorId,
      learnerId: user.uid,
      learnerName: user.displayName || '',
      rating,
      comment,
      createdAt: serverTimestamp(),
    });
    
    // Update session as reviewed
    await updateDoc(sessionRef, {
      reviewed: true,
      reviewId: reviewRef.id,
    });
    
    // Update skill post rating
    const skillPostRef = doc(db, "skillPosts", sessionData.skillPostId);
    const skillPostDoc = await getDoc(skillPostRef);
    
    if (skillPostDoc.exists()) {
      const postData = skillPostDoc.data();
      const newReviewCount = (postData.reviewCount || 0) + 1;
      const currentRatingTotal = (postData.rating || 0) * (postData.reviewCount || 0);
      const newRating = (currentRatingTotal + rating) / newReviewCount;
      
      await updateDoc(skillPostRef, {
        rating: newRating,
        reviewCount: newReviewCount,
      });
    }
    
    // Update mentor's average rating
    const mentorRef = doc(db, "users", sessionData.mentorId);
    const mentorDoc = await getDoc(mentorRef);
    
    if (mentorDoc.exists()) {
      const mentorData = mentorDoc.data();
      const newReviewCount = (mentorData.reviewCount || 0) + 1;
      const currentRatingTotal = (mentorData.rating || 0) * (mentorData.reviewCount || 0);
      const newRating = (currentRatingTotal + rating) / newReviewCount;
      
      await updateDoc(mentorRef, {
        rating: newRating,
        reviewCount: newReviewCount,
      });
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getReviewsForUser = async (userId, lastVisible = null, pageSize = 10) => {
  try {
    let q = query(
      collection(db, "reviews"),
      where("mentorId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );
    
    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }
    
    const querySnapshot = await getDocs(q);
    const reviews = [];
    querySnapshot.forEach((doc) => {
      reviews.push({ id: doc.id, ...doc.data() });
    });
    
    return {
      reviews,
      lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1]
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

// Bookmark functions
export const toggleBookmark = async (skillPostId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    // Check if bookmark exists
    const q = query(
      collection(db, "bookmarks"),
      where("userId", "==", user.uid),
      where("skillPostId", "==", skillPostId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Add bookmark
      await addDoc(collection(db, "bookmarks"), {
        userId: user.uid,
        skillPostId,
        createdAt: serverTimestamp(),
      });
      return { bookmarked: true };
    } else {
      // Remove bookmark
      const bookmarkDoc = querySnapshot.docs[0];
      await deleteDoc(doc(db, "bookmarks", bookmarkDoc.id));
      return { bookmarked: false };
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getUserBookmarks = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const q = query(
      collection(db, "bookmarks"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const bookmarks = [];
    querySnapshot.forEach((doc) => {
      bookmarks.push({ id: doc.id, ...doc.data() });
    });
    
    return bookmarks;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const onAuthStateChanged = firebaseOnAuthStateChanged;
export { app, auth, db, storage };
