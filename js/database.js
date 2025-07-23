// Data structure in Firebase Realtime Database:
// /students: { studentId: { name: "...", qrCode: "...", parentEmail: "..." } }
// /scanLogs: {
//   "scan_id_1": { studentId: "...", timestamp: "...", type: "IN/OUT" },
//   "scan_id_2": { ... }
// }

// Function to add/update student
async function saveStudent(studentId, name, parentEmail) {
    try {
        await database.ref(`students/${studentId}`).set({
            name: name,
            parentEmail: parentEmail,
            qrCode: studentId // Assuming QR code content is the student ID
        });
        console.log(`Student ${name} (${studentId}) saved.`);
        return true;
    } catch (error) {
        console.error("Error saving student:", error);
        return false;
    }
}

// Function to get a student by ID
async function getStudent(studentId) {
    try {
        const snapshot = await database.ref(`students/${studentId}`).once('value');
        return snapshot.val();
    } catch (error) {
        console.error("Error getting student:", error);
        return null;
    }
}

// Function to log a scan event (IN/OUT)
async function logScan(studentId, type) {
    const timestamp = new Date().toISOString();
    const scanRef = database.ref('scanLogs').push(); // Generate unique key
    const scanId = scanRef.key;

    try {
        await scanRef.set({
            studentId: studentId,
            timestamp: timestamp,
            type: type // 'IN' or 'OUT'
        });
        console.log(`Scan logged for ${studentId}: ${type} at ${timestamp}`);

        // Call the data retention function
        manageScanLogRetention();
        return { success: true, timestamp: timestamp };
    } catch (error) {
        console.error("Error logging scan:", error);
        return { success: false, error: error.message };
    }
}

// Function to get scan history for a student (e.g., for Parent Dashboard)
async function getStudentScanHistory(studentId) {
    try {
        const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
        const snapshot = await database.ref('scanLogs')
            .orderByChild('studentId')
            .equalTo(studentId)
            .orderByChild('timestamp')
            .startAt(fifteenDaysAgo) // Only fetch relevant recent data
            .once('value');
        const logs = [];
        snapshot.forEach(childSnapshot => {
            logs.push(childSnapshot.val());
        });
        return logs;
    } catch (error) {
        console.error("Error fetching student scan history:", error);
        return [];
    }
}

// --- Data Retention Logic (called after each scan) ---
async function manageScanLogRetention() {
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    try {
        const snapshot = await database.ref('scanLogs')
            .orderByChild('timestamp')
            .endAt(fifteenDaysAgo.toISOString())
            .once('value');

        const updates = {};
        snapshot.forEach(childSnapshot => {
            // Mark for deletion by setting to null
            updates[childSnapshot.key] = null;
        });

        if (Object.keys(updates).length > 0) {
            await database.ref('scanLogs').update(updates);
            console.log(`Deleted ${Object.keys(updates).length} old scan logs.`);
        } else {
            console.log("No old scan logs to delete.");
        }
    } catch (error) {
        console.error("Error managing scan log retention:", error);
    }
}

// Optional: Function to get all students (for Admin Dashboard)
async function getAllStudents() {
    try {
        const snapshot = await database.ref('students').once('value');
        const students = [];
        snapshot.forEach(childSnapshot => {
            students.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        return students;
    } catch (error) {
        console.error("Error getting all students:", error);
        return [];
    }
}

// Optional: Function to get all users (for Admin Dashboard)
async function getAllUsers() {
    try {
        const snapshot = await database.ref('users').once('value');
        const users = [];
        snapshot.forEach(childSnapshot => {
            users.push({ uid: childSnapshot.key, ...childSnapshot.val() });
        });
        return users;
    } catch (error) {
        console.error("Error getting all users:", error);
        return [];
    }
}

// Export functions if using modules (for simplicity in this example, they are global)
// export { saveStudent, getStudent, logScan, getStudentScanHistory, getAllStudents, getAllUsers };