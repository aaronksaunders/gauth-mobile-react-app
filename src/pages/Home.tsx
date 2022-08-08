import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { Capacitor } from "@capacitor/core";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import {
  GoogleAuthProvider,
  PhoneAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  TwitterAuthProvider,
  signInWithPhoneNumber as signInWithPhoneNumberWeb,
} from "firebase/auth";
import React from "react";
import { useFirebaseAuthProvider } from "../firebase-auth-context";
import "./Home.css";

const Home: React.FC = () => {
  const [authResult, setAuthResult] = React.useState<any | null>(null);
  const [error, setError] = React.useState<any | null>(null);
  const email = React.useRef<HTMLIonInputElement>(null);
  const password = React.useRef<HTMLIonInputElement>(null);
  const phoneNumberRef = React.useRef<HTMLIonInputElement>(null);

  console.log("IN HOME PAGE");

  const { initialized, auth, testQuery } = useFirebaseAuthProvider();

  /**
   * gets the current user from the javascript api to ensure
   * we can make database calls as an authenticated user
   */
  const getCurrentUser = React.useCallback(() => {
    const user = auth.currentUser;
    setAuthResult(user);

    // test query, to validate we are authenticated
    user &&
      testQuery().then((res: any) => {
        console.log(res);
      });
    return user;
  }, [auth.currentUser, testQuery]);

  // React.useEffect(() => {
  //   console.log(initialized);
  //   if (initialized) getCurrentUser();
  // }, [getCurrentUser, initialized]);

  /**
   * @description sign out of firebase
   */
  const signOut = async () => {
    setError(null);
    // sign out web
    await auth.signOut();

    // sign out capacitor
    await FirebaseAuthentication.signOut();

    // clear authResult
    setAuthResult(null);
  };

  /**
   *
   *  WORKING !!
   *
   *  @description sign in with email and password
   */
  const signIn = async () => {
    setError(null);
    try {
      const result = await FirebaseAuthentication.signInWithEmailAndPassword({
        email: email.current?.value as string,
        password: password.current?.value as string,
      });

      console.log(result);

      await signInWithEmailAndPassword(
        auth,
        email.current?.value as string,
        password.current?.value as string
      );

      return getCurrentUser();
    } catch (_error) {
      console.log(_error);
      setError(_error);
    }
  };
  /**
   *
   *  WORKING !!
   *
   *  @description Sign in with Google.
   */
  const signInWithGoogle = async () => {
    setError(null);
    try {
      const result = await FirebaseAuthentication.signInWithGoogle();

      const credential = GoogleAuthProvider.credential(
        result.credential?.idToken
      );
      await signInWithCredential(auth, credential);

      return getCurrentUser();
    } catch (_error) {
      console.log(_error);
      setError(_error);
    }
  };

  /**
   *
   *  WORKING !!
   *
   * @description Sign in with phone number, first check and if on the web, then
   *  sign in with web version of this call. @see signInWithPhoneNumber_web
   */
  const signInWithPhoneNumber = async () => {
    setError(null);
    if (!Capacitor.isNativePlatform()) {
      signInWithPhoneNumber_web();
      return;
    }

    try {
      // 1. Start phone number verification
      const { verificationId } =
        await FirebaseAuthentication.signInWithPhoneNumber({
          phoneNumber: phoneNumberRef.current?.value as string,
        });

      // 2. Let the user enter the SMS code
      const verificationCode = window.prompt(
        "Please enter the verification code that was sent to your mobile device."
      );

      // 3. Sign in on the web layer using the verification ID and verification code.
      const credential = PhoneAuthProvider.credential(
        verificationId || "",
        verificationCode || ""
      );

      await signInWithCredential(auth, credential as any);
      return getCurrentUser();
    } catch (_error: any) {
      console.log(_error);
      setError(_error);
    }
  };

  /**
   *
   *  WORKING !!
   *
   * @description sign in with phone number on the Web
   */
  const signInWithPhoneNumber_web = async () => {
    setError(null);
    try {
      const appVerifier = (window as any)?.recaptchaVerifier;

      const confirmationResult = await signInWithPhoneNumberWeb(
        auth,
        phoneNumberRef.current?.value as string,
        appVerifier
      );
      // SMS sent. Prompt user to type the code from the message, then sign the
      // user in with confirmationResult.confirm(code).
      const verificationCode = window.prompt(
        "Please enter the verification code that was sent to your mobile device."
      );

      const result = await confirmationResult.confirm(
        verificationCode as string
      );
      // User signed in successfully.
      const user = result.user;
      console.log(user);

      var credential = PhoneAuthProvider.credential(
        confirmationResult.verificationId,
        verificationCode as string
      );
      const userCredentials = await signInWithCredential(auth, credential);
      console.log(userCredentials);

      return getCurrentUser();
    } catch (_error: any) {
      console.log(_error);
      setError(_error);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Ionic React</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <h2>Google, Email and Phone Authentication Test App</h2>
        {error?.message !== null && (
          <div className="ion-padding" style={{ color: "red" }}>
            {error?.message}
          </div>
        )}
        {!authResult ? (
          <>
            <IonButton onClick={() => signInWithGoogle()} expand="block">
              SIGN IN WITH GOOGLE
            </IonButton>
            {/* <IonButton onClick={() => signInWithTwitter()}>
              TWITTER AUTH
            </IonButton> */}
            <div style={{ marginTop: 12 }}>
              <IonCard style={{padding : 0, margin : 0}}>
                <IonCardContent>
                  <IonItem>
                    <IonLabel position="stacked">EMAIL</IonLabel>
                    <IonInput ref={email} type="text" required></IonInput>
                  </IonItem>
                  <IonItem>
                    <IonLabel position="stacked">PASSWORD</IonLabel>
                    <IonInput ref={password} type="password"></IonInput>
                  </IonItem>
                  <IonButton onClick={() => signIn()}>
                    SIGN IN WITH EMAIL
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </div>
            <div style={{ marginTop: 12 }}>
              <div id="sign-in-button"></div>
              <IonCard style={{padding : 0, margin : 0}}>
                <IonCardContent>
                  <IonItem>
                    <IonLabel position="stacked">PHONE NUMBER</IonLabel>
                    <IonInput
                      ref={phoneNumberRef}
                      type="text"
                      placeholder="+1 (555) 555-5555"
                      required
                    ></IonInput>
                  </IonItem>
                  <IonButton onClick={() => signInWithPhoneNumber()}>
                    SIGN IN WITH PHONE NUMBER
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </div>
          </>
        ) : (
          <div>
            <IonButton onClick={() => signOut()}>SIGN OUT</IonButton>
            <pre style={{ fontSize: "smaller" }}>
              {JSON.stringify(authResult, null, 2)}
            </pre>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Home;
