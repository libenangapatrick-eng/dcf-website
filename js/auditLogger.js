// Function ya kurekodi tukio lolote kwenye mfumo
function logAuditEvent(action, details = '') {
    const currentUser = sessionStorage.getItem('username') || 'Unknown User';
    const userRole = sessionStorage.getItem('userRole') || 'Guest';

    const newLog = {
        id: Date.now(),
        timestamp: new Date().toLocaleString('sw-TZ', { dateStyle: 'short', timeStyle: 'medium' }),
        user: currentUser,
        role: userRole.toUpperCase(),
        action: action,
        details: details
    };

    // Hifadhi kwenye localStorage (au Tuma kwenye Database)
    let logs = JSON.parse(localStorage.getItem('systemAuditLogs')) || [];
    logs.unshift(newLog); // Weka log mpya juu kabisa
    localStorage.setItem('systemAuditLogs', JSON.stringify(logs));
}