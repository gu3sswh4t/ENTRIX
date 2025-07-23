// Ensure firebase.functions() is initialized globally or passed in if using modules.
// In app.js, we declared 'const functions = firebase.functions();'
// This means 'functions' should be accessible here if app.js is loaded first.

// DOM elements for Admin Dashboard user management
const addUserForm = document.getElementById('add-user-form');
const newUserEmailInput = document.getElementById('new-user-email');
const newUserPasswordInput = document.getElementById('new-user-password');
const newUserRoleSelect = document.getElementById('new-user-role');
const newUserStudentIdInput = document.getElementById('new-user-student-id');
const addUserStatus = document.getElementById('add-user-status');
const userList = document.getElementById('user-list');

// DOM elements for Admin Dashboard student management
const addStudentForm = document.getElementById('add-student-form'); // Assuming you have this form in index.html now
const studentIdInput = document.getElementById('student-id');
const studentNameInput = document.getElementById('student-name');
const studentParentEmailInput = document.getElementById('student-parent-email');
const studentList = document.getElementById('student-list');

function initAdminDashboard() {
    console.log("Admin Dashboard initialized.");
    // Display users and students on load
    displayUsers();
    displayStudents();
    // Set up all event listeners for admin functionality
    setupAdminEventListeners();
}

function setupAdminEventListeners() {
    // Event listener for adding a new user
    if (addUserForm) {
        addUserForm.addEventListener('submit', handleAddUser);
    }

    // Event listener to show/hide Student ID input based on role selection
    if (newUserRoleSelect) {
        newUserRoleSelect.addEventListener('change', () => {
            if (newUserRoleSelect.value === 'parent') {
                newUserStudentIdInput.style.display = 'block';
                newUserStudentIdInput.setAttribute('required', 'true'); // Make required for parents
            } else {
                newUserStudentIdInput.style.display = 'none';
                newUserStudentIdInput.removeAttribute('required');
                newUserStudentIdInput.value = ''; // Clear student ID if role changes
            }
        });
    }

    // Event listener for adding a new student (assuming you implement this next)
    if (addStudentForm) {
        addStudentForm.addEventListener('submit', handleAddStudent);
    }
}

// Handler for adding a new user via Cloud Function
async function handleAddUser(e) {
    e.preventDefault(); // Prevent default form submission
    addUserStatus.textContent = 'Adding user...';
    addUserStatus.classList.remove('error-status'); // Clear previous error styling

    const email = newUserEmailInput.value;
    const password = newUserPasswordInput.value;
    const role = newUserRoleSelect.value;
    // studentId is only relevant if role is 'parent'
    const studentId = (role === 'parent') ? newUserStudentIdInput.value.trim() : '';

    // Get a reference to the callable Cloud Function (initialized in app.js)
    // The 'functions' variable should be globally available due to its declaration in app.js
    const createUserFunction = functions.httpsCallable('createUserWithRole');

    try {
        // Call the Cloud Function with user data
        const result = await createUserFunction({ email, password, role, studentId });
        console.log('Cloud Function Result:', result.data); // Log the response from the function

        if (result.data.success) {
            addUserStatus.textContent = `User ${result.data.email} added successfully!`;
            addUserStatus.classList.remove('error-status'); // Ensure green color

            // Reset form fields
            addUserForm.reset();
            newUserStudentIdInput.style.display = 'none'; // Hide student ID input again
            newUserStudentIdInput.removeAttribute('required');

            // Refresh the user list to show the newly added user
            displayUsers();
        } else {
            // This part handles errors returned by the Cloud Function itself (e.g., validation errors)
            addUserStatus.textContent = `Error: ${result.data.message || 'Unknown error occurred in function.'}`;
            addUserStatus.classList.add('error-status');
        }

    } catch (error) {
        // This catches errors in calling the Cloud Function (network, permission, etc.)
        console.error("Error calling Cloud Function:", error);
        let errorMessage = 'An unexpected error occurred.';
        if (error.code) {
            errorMessage = `Error (${error.code}): ${error.message}`;
        } else {
            errorMessage = `Error: ${error.message}`;
        }
        addUserStatus.textContent = `Error adding user: ${errorMessage}`;
        addUserStatus.classList.add('error-status');
    }
}

// Function to display existing users from Firebase Realtime Database
async function displayUsers() {
    if (!userList) return; // Exit if element doesn't exist
    userList.innerHTML = '<li>Loading users...</li>'; // Show loading state

    try {
        const users = await getAllUsers(); // This function should be in database.js
        userList.innerHTML = ''; // Clear loading state
        if (users.length === 0) {
            userList.innerHTML = '<li>No users found.</li>';
            return;
        }
        // Sort users alphabetically by email for better readability
        users.sort((a, b) => a.email.localeCompare(b.email));

        users.forEach(user => {
            const li = document.createElement('li');
            // Display email, role, and studentId if available for parents
            let userInfo = `${user.email} (Role: ${user.role || 'N/A'})`;
            if (user.role === 'parent' && user.studentId) {
                userInfo += ` - Student ID: ${user.studentId}`;
            }
            li.textContent = userInfo;
            userList.appendChild(li);
        });
    } catch (error) {
        console.error("Error fetching users for display:", error);
        userList.innerHTML = '<li style="color:var(--accent-color);">Error loading users. Please check console.</li>';
    }
}

// Handler for adding a new student (implementation details will be in database.js)
async function handleAddStudent(e) {
    e.preventDefault();
    const sId = studentIdInput.value.trim();
    const sName = studentNameInput.value.trim();
    const sParentEmail = studentParentEmailInput.value.trim();

    if (!sId || !sName) {
        alert("Student ID and Name are required.");
        return;
    }

    try {
        // saveStudent function should be in database.js
        const success = await saveStudent(sId, sName, sParentEmail);
        if (success) {
            alert('Student added successfully!');
            addStudentForm.reset();
            displayStudents(); // Refresh the student list
        } else {
            alert('Failed to add student. See console for details.');
        }
    } catch (error) {
        console.error("Error adding student:", error);
        alert('An error occurred while adding student.');
    }
}

// Function to display existing students from Firebase Realtime Database
async function displayStudents() {
    if (!studentList) return;
    studentList.innerHTML = '<li>Loading students...</li>';

    try {
        const students = await getAllStudents(); // This function should be in database.js
        studentList.innerHTML = '';
        if (students.length === 0) {
            studentList.innerHTML = '<li>No students found.</li>';
            return;
        }
        // Sort students alphabetically by name
        students.sort((a, b) => a.name.localeCompare(b.name));

        students.forEach(student => {
            const li = document.createElement('li');
            li.textContent = `${student.name} (ID: ${student.id})` + (student.parentEmail ? ` - Parent: ${student.parentEmail}` : '');
            studentList.appendChild(li);
        });
    } catch (error) {
        console.error("Error fetching students for display:", error);
        studentList.innerHTML = '<li style="color:var(--accent-color);">Error loading students. Please check console.</li>';
    }
}


// (No changes needed for showAdminSection itself, as it's defined in app.js and uses the correct element IDs)
// However, if you had a previous showAdminSection here, remove it to avoid conflicts.
