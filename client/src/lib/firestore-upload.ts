import { getFirestore, collection, addDoc, deleteDoc, getDocs, doc } from "firebase/firestore";
import { app } from "./firebase";

const db = getFirestore(app);

export const uploadUsersToFirestore = async (users) => {
  const batch = [];
  for (const user of users) {
    batch.push(addDoc(collection(db, "uploadedUsers"), user));
  }
  await Promise.all(batch);
};

export const deleteAllUploadedUsers = async () => {
  const querySnapshot = await getDocs(collection(db, "uploadedUsers"));
  const batch = [];
  querySnapshot.forEach((docSnap) => {
    batch.push(deleteDoc(doc(db, "uploadedUsers", docSnap.id)));
  });
  await Promise.all(batch);
};

export const fetchUploadedUsers = async () => {
  const querySnapshot = await getDocs(collection(db, "uploadedUsers"));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
