// Firebase configuration (should remain unchanged from previous versions)
const firebaseConfig = {
    apiKey: "AIzaSyBBPk_ZZ5OmcDXk0FZueWdnSRMgAB7zufI",
    authDomain: "entrix-64f31.firebaseapp.com",
    databaseURL: "https://entrix-64f31-default-rtdb.firebaseio.com",
    projectId: "entrix-64f31",
    storageBucket: "entrix-64f31.firebasestorage.app",
    messagingSenderId: "780870935360",
    appId: "1:780870935360:web:a4ea8255ac25669cd210a5"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const database = firebase.database();
// ADD THIS LINE: Initialize Firebase Functions
const functions = firebase.functions(); // If using a specific region: firebase.functions(app, 'your-region');

// DOM Elements
const loginSection = document.getElementById('login-section');
const adminDashboard = document.getElementById('admin-dashboard');
const scannerDashboard = document.getElementById('scanner-dashboard');
const parentDashboard = document.getElementById('parent-dashboard');
const loginBtn = document.getElementById('login-btn');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const userDisplay = document.getElementById('user-display');
const mainNav = document.getElementById('main-nav');

// --- PWA Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // IMPORTANT: Update this path to include your repository name if it's a Project Page
        // Based on your previous errors, your site is likely hosted at https://gu3sswh4t.github.io/ENTRIX/
        navigator.serviceWorker.register('/ENTRIX/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
}

// --- Display Dashboard based on Role ---
function showDashboard(role) {
    // Hide all main sections first
    loginSection.style.display = 'none';
    adminDashboard.style.display = 'none';
    scannerDashboard.style.display = 'none';
    parentDashboard.style.display = 'none';

    mainNav.innerHTML = ''; // Clear existing nav

    switch (role) {
        case 'admin':
            adminDashboard.style.display = 'block';
            mainNav.innerHTML = `
                <button onclick="showAdminSection('user')">Manage Users</button>
                <button onclick="showAdminSection('student')">Manage Students</button>
                <button onclick="showAdminSection('reports')">Reports</button>
            `;
            // Call admin specific initialization
            initAdminDashboard(); // This function should be in admin.js
            // By default, show the user management section first for admin
            showAdminSection('user');
            break;
        case 'scanner':
            scannerDashboard.style.display = 'block';
            // Call scanner specific initialization
            initScanner(); // This function should be in scanner.js
            break;
        case 'parent':
            parentDashboard.style.display = 'block';
            // Call parent specific initialization
            initParentDashboard(); // This function should be in parent.js
            break;
        default:
            loginSection.style.display = 'block';
            break;
    }
}

// --- Firebase Authentication State Change Listener ---
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in. Get their role.
        userDisplay.textContent = `Welcome, ${user.email}`;
        logoutBtn.style.display = 'inline-block';
        database.ref(`users/${user.uid}/role`).once('value', snapshot => {
            const role = snapshot.val();
            if (role) {
                showDashboard(role);
            } else {
                // This 'else' block executes if 'role' field is missing in Realtime DB for the user
                console.error("User role not found in Realtime Database. Forcing logout.");
                // Provide user feedback if needed, then sign out
                alert("Your user role is not assigned. Please contact support.");
                auth.signOut(); // Force logout if role is missing
            }
        });
    } else {
        // User is signed out.
        userDisplay.textContent = '';
        logoutBtn.style.display = 'none';
        // IMPORTANT: If scanner is running, stop it when user logs out
        if (typeof stopScanner === 'function') { // Check if stopScanner is available (from scanner.js)
            stopScanner();
        }
        showDashboard(null); // Show login page
    }
});

// --- Login / Logout Handlers ---
loginBtn.addEventListener('click', () => {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    // Clear previous errors
    loginError.textContent = '';
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            // Success handled by auth.onAuthStateChanged
            loginEmailInput.value = ''; // Clear fields on successful login
            loginPasswordInput.value = '';
        })
        .catch(error => {
            loginError.textContent = error.message;
            console.error("Login Error:", error.message);
        });
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// Helper for admin navigation (defined here for global access)
function showAdminSection(section) {
    // Hide all admin subsections first
    document.querySelectorAll('#admin-dashboard > .admin-subsection').forEach(div => {
        div.style.display = 'none';
    });
    // Show the requested section
    document.getElementById(`${section}-management`).style.display = 'block';
    // Special handling for reports as it's not '-management'
    if (section === 'reports') {
        document.getElementById('admin-reports').style.display = 'block';
    }
}

// Initial call to hide all dashboards on load before auth state is checked
document.addEventListener('DOMContentLoaded', () => {
    loginSection.style.display = 'none'; // Hide login initially to avoid flash
    adminDashboard.style.display = 'none';
    scannerDashboard.style.display = 'none';
    parentDashboard.style.display = 'none';
    // Firebase auth.onAuthStateChanged will determine what to show
});
