import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { Capacitor } from "@capacitor/core";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
} from "firebase/auth";
import { query, collection, getDocs, getFirestore } from "firebase/firestore";
import React from "react";

// Initialize Firebase - information is stored in .env file in the root directory
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

export const AuthContext = React.createContext({
  initialized: false,
  app: null as any,
  db: null as any,
  auth: null as any,
  testQuery: null as any,
});

// initialize the Firebase JS SDK
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let auth: any = null;

if (Capacitor.isNativePlatform()) {
  // require to work appropriately on native devices
  auth = initializeAuth(app, {
    persistence: indexedDBLocalPersistence,
  });
} else {
  auth = getAuth(app);
}

export const AuthProvider = ({ children }: { children: any }) => {
  // flag to indicate if the firebase is initialized
  // const [initialized, setInitialized] = React.useState(false);
  const [initialized, setInitialized] = React.useState(false);

  // this never fires on native devices... so we'll just use the JS version
  // this is the bug, or what I call lack of support for the native version
  // basically in the native version the authstate changed event is fired
  // before the app is ready, so we'll just use the JS version
  !Capacitor.isNativePlatform() &&
    FirebaseAuthentication.addListener("authStateChange", async (result) => {
      console.log(result);
      if (result.user) {
        console.log("js sdk user", await getAuth().currentUser);
      } else {
        console.log("no user found");
      }
      !initialized && setInitialized(true);
    });



  // if on native platform, we need to get the user from JS SDK when it fires
  // it's authStateChanged event, and get the auth object differently
  if (Capacitor.isNativePlatform()) {

    // this is a hack that works on native devices since the plugin
    // doesn't fire the authStateChange event
    auth.onAuthStateChanged(async (user: any) => {
      let _user = user;
      if (!user) {
        _user = await FirebaseAuthentication.getCurrentUser();
        console.log(
          "calling native API for user, you are not logged into JS SDK",
          _user
        );
        !initialized && setInitialized(true);
        return;
      }
      console.log("javascript user - onAuthStateChanged", user);
      !initialized && setInitialized(true);
    });
  }
  /**
   *
   * @returns verify I can actually query the database
   */
  const testQuery = async () => {
    if (!getAuth(app).currentUser) throw new Error("No JS Database user found");

    const q = query(collection(db, "links"));

    const querySnapshot = await getDocs(q);
    const response: any[] = [];
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      response.push({ ...doc.data(), id: doc.id });
    });

    return response;
  };

  // the store object
  let state = {
    initialized,
    app: app,
    db: db,
    auth,
    testQuery: testQuery,
  };
  // wrap the app in the provider with the initialized context
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};

export default AuthContext;
export const useFirebaseAuthProvider = () => React.useContext(AuthContext);
