// KRATIS PREMIUM - CLEAN 2026 - 0 READS - NO MORE 14857!
const firebaseConfig = {
  apiKey: "AIzaSyA56gWuoPIoxVo7rXyS1yIpfkV6RkdIQVQ",
  authDomain: "kratis-premium-clean-2026.firebaseapp.com",
  projectId: "kratis-premium-clean-2026",
  storageBucket: "kratis-premium-clean-2026.firebasestorage.app",
  messagingSenderId: "845995627106",
  appId: "1:845995627106:web:1cd2e6511233d3365b773b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth ? firebase.auth() : null;

console.log("✅ CLEAN PROJECT CONNECTED: kratis-premium-clean-2026 - 0 reads - Fixed!");

// FINAL FIX - Force AGENT to stay AGENT
async function KRATIS_FORCE_AGENT_REFRESH() {
  try {
    let email = null;
    for(let k in localStorage){
      try{
        let v = localStorage.getItem(k);
        if(v && v.includes("@")) {
          try{ let obj = JSON.parse(v); if(obj.email) email = obj.email; } catch(e){ if(v.includes("@gmail")||v.includes("@yahoo")) email = v.replace(/"/g,''); }
        }
      }catch(e){}
    }
    if(!email && auth && auth.currentUser) email = auth.currentUser.email;
    if(!email) return;
    email = email.toLowerCase().trim();
    const doc = await db.collection('users').doc(email).get();
    if(doc.exists){
      const d = doc.data();
      if(d.role === 'agent' || d.isAgent === true || d.approved === true){
        localStorage.setItem('kratis_role','agent');
        localStorage.setItem('userRole','agent');
        localStorage.setItem('role','agent');
        localStorage.setItem('isAgent','true');
        console.log("✅ FORCED AGENT:", email);
      }
    }
  }catch(e){}
}
setTimeout(KRATIS_FORCE_AGENT_REFRESH, 1000);
setTimeout(KRATIS_FORCE_AGENT_REFRESH, 3000);
setInterval(KRATIS_FORCE_AGENT_REFRESH, 5000);
