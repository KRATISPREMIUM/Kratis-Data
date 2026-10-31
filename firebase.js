// KRATIS PREMIUM DATA - FIREBASE CLOUD ♾️
const firebaseConfig = {
  apiKey: "AIzaSyDcqNfVme6HXIUPAh_IDnayPU-MUPuDyxk",
  authDomain: "kratis-premium-data.firebaseapp.com",
  projectId: "kratis-premium-data",
  storageBucket: "kratis-premium-data.firebasestorage.app",
  messagingSenderId: "676541371951",
  appId: "1:676541371951:web:0b13a99aa498b0ec3858da"
};

// Initialize Firebase (compat)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

console.log("🔥 Firebase Connected - Kratis Cloud Live!");

// Save user to cloud
async function saveUserToCloud(email, data){
  try{
    await db.collection('users').doc(email).set(data, {merge:true});
    console.log("✅ Saved to cloud:", email);
  }catch(e){ console.error("Cloud error:", e); }
}

// Load users from cloud
async function loadUsersFromCloud(){
  try{
    let snap = await db.collection('users').get();
    let cloudUsers = {};
    snap.forEach(doc=>{ cloudUsers[doc.id] = doc.data(); });
    // Merge with local
    let local = JSON.parse(localStorage.getItem('kratis_users')||'{}');
    let merged = {...local, ...cloudUsers};
    localStorage.setItem('kratis_users', JSON.stringify(merged));
    console.log("☁️ Loaded from cloud:", Object.keys(cloudUsers).length);
    return merged;
  }catch(e){ console.error(e); return JSON.parse(localStorage.getItem('kratis_users')||'{}'); }
}

// Sync current 2 agents to cloud NOW
async function syncNow(){
  let users = JSON.parse(localStorage.getItem('kratis_users')||'{}');
  for(let email in users){
    await saveUserToCloud(email, users[email]);
  }
  alert("✅ CLOUD SYNC DONE! Your "+Object.keys(users).length+" users (2 Agents) saved to Firebase forever! ♾️");
}
