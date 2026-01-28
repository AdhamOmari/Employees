// Update a user's status, loginTime, and logoutTime in Realtime DB
export const updateUserStatusRealtime = async (id, status, loginTime, logoutTime) => {
  const db = getDatabase(app);
  await set(ref(db, `uploadedUsers/${id}/status`), status);
  await set(ref(db, `uploadedUsers/${id}/loginTime`), loginTime);
  await set(ref(db, `uploadedUsers/${id}/logoutTime`), logoutTime);
};
import { getDatabase, ref, set, remove, get, child } from "firebase/database";
import { app } from "./firebase";

const db = getDatabase(app);

export const uploadUsersToRealtimeDB = async (users) => {
  // Save each user under /uploadedUsers/{id}
  const promises = users.map((user) =>
    set(ref(db, `uploadedUsers/${user.id}`), {
      id: user.id,
      name: user.name,
      status: user.status || 'OUT',
      loginTime: user.loginTime || null,
      logoutTime: user.logoutTime || null,
    })
  );
  await Promise.all(promises);
};

export const deleteAllUploadedUsersRealtime = async () => {
  await remove(ref(db, "/uploadedUsers"));
};

export const fetchUploadedUsersRealtime = async () => {
  const snapshot = await get(child(ref(db), "/uploadedUsers"));
  if (snapshot.exists()) {
    const data = snapshot.val();
    return Object.values(data);
  }
  return [];
};
