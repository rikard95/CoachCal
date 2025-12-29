import { useState } from "react";
import {
  getAuth,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { doc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function DeleteAccount() {
  const [confirm, setConfirm] = useState(false);
  const [input, setInput] = useState("");
  const [password, setPassword] = useState("");
  const [reauth, setReauth] = useState(false);
  const auth = getAuth();

  const deleteFirestoreData = async (uid: string) => {
    const coachRef = doc(db, "coaches", uid);
    const eventsRef = collection(coachRef, "events");
    const eventsSnap = await getDocs(eventsRef);

    for (const eventDoc of eventsSnap.docs) {
      await deleteDoc(eventDoc.ref);
    }
    await deleteDoc(coachRef);

    const userRef = doc(db, "users", uid);
    await deleteDoc(userRef);
  };

  const handleDelete = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await deleteFirestoreData(user.uid);
      await deleteUser(user);
      window.location.href = "/";
    } catch (e: any) {
      if (e.code === "auth/requires-recent-login") {
        setReauth(true);
      } else {
        console.error(e);
      }
    }
  };

  const handleReauthDelete = async () => {
    const user = auth.currentUser;
    if (!user || !password) return;

    try {
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);
      await deleteFirestoreData(user.uid);
      await deleteUser(user);
      window.location.href = "/";
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {!confirm ? (
        <button
          className="btn btn-danger rounded-lg"
          onClick={() => setConfirm(true)}
        >
          Delete account
        </button>
      ) : reauth ? (
        <div>
          <p>Enter your password to confirm deletion</p>
          <input
            type="password"
            className="form-control mb-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="btn btn-success me-2"
            onClick={() => setConfirm(false)}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={handleReauthDelete}
            disabled={!password}
          >
            Delete account
          </button>
        </div>
      ) : (
        <div>
          <p>Type DELETE to confirm</p>
          <input
            type="text"
            className="form-control mb-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            className="btn btn-success me-2"
            onClick={() => setConfirm(false)}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={input !== "DELETE"}
          >
            Yes, delete
          </button>
        </div>
      )}
    </>
  );
}
