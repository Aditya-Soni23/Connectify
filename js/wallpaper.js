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

auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById("authShield").style.display = "none";
        loadWallpapers();
    } else {
        window.location.href = "index.html";
    }
});

/* -----------------------------
   PREVIEW & MODAL
----------------------------- */
function previewImage() {
    const url = document.getElementById("imageUrlInput").value;
    const img = document.getElementById("urlPreviewImg");
    const placeholder = document.getElementById("previewPlaceholder");
    
    if (url.match(/\.(jpeg|jpg|gif|png|webp)$/) != null || url.includes("images.unsplash.com")) {
        img.src = url;
        img.style.display = "block";
        placeholder.style.display = "none";
    } else {
        img.style.display = "none";
        placeholder.style.display = "block";
    }
}

async function openWallpaperModal() {
    const user = auth.currentUser;
    const snap = await db.ref(`wallpapers/${user.uid}`).once("value");
    if (snap.exists()) {
        if (!confirm("Overwrite your previous wallpaper? Likes will stay!")) return;
    }
    document.getElementById("wallpaperModal").style.display = "block";
}

function closeWallpaperModal() { document.getElementById("wallpaperModal").style.display = "none"; }

/* -----------------------------
   UPLOAD LOGIC (LIKE PERSISTENCE)
----------------------------- */
function uploadWallpaper() {
    const user = auth.currentUser;
    const url = document.getElementById("imageUrlInput").value.trim();

    if (!url) return alert("Please paste a valid URL");

    db.ref(`wallpapers/${user.uid}`).once("value", (snap) => {
        const oldData = snap.val() || {};
        
        db.ref(`wallpapers/${user.uid}`).set({
            username: user.displayName,
            userPic: user.photoURL,
            image: url,
            likes: oldData.likes || 0,
            likedBy: oldData.likedBy || {}, // Persist users who liked it
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            alert("Wallpaper Shared! Good luck earning credits.");
            closeWallpaperModal();
            document.getElementById("imageUrlInput").value = "";
        });
    });
}

/* -----------------------------
   FEED & LIKES
----------------------------- */
function loadWallpapers() {
    db.ref("wallpapers").on("value", (snap) => {
        const grid = document.getElementById("wallpaperGrid");
        grid.innerHTML = "";
        const data = snap.val();
        if (!data) return;

        Object.entries(data).reverse().forEach(([uid, post]) => {
            const hasLiked = post.likedBy && post.likedBy[auth.currentUser.uid];
            
            const card = document.createElement("div");
            card.className = "wp-card";
            card.innerHTML = `
                <img src="${post.image}" class="wp-img" onclick="window.open('${post.image}', '_blank')">
                <div class="wp-info">
                    <div class="user-meta">
                        <img src="${post.userPic}">
                        <span>${post.username}</span>
                    </div>
                    <div class="like-section" onclick="${hasLiked ? '' : `likeWallpaper('${uid}')`}">
                        <span class="like-icon ${hasLiked ? 'liked' : ''}">❤</span>
                        <span>${post.likes || 0}</span>
                    </div>
                </div>`;
            grid.appendChild(card);
        });
    });
}

function likeWallpaper(postUid) {
    const user = auth.currentUser;
    const postRef = db.ref(`wallpapers/${postUid}`);

    postRef.transaction((post) => {
        if (post) {
            if (!post.likedBy) post.likedBy = {};
            if (!post.likedBy[user.uid]) {
                post.likedBy[user.uid] = true;
                post.likes = (post.likes || 0) + 1;
            }
        }
        return post;
    });
}