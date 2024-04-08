/* =============================================================================
                          FIRE-ROOMS # GERERAL-CHAT
============================================================================= */

// ========================================================================== //

import React from "react";

import "./App.css";

import { useState, useEffect, useRef } from "react";

import { useAuthState } from "react-firebase-hooks/auth";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signInAnonymously,
} from "firebase/auth";

import {
  getFirestore,
  onSnapshot,
  collection,
  addDoc,
  orderBy,
  query,
  serverTimestamp,
  limit,
} from "firebase/firestore";

import { initializeApp } from "firebase/app";

const firebaseConfig = {
  // config
};

// ========================================================================== //

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header>
        <h1>🔥general-room</h1>

        <SignOut />
      </header>

      <section>{user ? <ChatRoom /> : <SignIn />}</section>
    </div>
  );
}

// ========================================================================== //

function SignIn() {
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.log(error);
    }
  };

  const handleGuestLogin = async () => {
    const provider = new GoogleAuthProvider();

    try {
      await signInAnonymously(auth, provider);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <h1 className="face">FireRooms</h1>
      <button className="sign-in" onClick={handleGoogleLogin}>
        Join chat
      </button>
      <button className="sign-in" onClick={handleGuestLogin}>
        Go anonymous
      </button>
    </>
  );
}

// ========================================================================== //

function SignOut() {
  return (
    auth.currentUser && (
      <button className="sign-out" onClick={() => auth.signOut()}>
        Sign Out
      </button>
    )
  );
}

// ========================================================================== //

function ChatRoom() {
  const dummy = useRef();

  const messagesRef = collection(getFirestore(app), "messages");

  const [user, setUser] = useState(null);

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const q = query(
      collection(getFirestore(app), "messages"),

      orderBy("timestamp", "desc"),

      limit(25)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs

          .map((doc) => ({
            id: doc.id,

            ...doc.data(),
          }))

          .reverse()
      );

      dummy.current.scrollIntoView({ behavior: "smooth" });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });
  }, []);

  const [formValue, setFormValue] = useState("");

  const sendMessage = async (e) => {
    e.preventDefault();

    await addDoc(messagesRef, {
      uid: user.uid,

      photoURL: user.photoURL,

      displayName: user?.displayName,

      text: formValue,

      timestamp: serverTimestamp(),
    });

    setFormValue("");

    dummy.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <main>
        {messages &&
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}

        <span ref={dummy}></span>
      </main>
      <div hidden={!user?.displayName}>
        <form onSubmit={sendMessage}>
          <input
            value={formValue}
            onChange={(e) => setFormValue(e.target.value)}
            placeholder={"Message as @" + user?.displayName}
          />

          <button type="submit" disabled={!formValue}>
            Send
          </button>
        </form>
      </div>
    </>
  );
}

// ========================================================================== //

function ChatMessage(props) {
  const { text, uid, photoURL, displayName } = props.message;

  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";

  return (
    <>
      <div className={`message ${messageClass}`}>
        <img
          src={
            photoURL || "https://api.adorable.io/avatars/23/abott@adorable.png"
          }
          alt="avatar"
        />

        <p>
          <i>{displayName}</i>
          <br />
          {text}
        </p>
      </div>
    </>
  );
}

// ========================================================================== //

export default App;

// ========================================================================== //
