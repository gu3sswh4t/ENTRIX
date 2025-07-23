// DOM elements for Parent Dashboard
const childAttendanceDiv = document.getElementById('child-attendance');
const currentParentStudentId = ''; // This should be populated when parent logs in

function initParentDashboard() {
    console.log("Parent Dashboard initialized.");
    // Get the current logged-in user's UID
    const user = auth.currentUser;
    if (user) {
        // Fetch the studentId linked to this parent's account
        database.ref(`users/${user.uid}/studentId`).once('value', async snapshot => {
            const studentId = snapshot.val();
            if (studentId) {
                currentParentStudentId = studentId; // Store it
                displayChildAttendance(studentId);
            } else {
                childAttendanceDiv.innerHTML = '<p>No student linked to this parent account.</p>';
            }
        });
    } else {
        childAttendanceDiv.innerHTML = '<p>Please log in to view attendance.</p>';
    }
}

async function displayChildAttendance(studentId) {
    childAttendanceDiv.innerHTML = '<h3>Loading Attendance...</h3>';
    const scanHistory = await getStudentScanHistory(studentId); // Function from database.js

    if (scanHistory.length === 0) {
        childAttendanceDiv.innerHTML = '<p>No attendance records found for your child in the last 15 days.</p>';
        return;
    }

    const ul = document.createElement('ul');
    // Sort by timestamp descending
    scanHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    scanHistory.forEach(scan => {
        const li = document.createElement('li');
        li.textContent = `${new Date(scan.timestamp).toLocaleString()} - Type: ${scan.type}`;
        ul.appendChild(li);
    });
    childAttendanceDiv.innerHTML = ''; // Clear loading message
    childAttendanceDiv.appendChild(ul);
}