const firebaseConfig = {
    apiKey: "AIzaSyBbHcL3bhsK8Ov8KCEPlbtC-IR3IM7uPZI",
    authDomain: "studygo-final.firebaseapp.com",
    projectId: "studygo-final",
    storageBucket: "studygo-final.firebasestorage.app",
    messagingSenderId: "955553978445",
    appId: "1:955553978445:web:44290411097fad18f5a404"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();