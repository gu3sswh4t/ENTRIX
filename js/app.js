// Firebase configuration
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
    loginSection.style.display = 'none';
    adminDashboard.style.display = 'none';
    scannerDashboard.style.display = 'none';
    parentDashboard.style.display = 'none';

    mainNav.innerHTML = ''; // Clear existing nav

    switch (role) {
        case 'admin':
            adminDashboard.style.display = 'block';
            mainNav.innerHTML = `
                <button onclick="showAdminSection('users')">Manage Users</button>
                <button onclick="showAdminSection('students')">Manage Students</button>
                <button onclick="showAdminSection('reports')">Reports</button>
            `;
            // Call admin specific initialization
            initAdminDashboard();
            break;
        case 'scanner':
            scannerDashboard.style.display = 'block';
            // Call scanner specific initialization
            initScanner();
            break;
        case 'parent':
            parentDashboard.style.display = 'block';
            // Call parent specific initialization
            initParentDashboard();
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
                // Default to a guest view or show error if role is not set
                console.error("User role not found.");
                auth.signOut(); // Force logout if role is missing
            }
        });
    } else {
        // User is signed out.
        userDisplay.textContent = '';
        logoutBtn.style.display = 'none';
        showDashboard(null); // Show login
    }
});

// --- Login / Logout Handlers (basic, will be in auth.js) ---
loginBtn.addEventListener('click', () => {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            loginError.textContent = '';
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
    document.querySelectorAll('#admin-dashboard > div').forEach(div => div.style.display = 'none');
    document.getElementById(`${section}-management` || `${section}-reports`).style.display = 'block'; // Adjust for reports
}

// Initial call to hide all dashboards
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard.style.display = 'none';
    scannerDashboard.style.display = 'none';
    parentDashboard.style.display = 'none';
});
