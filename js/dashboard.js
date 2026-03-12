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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.database();

/* -----------------------------
GLOBAL PROFILE LINKS & STORE
----------------------------- */

let profileLinks = [];
let userCredits = 10;
let userBadges = [];
let userAnimations = [];
let activeDecoration = null; // Defined globally

/* -----------------------------
AUTH CHECK
----------------------------- */

auth.onAuthStateChanged((user) => {
    if (user) {
        localStorage.setItem("connectify_uid", user.uid);

        // TOP BAR
        const nameElement = document.getElementById("userName");
        const picElement = document.getElementById("userPic");
        if (nameElement) nameElement.innerText = user.displayName;
        if (picElement) picElement.src = user.photoURL;

        // PROFILE CARD PREVIEW
        const previewName = document.getElementById("previewName");
        const previewPic = document.getElementById("previewPic");
        const previewUsername = document.getElementById("previewUsername");
        if (previewName) previewName.innerText = user.displayName;
        if (previewPic) previewPic.src = user.photoURL;
        const username = user.email.split("@")[0];
        if (previewUsername) previewUsername.innerText = "@" + username;

        // LOAD PROFILE & STORE INFO
        loadUserProfile(user.uid);
    } else {
        window.location.href = "index.html";
    }
});

/* -----------------------------
LOAD USER PROFILE
----------------------------- */

function loadUserProfile(uid) {
    db.ref("users/" + uid).once("value", (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // Fill Build Profile form
        if (document.getElementById("bioInput"))
            document.getElementById("bioInput").value = data.bio || "";
        if (document.getElementById("tagsInput"))
            document.getElementById("tagsInput").value = data.tags || "";

        // Links
        if (data.links) profileLinks = data.links;
        renderLinks();

        // Credits, badges, animations, decoration
        if (data.credits !== undefined) userCredits = data.credits;
        if (data.badges) userBadges = data.badges;
        if (data.animations) userAnimations = data.animations;
        
        // Persist Decoration from Firebase
        if (data.decoration) {
            activeDecoration = data.decoration;
            applyDecoration(activeDecoration);
        }

        document.getElementById("userCredits").innerText = userCredits;

        // Update Build Profile preview
        updatePreview();

        // Render badges ONLY in View Profile
        renderViewProfileBadges();

        // Load View Profile info
        loadViewProfile({
            name: data.name || "",
            username: data.username || "",
            photo: data.photo || "assets/logo.png",
            bio: data.bio || "",
            tags: data.tags || "",
            links: data.links || [],
            decoration: data.decoration || null
        });

        // disable store item if badge already owned
        if (userBadges.includes("Premium Member")) {
            const storeItem = document.querySelector(".storeItem button");
            if (storeItem) {
                storeItem.disabled = true;
                storeItem.innerText = "Purchased";
            }
        }
    });
}

/* -----------------------------
PROFILE DROPDOWN
----------------------------- */

const userProfile = document.getElementById("userProfile");
const dropdown = document.getElementById("profileDropdown");

if (userProfile) {
    userProfile.onclick = () => {
        dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    };
}

/* -----------------------------
LOGOUT
----------------------------- */

function logout() {
    auth.signOut().then(() => {
        localStorage.removeItem("connectify_uid");
        window.location.href = "index.html";
    });
}

/* -----------------------------
PROFILE PREVIEW (BUILD PROFILE ONLY)
----------------------------- */

function updatePreview() {
    const bio = document.getElementById("bioInput")?.value || "";
    const tags = document.getElementById("tagsInput")?.value || "";
    if (document.getElementById("previewBio"))
        document.getElementById("previewBio").innerText = bio || "Your description";

    const tagContainer = document.getElementById("previewTags");
    const gradients = [
        "linear-gradient(45deg,#ff7a18,#ffb347)",
        "linear-gradient(45deg,#00c6ff,#0072ff)",
        "linear-gradient(45deg,#f953c6,#b91d73)",
        "linear-gradient(45deg,#43cea2,#185a9d)",
        "linear-gradient(45deg,#ff512f,#dd2476)",
        "linear-gradient(45deg,#24c6dc,#514a9d)"
    ];

    if (tagContainer) {
        tagContainer.innerHTML = "";
        tags.split(",").forEach((tag, i) => {
            if (tag.trim() !== "") {
                const span = document.createElement("span");
                span.innerText = tag.trim();
                span.style.background = gradients[i % gradients.length];
                tagContainer.appendChild(span);
            }
        });
    }
}

document.querySelectorAll(".profileForm input, .profileForm textarea")
    .forEach(el => el.addEventListener("input", updatePreview));

/* -----------------------------
PROFILE LINKS
----------------------------- */

function openLinkPopup() { document.getElementById("linkPopup").style.display = "flex"; }
function closeLinkPopup() { document.getElementById("linkPopup").style.display = "none"; }

function addLink() {
    const name = document.getElementById("linkName").value;
    const value = document.getElementById("linkValue").value;
    if (!name || !value) return;
    profileLinks.push({ name, value });
    renderLinks();
    document.getElementById("linkName").value = "";
    document.getElementById("linkValue").value = "";
    closeLinkPopup();
}

function renderLinks() {
    const container = document.getElementById("previewLinks");
    if (!container) return;
    container.innerHTML = "";

    profileLinks.forEach((link, index) => {
        const linkWrapper = document.createElement("div");
        linkWrapper.style.display = "inline-flex";
        linkWrapper.style.alignItems = "center";
        linkWrapper.style.margin = "4px";
        linkWrapper.style.background = "#222";
        linkWrapper.style.borderRadius = "8px";
        linkWrapper.style.padding = "4px 8px";

        const a = document.createElement("a");
        a.href = link.value;
        a.target = "_blank";
        a.innerText = link.name;
        a.style.color = "gold";
        a.style.textDecoration = "none";
        a.style.marginRight = "6px";

        const removeBtn = document.createElement("span");
        removeBtn.innerText = "✖";
        removeBtn.style.cursor = "pointer";
        removeBtn.style.color = "#ff4d4d";
        removeBtn.style.fontWeight = "bold";
        removeBtn.onclick = () => {
            profileLinks.splice(index, 1);
            renderLinks();
        };

        linkWrapper.appendChild(a);
        linkWrapper.appendChild(removeBtn);
        container.appendChild(linkWrapper);
    });
}

/* -----------------------------
SAVE PROFILE
----------------------------- */

function saveProfile() {
    const user = auth.currentUser;
    if (!user) return;

    const username = user.email.split("@")[0];

    db.ref("users/" + user.uid).set({
        name: user.displayName,
        photo: user.photoURL,
        email: user.email,
        username: username,
        bio: document.getElementById("bioInput").value,
        tags: document.getElementById("tagsInput").value,
        links: profileLinks,
        credits: userCredits,
        badges: userBadges,
        animations: userAnimations,
        decoration: activeDecoration
    });

    renderViewProfileBadges();
}

/* -----------------------------
STORE PURCHASES
----------------------------- */

function buyItem(btn) {
    const card = btn.closest(".storeItem");
    const itemName = card.dataset.name;
    const itemPrice = parseInt(card.dataset.price);
    const itemType = card.dataset.type;

    if (userCredits < itemPrice) {
        alert("Not enough credits!");
        return;
    }

    if (itemType === "badge" && userBadges.includes(itemName)) {
        alert("You already own this badge!");
        return;
    }

    userCredits -= itemPrice;
    document.getElementById("userCredits").innerText = userCredits;

    if (itemType === "badge") {
        userBadges.push(itemName);
        renderViewProfileBadges();
    }

    if (itemType === "animation") {
        userAnimations.push(itemName.replace(/\s/g, ""));
        alert(`${itemName} purchased! Apply it using applyAnimation('${itemName.replace(/\s/g, "")}')`);
    }

    btn.disabled = true;
    btn.innerText = "Purchased";

    saveProfile(); 
}

/* -----------------------------
DECORATION SYSTEM
----------------------------- */

function buyDecoration(btn) {
    const card = btn.closest(".storeItem");
    const decoName = card.dataset.name;
    const price = parseInt(card.dataset.price);

    if (userCredits < price) {
        alert("Not enough credits!");
        return;
    }

    if (activeDecoration) {
        const confirmReplace = confirm("You already have a decoration. Buying this will replace it. Continue?");
        if (!confirmReplace) return;
    }

    userCredits -= price;
    document.getElementById("userCredits").innerText = userCredits;
    activeDecoration = decoName;

    applyDecoration(decoName);
    saveProfile(); // This ensures it stays after refresh
}

function applyDecoration(name) {
    const deco = document.getElementById("avatarDecoration");
    if (!deco) return;

    deco.style.backgroundImage = `url(assets/${name}.png)`;
    deco.style.display = "block"; // Ensure it is visible

    // Reset Defaults
    deco.style.width = "174px";
    deco.style.height = "174px";
    deco.style.left = "-12px";

    // Decoration Specific Positioning
    if (name === "halloween") {
        deco.style.top = "-115px";  // Moved significantly higher to be above pfp
        deco.style.left = "-12px";
    } else if (name === "beach") {
        deco.style.top = "-105px";  // Moved higher to be above pfp
        deco.style.left = "-12px";
    } else if (name === "cyber") {
        deco.style.width = "210px"; // Made even bigger as requested
        deco.style.height = "210px";
        deco.style.top = "-28px";
        deco.style.left = "-25px";
    } else {
        deco.style.top = "-12px"; // Default overlay position
    }
}

/* -----------------------------
APPLY ANIMATION
----------------------------- */

function applyAnimation(animationName) {
    const profileCard = document.querySelector(".bigProfileCard");
    if (!profileCard) return;

    profileCard.classList.remove(...userAnimations);
    profileCard.classList.add(animationName);
}

/* -----------------------------
QUICK LINKS & SCROLL
----------------------------- */

function openSection(sectionId) {
    scrollToSection(sectionId);
}

function scrollToSection(id) {
    document.querySelectorAll(".menu li").forEach(li => li.classList.remove("active"));

    const menuItem = Array.from(document.querySelectorAll(".menu li"))
        .find(li => li.getAttribute("onclick")?.includes(id));
    if (menuItem) menuItem.classList.add("active");

    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: "smooth" });
}

/* -----------------------------
VIEW PROFILE
----------------------------- */

function loadViewProfile(data) {
    document.getElementById("viewName").innerText = data.name;
    document.getElementById("viewUsername").innerText = "@" + data.username;
    document.getElementById("viewPic").src = data.photo;
    document.getElementById("viewBio").innerText = data.bio || "";

    if (data.decoration) {
        activeDecoration = data.decoration;
        applyDecoration(activeDecoration);
    }

    // TAGS
    const tagBox = document.getElementById("viewTags");
    tagBox.innerHTML = "";
    const gradients = [
        "linear-gradient(45deg,#ff7a18,#ffb347)",
        "linear-gradient(45deg,#00c6ff,#0072ff)",
        "linear-gradient(45deg,#f953c6,#b91d73)",
        "linear-gradient(45deg,#43cea2,#185a9d)"
    ];
    if (data.tags) {
        data.tags.split(",").forEach((tag, i) => {
            const span = document.createElement("span");
            span.innerText = tag.trim();
            span.style.background = gradients[i % gradients.length];
            tagBox.appendChild(span);
        });
    }

    // LINKS
    const linkBox = document.getElementById("viewLinks");
    linkBox.innerHTML = "";
    if (data.links) {
        data.links.forEach(link => {
            const a = document.createElement("a");
            a.href = link.value;
            a.target = "_blank";
            a.innerText = link.name;
            linkBox.appendChild(a);
        });
    }
}

/* -----------------------------
VIEW PROFILE BADGES ONLY
----------------------------- */

function renderViewProfileBadges() {
    const container = document.querySelector(".profileRight .viewBadges");
    if (!container) return;

    container.innerHTML = "";
    userBadges.forEach(badge => {
        const span = document.createElement("span");
        span.className = "premiumBadge";
        span.innerText = badge;
        container.appendChild(span);
    });
}
/* -----------------------------
   CONNECT+ GLOBAL DIRECTORY
----------------------------- */

let allUsers = []; // Local cache for searching

function loadGlobalUsers() {
    const grid = document.getElementById("globalUsersGrid");
    const currentUid = localStorage.getItem("connectify_uid");

    db.ref("users").on("value", (snapshot) => {
        grid.innerHTML = "";
        allUsers = [];
        const data = snapshot.val();

        for (let uid in data) {
            if (uid === currentUid) continue; // Don't show yourself

            const user = data[uid];
            user.uid = uid; // Store UID for actions
            allUsers.push(user);
            renderUserCard(user);
        }
    });
}

function renderUserCard(user) {
    const grid = document.getElementById("globalUsersGrid");
    if (!grid) return;
    
    // Create the container
    const card = document.createElement("div");
    card.className = "bigProfileCard globalFeedCard"; 

    // Build the exact same internal structure as your View Profile
    card.innerHTML = `
        <div class="cardGlow"></div>
        
        <div class="profileLeft">
            <div class="avatarWrapper">
                <img src="${user.photo || 'assets/logo.png'}" class="viewPic">
                <div class="avatarDecoration" id="deco-${user.uid}"></div>
            </div>
<h2 style="margin-top:10px; font-size: 22px;">${user.name}</h2>
<p class="viewUsername" style="margin-bottom:5px;">@${user.username}</p>
            
            <div class="cardActions">
                <button onclick="sendFriendRequest('${user.uid}', '${user.name.replace(/'/g, "\\'")}')">➕ Connect</button>
                <button onclick="donateCredits('${user.uid}', '${user.name.replace(/'/g, "\\'")}')">🎁 Donate</button>
                <button onclick="openChat('${user.uid}', '${user.name.replace(/'/g, "\\'")}')">💬 Chat</button>
            </div>
        </div>

        <div class="profileRight">
            <div class="viewBlock">
                <h3>Description</h3>
                <p>${user.bio || "No description provided."}</p>
            </div>
            
            <div class="viewBlock">
                <h3>Tags</h3>
                <div class="viewTags" id="tags-${user.uid}"></div>
            </div>
            
            <div class="viewBlock">
                <h3>Links</h3>
                <div class="viewLinks" id="links-${user.uid}"></div>
            </div>

            <div class="viewBlock">
                <div class="viewBadges" id="badges-${user.uid}"></div>
            </div>
        </div>
    `;

    grid.appendChild(card);

    // --- Fill Dynamic Content ---

    // 1. Tags
    const tagBox = document.getElementById(`tags-${user.uid}`);
    const gradients = ["linear-gradient(45deg,#ff7a18,#ffb347)", "linear-gradient(45deg,#00c6ff,#0072ff)", "linear-gradient(45deg,#f953c6,#b91d73)", "linear-gradient(45deg,#43cea2,#185a9d)"];
    if (user.tags && tagBox) {
        user.tags.split(",").forEach((tag, i) => {
            const span = document.createElement("span");
            span.innerText = tag.trim();
            span.style.background = gradients[i % gradients.length];
            tagBox.appendChild(span);
        });
    }

    // 2. Links
    const linkBox = document.getElementById(`links-${user.uid}`);
    if (user.links && linkBox) {
        user.links.forEach(link => {
            const a = document.createElement("a");
            a.href = link.value;
            a.target = "_blank";
            a.innerText = link.name;
            linkBox.appendChild(a);
        });
    }

    // 3. Badges
    const badgeBox = document.getElementById(`badges-${user.uid}`);
    if (user.badges && badgeBox) {
        user.badges.forEach(badge => {
            const span = document.createElement("span");
            span.className = "premiumBadge";
            span.innerText = badge;
            badgeBox.appendChild(span);
        });
    }

    // 4. Decoration
    if (user.decoration) {
        applyDecorationToCard(`deco-${user.uid}`, user.decoration);
    }
}

/* -----------------------------
   FRIEND REQUEST LOGIC
----------------------------- */
function sendFriendRequest(targetUid, targetName) {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) return alert("You must be logged in!");

    // Check if sending to self
    if (currentUser.uid === targetUid) return alert("You can't connect with yourself!");

    const requestRef = db.ref("friendRequests/" + targetUid + "/" + currentUser.uid);

    requestRef.set({
        fromName: currentUser.displayName,
        fromPic: currentUser.photoURL,
        fromUid: currentUser.uid,
        status: "pending",
        timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        alert(`Friend request sent to ${targetName}!`);
    }).catch((err) => {
        alert("Error: " + err.message);
    });
}

/* -----------------------------
   RE-USE DECO LOGIC FOR GRID
----------------------------- */
function applyDecorationToCard(elementId, name) {
    const deco = document.getElementById(elementId);
    if (!deco) return;

    deco.style.backgroundImage = `url(assets/${name}.png)`;
    deco.style.display = "block";
    deco.style.width = "174px";
    deco.style.height = "174px";
    deco.style.left = "-12px";

    if (name === "halloween") { deco.style.top = "-115px"; } 
    else if (name === "beach") { deco.style.top = "-105px"; } 
    else if (name === "cyber") {
        deco.style.width = "210px";
        deco.style.height = "210px";
        deco.style.top = "-28px";
        deco.style.left = "-25px";
    } else { deco.style.top = "-12px"; }
}
// Search Functionality
function searchUsers() {
    const query = document.getElementById("userSearch").value.toLowerCase();
    const grid = document.getElementById("globalUsersGrid");
    grid.innerHTML = "";

    const filtered = allUsers.filter(u => 
        u.name.toLowerCase().includes(query) || 
        u.username.toLowerCase().includes(query)
    );

    filtered.forEach(u => renderUserCard(u));
}

/* -----------------------------
   DONATION SYSTEM
----------------------------- */

function donateCredits(targetUid, targetName) {
    const amount = prompt(`How many credits do you want to give to ${targetName}?`);
    const numAmount = parseInt(amount);

    if (isNaN(numAmount) || numAmount <= 0) return alert("Invalid amount.");
    if (numAmount > userCredits) return alert("You don't have enough credits!");

    // 1. Deduct from Sender
    userCredits -= numAmount;
    db.ref("users/" + auth.currentUser.uid).update({ credits: userCredits });
    document.getElementById("userCredits").innerText = userCredits;

    // 2. Add to Receiver
    db.ref("users/" + targetUid + "/credits").transaction((current) => {
        return (current || 0) + numAmount;
    });

    alert(`Successfully sent ${numAmount} credits to ${targetName}!`);
}

function openChat(uid, name) {
    alert(`To Chat with ${name} send them a friend request and start chatting in the chat page.`);
}

// Initialize loading
loadGlobalUsers();

function chatteleport(){
    window.location = "chat.html";
}
function discoverpage(){
    window.location = "discover.html";
}
function earnpage(){
    window.location = "wallpaper.html";
}