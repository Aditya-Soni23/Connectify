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

let canvas, ctx, painting = false;
let currentColor = "#00c6ff";
let currentSize = 5;

auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById("authShield").style.display = "none";
        loadShowcase();
        initCanvas();
    } else {
        window.location.href = "index.html";
    }
});

/* -----------------------------
   CANVAS LOGIC
----------------------------- */
function initCanvas() {
    canvas = document.getElementById("drawingCanvas");
    ctx = canvas.getContext("2d");

    function startPosition(e) { painting = true; draw(e); }
    function finishedPosition() { painting = false; ctx.beginPath(); }

    function draw(e) {
        if (!painting) return;
        ctx.lineWidth = currentSize;
        ctx.lineCap = "round";
        ctx.strokeStyle = currentColor;

        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }

    canvas.addEventListener("mousedown", startPosition);
    canvas.addEventListener("mouseup", finishedPosition);
    canvas.addEventListener("mousemove", draw);

    document.getElementById("colorPicker").oninput = (e) => currentColor = e.target.value;
    document.getElementById("sizePicker").oninput = (e) => currentSize = e.target.value;
}

function clearCanvas() { ctx.clearRect(0, 0, canvas.width, canvas.height); }
function setEraser() { currentColor = "#FFFFFF"; }

/* -----------------------------
   POSTING LOGIC
----------------------------- */
async function openPostModal() {
    const user = auth.currentUser;
    const snap = await db.ref(`showcase/${user.uid}`).once("value");
    if (snap.exists()) {
        if (!confirm("You already have a post. Posting a new one will overwrite the drawing, but your likes will stay. Continue?")) return;
    }
    document.getElementById("postModal").style.display = "block";
}

function closePostModal() { document.getElementById("postModal").style.display = "none"; }

function uploadDrawing() {
    const user = auth.currentUser;
    const drawingData = canvas.toDataURL("image/png");

    // Fetch existing data first to preserve Likes AND the list of Likers
    db.ref(`showcase/${user.uid}`).once("value", (snap) => {
        const oldData = snap.val() || {};
        const currentLikes = oldData.likes || 0;
        const currentLikers = oldData.likedBy || {}; // This is the secret sauce

        db.ref(`showcase/${user.uid}`).set({
            username: user.displayName,
            userPic: user.photoURL,
            drawing: drawingData,
            likes: currentLikes, 
            likedBy: currentLikers, // Put the list of people back into the new post
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            alert("Drawing updated! Your likes and fans remain.");
            closePostModal();
            clearCanvas();
        });
    });
}

/* -----------------------------
   SHOWCASE FEED
----------------------------- */
/* -----------------------------
   LIKE SYSTEM (1 Like per User)
----------------------------- */
function likePost(postUid) {
    const user = auth.currentUser;
    const postRef = db.ref(`showcase/${postUid}`);

    postRef.once("value", (snap) => {
        const postData = snap.val();
        
        // Check if the current user's UID exists in the likedBy object
        if (postData.likedBy && postData.likedBy[user.uid]) {
            alert("You already liked this artist's showcase!");
            return; 
        }

        // If not liked, update both the count and the list of Likers
        const updates = {};
        updates[`likes`] = (postData.likes || 0) + 1;
        updates[`likedBy/${user.uid}`] = true;

        postRef.update(updates);
    });
}

/* -----------------------------
   SHOWCASE FEED (Updated Render)
----------------------------- */
function loadShowcase() {
    db.ref("showcase").on("value", (snap) => {
        const grid = document.getElementById("discoverGrid");
        if (!grid) return;
        
        grid.innerHTML = "";
        const posts = snap.val();
        if (!posts) return;

        // Convert to array and reverse so the newest drawings appear first
        const postEntries = Object.entries(posts).reverse();

        postEntries.forEach(([uid, post]) => {
            const card = document.createElement("div");
            card.className = "art-card";
            
            // 1. Check if the current logged-in user is in the likedBy list
            const hasLiked = post.likedBy && post.likedBy[auth.currentUser.uid];
            
            // 2. Set the heart color and disable clicking if already liked
            const heartClass = hasLiked ? "liked" : "";
            const clickAction = hasLiked ? "" : `onclick="likePost('${uid}')"`;
            const cursorStyle = hasLiked ? "style='cursor: default;'" : "style='cursor: pointer;'";

            card.innerHTML = `
                <img src="${post.drawing}" class="art-img">
                <div class="art-info">
                    <div class="user-meta">
                        <img src="${post.userPic || 'assets/logo.png'}">
                        <span>${post.username}</span>
                    </div>
                    <div class="like-section" ${clickAction} ${cursorStyle}>
                        <span class="like-icon ${heartClass}">❤</span>
                        <span id="like-count-${uid}">${post.likes || 0}</span>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    });
}