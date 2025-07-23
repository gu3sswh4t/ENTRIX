let html5QrCode;
const scanStatusElement = document.getElementById('scan-status');
const scannedStudentName = document.getElementById('scanned-student-name');
const scannedStudentId = document.getElementById('scanned-student-id');
const scannedStudentStatus = document.getElementById('scanned-student-status');
const scannedStudentTime = document.getElementById('scanned-student-time');

function initScanner() {
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("qr-reader");
    }

    const qrCodeSuccessCallback = async (decodedText, decodedResult) => {
        // Handle the scanned data
        console.log(`QR Code matched = ${decodedText}`, decodedResult);
        scanStatusElement.textContent = `Scanned: ${decodedText}`;

        const studentId = decodedText; // Assuming QR code is student ID

        // Check if student exists
        const student = await getStudent(studentId);

        if (student) {
            // Determine IN/OUT status
            // Get last scan for this student
            const studentLogs = await getStudentScanHistory(studentId);
            const lastLog = studentLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

            let scanType = 'IN'; // Default to IN
            if (lastLog && lastLog.type === 'IN') {
                scanType = 'OUT'; // If last scan was IN, next is OUT
            }

            const logResult = await logScan(studentId, scanType);

            if (logResult.success) {
                scannedStudentName.textContent = student.name;
                scannedStudentId.textContent = studentId;
                scannedStudentStatus.textContent = scanType;
                scannedStudentTime.textContent = new Date(logResult.timestamp).toLocaleString();
                scanStatusElement.textContent = `Scan successful for ${student.name} (${scanType})`;
            } else {
                scanStatusElement.textContent = `Error logging scan: ${logResult.error}`;
            }

        } else {
            scanStatusElement.textContent = `Student with ID ${studentId} not found!`;
            scannedStudentName.textContent = 'N/A';
            scannedStudentId.textContent = studentId;
            scannedStudentStatus.textContent = 'N/A';
            scannedStudentTime.textContent = 'N/A';
        }
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
        .catch(err => {
            console.error(`Unable to start scanning: ${err}`);
            scanStatusElement.textContent = `Error starting scanner: ${err}`;
        });
}

// Function to stop scanner when leaving the dashboard (important for camera release)
function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(ignore => {
            console.log("QR Code scanning stopped.");
        }).catch(err => {
            console.error("Failed to stop QR Code scanning.", err);
        });
    }
}

// Ensure scanner stops when user logs out or switches dashboard
auth.onAuthStateChanged(user => {
    if (!user || userDisplay.textContent === '') { // If user logs out or initial state
        stopScanner();
    }
});