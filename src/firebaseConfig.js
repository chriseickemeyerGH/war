import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";

const config = {
  apiKey: "AIzaSyCR1qJARHDfnlosVNiN5T43omz6-RLS2g4",
  authDomain: "warcardapp.firebaseapp.com",
  databaseURL: "https://warcardapp.firebaseio.com",
  projectId: "warcardapp",
  storageBucket: "warcardapp.appspot.com",
  messagingSenderId: "393386378617",
  appId: "1:393386378617:web:c964164897653d37231ba8"
};

firebase.initializeApp(config);

export default firebase;
