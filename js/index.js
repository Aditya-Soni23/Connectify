/* -----------------------------
SCROLL PROGRESS BAR
----------------------------- */

window.onscroll = function(){

    let winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    
    let height =
    document.documentElement.scrollHeight -
    document.documentElement.clientHeight;
    
    let scrolled = (winScroll / height) * 100;
    
    document.getElementById("progressBar").style.width = scrolled + "%";
    
    };
    
    
    
    /* -----------------------------
    PROFILE CARD HOVER EFFECT
    ----------------------------- */
    
    const card = document.querySelector(".profileCard");
    
    if(card){
    
    card.addEventListener("mousemove",(e)=>{
    
    const rect = card.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = -(y - centerY) / 10;
    const rotateY = (x - centerX) / 10;
    
    card.style.transform =
    `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    
    });
    
    card.addEventListener("mouseleave",()=>{
    
    card.style.transform="rotateX(0) rotateY(0)";
    
    });
    
    }
    
    
    
    /* -----------------------------
    FIREBASE INITIALIZATION
    ----------------------------- */
    
    const firebaseConfig = {
    
    apiKey: "AIzaSyDyp-eAPkDoL4lx9ngK7tAPMwpt4SJhpsM",
    authDomain: "connectify-84791.firebaseapp.com",
    projectId: "connectify-84791",
    storageBucket: "connectify-84791.firebasestorage.app",
    messagingSenderId: "916072304557",
    appId: "1:916072304557:web:796e75ba795cdde378db24",
    measurementId: "G-9LC9NDF2EK"
    
    };
    
    firebase.initializeApp(firebaseConfig);
    
    const auth = firebase.auth();
    const db = firebase.database();
    
    
    
    /* -----------------------------
    GOOGLE SIGN IN
    ----------------------------- */
    
    const provider = new firebase.auth.GoogleAuthProvider();
    
    const signInBtns = document.querySelectorAll(".googleSignIn");  
    
    signInBtns.forEach(btn => {

        btn.onclick = async () => {
        
        try{
        
        const result = await auth.signInWithPopup(provider);
        
        const user = result.user;
        
        const uid = user.uid;
        
        const userRef = db.ref("users/" + uid);
        
        const snapshot = await userRef.get();
        
        if(!snapshot.exists()){
        
        await userRef.set({
        
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
        username: user.email.split("@")[0],
        bio: "New Connectify user",
        created: Date.now()
        
        });
        
        }
        
        localStorage.setItem("connectify_uid", uid);
        
        window.location.href = "dashboard.html";
        
        }catch(error){
        
        console.error(error);
        
        }
        
        };
        
        });