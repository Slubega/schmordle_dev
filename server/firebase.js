// server/firebase.js
const admin = require("firebase-admin");

// IMPORTANT: download a service account key JSON
// from the Firebase console and save it as server/serviceAccount.json
const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
