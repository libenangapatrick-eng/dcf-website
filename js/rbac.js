// ==========================================
// DCF MIS - ROLE BASED ACCESS CONTROL (RBAC)
// ==========================================

// 1. MCHANGANUO WA HAKI ZA KILA WADHIFA (PERMISSIONS MATRIX)
const ROLE_PERMISSIONS = {
    member: {
        create: 'own_only',         // Ya binafsi pekee (maombi/malipo)
        read: 'own_only',           // Kuona profaili na historia yake pekee
        update: 'profile_only',     // Kuhariri picha/anwani yake pekee
        delete: false,              // Kuzuia kufuta
        manage_users: false,        // Kuzuia usimamizi wa watumiaji
        audit_logs: false           // Kuzuia kumbukumbu za mfumo
    },
    staff: {
        create: true,               // Kuingiza miamala na usajili wa kila siku
        read: 'department_only',    // Kuona data za sekta/idara yake
        update: 'scoped',           // Kuhariri rekodi zilizo chini yake
        delete: false,              // Kuzuia kufuta (mabadiliko kwa Reversal/Admin)
        manage_users: false,        // Kuzuia
        audit_logs: false           // Kuzuia
    },
    auditor: {
        create: false,              // Kuzuia kuingiza data
        read: 'full_read_only',     // Kuona data zote (Read-Only)
        update: false,              // Kuzuia kubadilisha data
        delete: false,              // Kuzuia kufuta
        manage_users: false,        // Kuzuia
        audit_logs: true            // Kuona kumbukumbu za matendo (Audit Trail)
    },
    admin: {
        create: true,               // Kuruhusu kamili
        read: 'full',               // Kuruhusu kamili
        update: 'full',             // Kuruhusu kamili
        delete: 'soft_delete',      // Kufuta/kuficha (Soft Delete)
        manage_users: true,         // Kuruhusu kamili (Roles/Access/Lock Accounts)
        audit_logs: true            // Kuruhusu kamili (Settings, Backups, Audit Logs)
    }
};

// 2. KAGUA WADHIFA WA MTUMIAJI ALIYEYOINGIA
function getCurrentUserRole() {
    return sessionStorage.getItem('userRole') || 'guest';
}

function isLoggedIn() {
    return sessionStorage.getItem('userLoggedIn') === 'true';
}

// 3. ULINZI WA KURASA (PAGE GUARD)
// Weka function hii juu kabisa ya kurasa zako ili kuzuia asiye na haki asifungue ukurasa
function protectPage(allowedRoles = []) {
    if (!isLoggedIn()) {
        alert('⚠️ Lazima uingie kwenye mfumo kwanza!');
        window.location.href = window.location.pathname.includes('/pages/') ? '../login.html' : 'login.html';
        return;
    }

    const currentRole = getCurrentUserRole();
    if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
        alert('⛔ Huna mamlaka ya kufungua ukurasa huu!');
        
        // Mrejeshe sehemu sahihi kulingana na wadhifa wake
        if (currentRole === 'member') {
            window.location.href = window.location.pathname.includes('/pages/') ? 'members.html' : 'pages/members.html';
        } else {
            window.location.href = window.location.pathname.includes('/pages/') ? '../dashboard.html' : 'dashboard.html';
        }
    }
}

// 4. KUDHIBITI VITUFE NA SEHEMU ZA UKURASA (UI ENFORCEMENT)
function applyUIPermissions() {
    const userRole = getCurrentUserRole();
    const permissions = ROLE_PERMISSIONS[userRole] || {};

    // Ficha au onyesha element kulingana na 'data-permission'
    document.querySelectorAll('[data-permission]').forEach(element => {
        const requiredPermission = element.getAttribute('data-permission');
        const hasAccess = permissions[requiredPermission];

        if (!hasAccess || hasAccess === false) {
            element.style.display = 'none'; // Ficha kabisa
        }
    });

    // Ficha au onyesha element kulingana na wadhifa husika ('data-role')
    document.querySelectorAll('[data-role]').forEach(element => {
        const allowedRoles = element.getAttribute('data-role').split(',');
        if (!allowedRoles.includes(userRole)) {
            element.style.display = 'none';
        }
    });
}

// Tekeleza marekebisho ya UI mara tu ukurasa unapomaliza kuload
document.addEventListener('DOMContentLoaded', () => {
    applyUIPermissions();
});