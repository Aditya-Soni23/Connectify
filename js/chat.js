const firebaseConfig = {
    apiKey: "AIzaSyDyp-eAPkDoL4lx9ngK7tAPMwpt4SJhpsM",
    authDomain: "connectify-84791.firebaseapp.com",
    projectId: "connectify-84791",
    storageBucket: "connectify-84791.firebasestorage.app",
    messagingSenderId: "916072304557",
    appId: "1:916072304557:web:796e75ba795cdde378db24",
    measurementId: "G-9LC9NDF2EK"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const auth = firebase.auth();
const db = firebase.database();

let activeChatId = "general"; // The one the user is currently looking at
let firstLoad = true; 

auth.onAuthStateChanged((user) => {
    if (user) {
        loadFriendRequests();
        loadFriendsList();
        // Force stay on General on refresh
        openChat("general", "Connectify General");
        startNotificationListener(); 
    } else {
        window.location.href = "index.html";
    }
});

/* -----------------------------
   FRIEND REQUESTS
----------------------------- */
function loadFriendRequests() {
    db.ref(`friendRequests/${auth.currentUser.uid}`).on("value", (snap) => {
        const list = document.getElementById("requestList");
        list.innerHTML = "";
        const data = snap.val();
        if (!data) return;
        for (let uid in data) {
            const div = document.createElement("div");
            div.className = "request-item";
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${data[uid].fromPic}" style="width:30px; height:30px; border-radius:50%;">
                    <span>${data[uid].fromName}</span>
                </div>
                <div class="req-btns">
                    <button onclick="respond('${uid}', '${data[uid].fromName}', '${data[uid].fromPic}', true)" style="color:#43cea2">✔</button>
                    <button onclick="respond('${uid}', null, null, false)" style="color:#ff4d4d">✖</button>
                </div>`;
            list.appendChild(div);
        }
    });
}

function respond(senderUid, senderName, senderPic, accept) {
    const myUid = auth.currentUser.uid;
    if (accept) {
        db.ref(`friends/${myUid}/${senderUid}`).set({ name: senderName, photo: senderPic });
        db.ref(`friends/${senderUid}/${myUid}`).set({ name: auth.currentUser.displayName, photo: auth.currentUser.photoURL });
    }
    db.ref(`friendRequests/${myUid}/${senderUid}`).remove();
}

/* -----------------------------
   FRIENDS LIST
----------------------------- */
function loadFriendsList() {
    db.ref(`friends/${auth.currentUser.uid}`).on("value", (snap) => {
        const grid = document.getElementById("friendsGrid");
        const friends = snap.val();
        
        // Keep General at top
        grid.innerHTML = `
            <div class="chat-item ${activeChatId === 'general' ? 'active' : ''}" id="item-general" onclick="openChat('general', 'Connectify General')">
                <div class="avatar-sm" style="background: gold; display:flex; align-items:center; justify-content:center; color:black; font-weight:bold;">G</div>
                <span>Connectify General</span>
                <div class="noti-dot" id="dot-general"></div>
            </div>`;
        
        if (!friends) return;
        for (let fUid in friends) {
            const div = document.createElement("div");
            div.className = `chat-item ${activeChatId === fUid ? 'active' : ''}`;
            div.id = `item-${fUid}`;
            div.onclick = () => openChat(fUid, friends[fUid].name);
            div.innerHTML = `
                <img src="${friends[fUid].photo}" class="avatar-sm">
                <span>${friends[fUid].name}</span>
                <div class="noti-dot" id="dot-${fUid}"></div>`;
            grid.appendChild(div);
        }
    });
}

/* -----------------------------
   NOTIFICATION WATCHER
----------------------------- */
function startNotificationListener() {
    // Listen for all messages to show the green dot
    db.ref("messages").on("child_added", (snap) => {
        if (firstLoad) return; // Ignore old messages on initial load
    });

    // Watch General Chat specifically
    db.ref("messages/general").limitToLast(1).on("child_added", (snap) => {
        if (activeChatId !== "general" && !firstLoad) {
            document.getElementById("dot-general").style.display = "block";
        }
    });

    // Watch Private Chats
    db.ref("messages/private").on("child_added", (snap) => {
        const chatRoomId = snap.key; // e.g., "uid1_uid2"
        if (chatRoomId.includes(auth.currentUser.uid)) {
            snap.ref.limitToLast(1).on("child_added", (msgSnap) => {
                const msg = msgSnap.val();
                if (msg.senderUid !== auth.currentUser.uid && !firstLoad) {
                    if (activeChatId !== msg.senderUid) {
                        const dot = document.getElementById(`dot-${msg.senderUid}`);
                        if (dot) dot.style.display = "block";
                    }
                }
            });
        }
    });

    // Set firstLoad to false after a short delay
    setTimeout(() => { firstLoad = false; }, 2000);
}

/* -----------------------------
   CHAT SYSTEM
----------------------------- */
function openChat(id, name) {
    activeChatId = id;
    document.getElementById("chatHeader").innerText = name;
    
    // Clear the notification dot
    const dot = document.getElementById(`dot-${id}`);
    if (dot) dot.style.display = "none";

    // UI active state
    document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`item-${id}`)?.classList.add('active');

    let path = "messages/general";
    if (id !== "general") {
        const sortedIds = [auth.currentUser.uid, id].sort();
        path = `messages/private/${sortedIds[0]}_${sortedIds[1]}`;
    }

    db.ref(path).off();
    db.ref(path).on("value", (snap) => {
        const container = document.getElementById("messages");
        container.innerHTML = "";
        const msgs = snap.val();
        if (!msgs) return;

        for (let mId in msgs) {
            const m = msgs[mId];
            const time = m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "";
            const isMe = m.senderUid === auth.currentUser.uid;
            
            const div = document.createElement("div");
            div.className = `message ${isMe ? 'sent' : 'received'}`;
            div.innerHTML = `
                <div class="msg-content">
                    <img src="${m.senderPic}" class="msg-pfp">
                    <div class="msg-info">
                        <small>${m.senderName} • ${time}</small>
                        <p>${m.text}</p>
                    </div>
                </div>`;
            container.appendChild(div);
        }
        container.scrollTop = container.scrollHeight;
    });
}

function sendMessage() {
    const input = document.getElementById("messageInput");
    const val = input.value.trim();
    if (!val) return;

    let path = "messages/general";
    if (activeChatId !== "general") {
        const sortedIds = [auth.currentUser.uid, activeChatId].sort();
        path = `messages/private/${sortedIds[0]}_${sortedIds[1]}`;
    }

    db.ref(path).push({
        senderUid: auth.currentUser.uid,
        senderName: auth.currentUser.displayName,
        senderPic: auth.currentUser.photoURL,
        text: val,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    input.value = "";
}