/* =========================================================
   DCF ONLINE SYSTEM
   DONATIONS MANAGEMENT
   CRUD + ROLE BASED ACCESS
   ADMIN / STAFF = FULL CRUD
   AUDITOR / MEMBER = READ ONLY (auditor allowed per page roles)
   ========================================================= */

/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let allDonations = [];
let currentRole = null;
let editingDonationId = null;

/* =========================================================
   ROLE MANAGEMENT
   ========================================================= */

function getCurrentRole() {
    return (
        sessionStorage.getItem('userRole') ||
        localStorage.getItem('userRole') ||
        ''
    ).toLowerCase().trim();
}

function getLoggedInStatus() {
    return (
        sessionStorage.getItem('userLoggedIn') ||
        localStorage.getItem('userLoggedIn')
    );
}

function isAdmin() {
    return currentRole === 'admin';
}

function isStaff() {
    return currentRole === 'staff';
}

function isAuditor() {
    return currentRole === 'auditor';
}

function isMember() {
    return currentRole === 'member';
}

function canCreate() {
    return isAdmin() || isStaff();
}

function canUpdate() {
    return isAdmin() || isStaff();
}

function canDelete() {
    return isAdmin() || isStaff();
}

/* =========================================================
   AUTHENTICATION
   ========================================================= */

function checkAuthentication() {

    const loggedIn = getLoggedInStatus();
    currentRole = getCurrentRole();

    if (!loggedIn || !currentRole) {
        window.location.href = '../login.html';
        return false;
    }

    const allowedRoles = ['admin', 'staff', 'auditor'];

    if (!allowedRoles.includes(currentRole)) {
        alert('Huna ruhusa ya kufungua ukurasa huu.');
        window.location.href = '../dashboard.html';
        return false;
    }

    return true;
}

/* =========================================================
   USER DISPLAY
   ========================================================= */

function displayCurrentUser() {

    const roleElement = document.getElementById('current-user-role');
    const nameElement = document.getElementById('current-user-name');
    const avatarElement = document.getElementById('user-avatar');
    const badge = document.getElementById('permission-badge');

    let displayRole = 'User';

    if (currentRole === 'admin') {
        displayRole = 'Administrator';
    } else if (currentRole === 'staff') {
        displayRole = 'Staff';
    } else if (currentRole === 'auditor') {
        displayRole = 'Auditor';
    } else if (currentRole === 'member') {
        displayRole = 'Member';
    }

    if (roleElement) {
        roleElement.textContent = displayRole;
    }

    const username =
        sessionStorage.getItem('userName') ||
        sessionStorage.getItem('username') ||
        localStorage.getItem('userName') ||
        localStorage.getItem('username') ||
        displayRole;

    if (nameElement) {
        nameElement.textContent = username;
    }

    if (avatarElement) {
        avatarElement.textContent = username.charAt(0).toUpperCase();
    }

    if (badge) {
        badge.textContent = `Role: ${displayRole}`;

        if (canCreate()) {
            badge.className =
                'text-xs font-bold px-3 py-1.5 rounded-full bg-green-100 text-green-700 w-fit';
        } else {
            badge.className =
                'text-xs font-bold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 w-fit';
        }
    }
}

/* =========================================================
   APPLY PERMISSIONS
   ========================================================= */

function applyPermissions() {

    const addButton = document.getElementById('add-donation-btn');

    if (!canCreate()) {
        if (addButton) {
            addButton.classList.add('permission-hidden');
        }
    } else {
        if (addButton) {
            addButton.classList.remove('permission-hidden');
        }
    }
}

/* =========================================================
   MODAL OPEN / CLOSE
   (openAddModal / closeModal already defined inline in
   donations.html — this file defines openEditModal and
   hooks the submit handler, and re-exposes helpers safely)
   ========================================================= */

function openEditModal(id) {

    if (!canUpdate()) {
        showPermissionMessage();
        return;
    }

    const donation = allDonations.find(
        item => String(item.id) === String(id)
    );

    if (!donation) {
        alert('Taarifa ya mchango haijapatikana.');
        return;
    }

    editingDonationId = id;

    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = value ?? '';
        }
    };

    set('donation_id', donation.id);
    set('existing_donor_id', donation.existing_donor_id);
    set('donation_reference', donation.donation_reference);

    const refDisplay = document.getElementById('donation-reference-display');
    if (refDisplay) {
        refDisplay.textContent = donation.donation_reference || 'Itatengenezwa na mfumo';
    }

    set('donor_type', donation.donor_type || 'Individual');
    set('donor_name', donation.donor_name);
    set('donor_id', donation.donor_id);
    set('donor_phone', donation.donor_phone);
    set('donor_email', donation.donor_email);
    set('donor_address', donation.donor_address);
    set('donor_country', donation.donor_country || 'Tanzania');
    set('donor_photo', donation.donor_photo);

    const photoPreview = document.getElementById('donor-photo-preview');
    if (photoPreview) {
        if (donation.donor_photo) {
            photoPreview.src = donation.donor_photo;
            photoPreview.style.display = 'block';
        } else {
            photoPreview.style.display = 'none';
        }
    }

    set('donation_date', donation.donation_date);
    set('donation_type', donation.donation_type);
    set('currency', donation.currency || 'TZS');
    set('amount', donation.amount);
    set('payment_reference', donation.payment_reference);
    set('payment_provider', donation.payment_provider);
    set('notes', donation.notes);

    set('allocation_type', donation.allocation_type);
    set('allocation_other', donation.allocation_other);
    set('project_id', donation.project_id);
    set('activity_id', donation.activity_id);

    set('item_name', donation.item_name);
    set('item_category', donation.item_category);
    set('item_quantity', donation.item_quantity);
    set('item_unit', donation.item_unit);
    set('estimated_value', donation.estimated_value);
    set('item_condition', donation.item_condition);
    set('date_received', donation.date_received);
    set('storage_location', donation.storage_location);
    set('item_description', donation.item_description);

    set('donation_status', donation.donation_status || 'Pending');
    set('verified_by', donation.verified_by);
    set('verification_date', donation.verification_date);
    set('receipt_number', donation.receipt_number);
    set('receipt_date', donation.receipt_date);

    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) {
        modalTitle.innerHTML =
            '<i class="fas fa-edit"></i> Hariri Taarifa ya Mchango';
    }

    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.innerHTML =
            '<i class="fas fa-check-circle mr-1"></i> Sasisha Mchango';
    }

    /* Update conditional UI sections to reflect loaded values */
    if (typeof window.updateDonationFormUI === 'function') {
        window.updateDonationFormUI();
    }

    const modal = document.getElementById('donation-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

/* =========================================================
   LOAD DONATIONS
   ========================================================= */

async function loadDonations() {

    const tableBody = document.getElementById('donations-table-body');
    const loader = document.getElementById('loading-indicator');

    if (loader) {
        loader.classList.remove('hidden');
    }

    try {

        const { data, error } = await supabase
            .from('donations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        allDonations = data || [];

        calculateMetrics(allDonations);
        renderTable(allDonations);

    } catch (error) {

        console.error('Error loading donations:', error);

        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="11" class="py-8 text-center text-red-600 font-bold">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Imeshindikana kupakia michango.
                        <div class="text-xs font-normal mt-2">
                            ${escapeHtml(error.message)}
                        </div>
                    </td>
                </tr>
            `;
        }

    } finally {

        if (loader) {
            loader.classList.add('hidden');
        }
    }
}

/* =========================================================
   CALCULATE METRICS
   ========================================================= */

function calculateMetrics(data) {

    let total = 0;
    let monthly = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    data.forEach(function (item) {

        const amount = Number(item.amount) || 0;
        total += amount;

        if (item.donation_date) {
            const date = new Date(item.donation_date + 'T00:00:00');
            if (
                date.getMonth() === currentMonth &&
                date.getFullYear() === currentYear
            ) {
                monthly += amount;
            }
        }
    });

    const totalEl = document.getElementById('total-donations');
    const monthlyEl = document.getElementById('monthly-donations');
    const countEl = document.getElementById('donation-count');

    if (totalEl) totalEl.innerText = `TZS ${formatNumber(total)}`;
    if (monthlyEl) monthlyEl.innerText = `TZS ${formatNumber(monthly)}`;
    if (countEl) countEl.innerText = data.length;
}

/* =========================================================
   RENDER TABLE
   ========================================================= */

function renderTable(data) {

    const tableBody = document.getElementById('donations-table-body');
    if (!tableBody) return;

    if (!data.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="11" class="py-8 text-center text-gray-500 italic">
                    <i class="fas fa-receipt text-2xl mb-2 block text-gray-300"></i>
                    Hakuna michango iliyorekodiwa bado.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = data.map(function (d) {
        return createDonationRow(d);
    }).join('');
}

/* =========================================================
   CREATE TABLE ROW
   ========================================================= */

function createDonationRow(d) {

    const donorName = d.donor_name || 'Donor';
    const encodedName = encodeURIComponent(donorName);
    const fallbackImage =
        `https://ui-avatars.com/api/?name=${encodedName}&background=174a35&color=fff`;

    const photoImg = d.donor_photo
        ? `
            <img
                src="${escapeAttribute(d.donor_photo)}"
                alt="Picha"
                class="w-9 h-9 rounded-full object-cover border border-gray-300 mx-auto"
                onerror="this.src='${fallbackImage}'"
            >
        `
        : `
            <img
                src="${fallbackImage}"
                alt="Picha"
                class="w-9 h-9 rounded-full border border-gray-300 mx-auto"
            >
        `;

    const statusColors = {
        'Pending': 'bg-yellow-100 text-yellow-700',
        'Verified': 'bg-blue-100 text-blue-700',
        'Received': 'bg-indigo-100 text-indigo-700',
        'Allocated': 'bg-purple-100 text-purple-700',
        'Used/Disbursed': 'bg-green-100 text-green-700'
    };

    const statusClass =
        statusColors[d.donation_status] || 'bg-gray-100 text-gray-700';

    const statusBadge = `
        <span class="text-[10px] font-bold px-2 py-1 rounded-full ${statusClass}">
            ${escapeHtml(d.donation_status || 'Pending')}
        </span>
    `;

    const actionButtons = canCreate()
        ? `
            <div class="flex items-center justify-center gap-1">
                <button
                    onclick="openEditModal('${escapeAttribute(d.id)}')"
                    class="action-btn bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                    title="Hariri"
                >
                    <i class="fas fa-edit"></i>
                </button>
                ${canDelete() ? `
                <button
                    onclick="deleteDonation('${escapeAttribute(d.id)}')"
                    class="action-btn bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                    title="Futa"
                >
                    <i class="fas fa-trash-alt"></i>
                </button>
                ` : ''}
            </div>
        `
        : `
            <span class="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                <i class="fas fa-eye"></i>
                Soma tu
            </span>
        `;

    return `
        <tr class="table-row border-b border-gray-100">
            <td class="py-2 px-3 border text-center">
                ${photoImg}
            </td>
            <td class="py-2.5 px-3 font-bold text-dcf-green border whitespace-nowrap">
                ${escapeHtml(d.receipt_number || d.donation_reference || '-')}
            </td>
            <td class="py-2.5 px-3 border font-bold text-gray-800">
                ${escapeHtml(d.donor_name || '-')}
            </td>
            <td class="py-2.5 px-3 border">
                ${escapeHtml(d.donor_id || '-')}
            </td>
            <td class="py-2.5 px-3 border">
                ${escapeHtml(d.donor_email || '-')}
            </td>
            <td class="py-2.5 px-3 border">
                ${escapeHtml(d.allocation_type || d.donation_type || '-')}
            </td>
            <td class="py-2.5 px-3 border font-bold text-gray-900 whitespace-nowrap">
                ${escapeHtml(d.currency || 'TZS')} ${formatNumber(d.amount)}
            </td>
            <td class="py-2.5 px-3 border">
                ${escapeHtml(d.donation_type || '-')}
            </td>
            <td class="py-2.5 px-3 border whitespace-nowrap">
                ${escapeHtml(d.donation_date || '-')}
            </td>
            <td class="py-2.5 px-3 border">
                ${statusBadge}
            </td>
            <td class="py-2.5 px-3 border text-center action-column">
                ${actionButtons}
            </td>
        </tr>
    `;
}

/* =========================================================
   SAVE / UPDATE DONATION
   ========================================================= */

async function saveDonation(event) {

    if (event) {
        event.preventDefault();
    }

    if (!canCreate()) {
        showPermissionMessage();
        return;
    }

    const saveBtn = document.getElementById('save-btn');

    const val = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    };

    const donorType = val('donor_type');
    const existingDonorId = val('existing_donor_id') || null;
    const donorName = val('donor_name');
    const donorId = val('donor_id') || null;
    const donorPhone = val('donor_phone') || null;
    const donorEmail = val('donor_email') || null;
    const donorAddress = val('donor_address') || null;
    const donorCountry = val('donor_country') || null;
    const donorPhoto = val('donor_photo') || null;

    const donationReference = val('donation_reference');
    const donationDate = val('donation_date');
    const donationType = val('donation_type');
    const currency = val('currency') || 'TZS';
    const amountRaw = val('amount');
    const amount = amountRaw ? parseFloat(amountRaw) : null;
    const paymentReference = val('payment_reference') || null;
    const paymentProvider = val('payment_provider') || null;
    const notes = val('notes') || null;

    const allocationType = val('allocation_type');
    const allocationOther = val('allocation_other') || null;
    const projectId = val('project_id') || null;
    const activityId = val('activity_id') || null;

    const isInKind = donationType === 'In-kind';

    const itemName = val('item_name') || null;
    const itemCategory = val('item_category') || null;
    const itemQuantityRaw = val('item_quantity');
    const itemQuantity = itemQuantityRaw ? parseFloat(itemQuantityRaw) : null;
    const itemUnit = val('item_unit') || null;
    const estimatedValueRaw = val('estimated_value');
    const estimatedValue = estimatedValueRaw ? parseFloat(estimatedValueRaw) : null;
    const itemCondition = val('item_condition') || null;
    const dateReceived = val('date_received') || null;
    const storageLocation = val('storage_location') || null;
    const itemDescription = val('item_description') || null;

    const donationStatus = val('donation_status') || 'Pending';
    const verifiedBy = val('verified_by') || null;
    const verificationDate = val('verification_date') || null;
    let receiptNumber = val('receipt_number') || null;
    const receiptDate = val('receipt_date') || null;

    /* ---------------- VALIDATION ---------------- */

    if (!donorType) {
        alert('Tafadhali chagua aina ya mchangiaji.');
        return;
    }

    if (!donorName) {
        alert('Tafadhali ingiza jina la mchangiaji.');
        return;
    }

    if (!donationDate) {
        alert('Tafadhali chagua tarehe ya mchango.');
        return;
    }

    if (!donationType) {
        alert('Tafadhali chagua aina ya mchango.');
        return;
    }

    if (!isInKind) {
        if (!amount || amount <= 0) {
            alert('Tafadhali ingiza kiasi sahihi cha mchango.');
            return;
        }
    } else {
        if (!itemName) {
            alert('Tafadhali ingiza jina la kitu (item) kilichotolewa.');
            return;
        }
        if (!itemQuantity || itemQuantity <= 0) {
            alert('Tafadhali ingiza kiasi (quantity) sahihi cha kitu.');
            return;
        }
    }

    if (!allocationType) {
        alert('Tafadhali chagua mahali mchango unapoelekezwa.');
        return;
    }

    if (
        (allocationType === 'Specific Project' || allocationType === 'Specific Activity') &&
        !projectId
    ) {
        alert('Tafadhali chagua project husika.');
        return;
    }

    if (allocationType === 'Specific Activity' && !activityId) {
        alert('Tafadhali chagua activity husika.');
        return;
    }

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = editingDonationId
            ? '<i class="fas fa-spinner fa-spin mr-1"></i> Inasasisha...'
            : '<i class="fas fa-spinner fa-spin mr-1"></i> Inahifadhi...';
    }

    try {

        const payload = {
            donation_reference: donationReference || null,

            donor_type: donorType,
            existing_donor_id: existingDonorId,
            donor_name: donorName,
            donor_id: donorId,
            donor_phone: donorPhone,
            donor_email: donorEmail,
            donor_address: donorAddress,
            donor_country: donorCountry,
            donor_photo: donorPhoto,

            donation_date: donationDate,
            donation_type: donationType,
            currency: currency,
            amount: isInKind ? (estimatedValue || 0) : amount,
            payment_reference: paymentReference,
            payment_provider: paymentProvider,
            notes: notes,

            allocation_type: allocationType,
            allocation_other: allocationOther,
            project_id: projectId,
            activity_id: activityId,

            item_name: itemName,
            item_category: itemCategory,
            item_quantity: itemQuantity,
            item_unit: itemUnit,
            estimated_value: estimatedValue,
            item_condition: itemCondition,
            date_received: dateReceived,
            storage_location: storageLocation,
            item_description: itemDescription,

            donation_status: donationStatus,
            verified_by: verifiedBy,
            verification_date: verificationDate,
            receipt_number: receiptNumber,
            receipt_date: receiptDate
        };

        /* ---------------- UPDATE ---------------- */

        if (editingDonationId) {

            const { error } = await supabase
                .from('donations')
                .update(payload)
                .eq('id', editingDonationId);

            if (error) {
                throw error;
            }

            toastOrAlert(
                'Imesasishwa',
                'Taarifa ya mchango imesasishwa kikamilifu.',
                'success'
            );

        /* ---------------- INSERT ---------------- */

        } else {

            if (!receiptNumber && donationStatus !== 'Pending') {
                receiptNumber = await generateReceiptNumber();
                payload.receipt_number = receiptNumber;
            }

            const { error } = await supabase
                .from('donations')
                .insert([payload]);

            if (error) {
                throw error;
            }

            toastOrAlert(
                'Imehifadhiwa',
                'Mchango umerekodiwa kikamilifu' +
                (receiptNumber ? `\n\nNamba ya Risiti: ${receiptNumber}` : '') +
                (donationReference ? `\nReference: ${donationReference}` : ''),
                'success'
            );
        }

        window.closeModal ? window.closeModal() : closeModalFallback();

        await loadDonations();

    } catch (error) {

        console.error('Donation save error:', error);

        toastOrAlert(
            'Kosa limetokea',
            error.message || 'Imeshindikana kuhifadhi mchango.',
            'error'
        );

    } finally {

        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = editingDonationId
                ? '<i class="fas fa-check-circle mr-1"></i> Sasisha Mchango'
                : '<i class="fas fa-check-circle mr-1"></i> Hifadhi Mchango';
        }
    }
}

/* =========================================================
   GENERATE RECEIPT NUMBER
   ========================================================= */

async function generateReceiptNumber() {

    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);

    return `REC-${year}-${random}`;
}

/* =========================================================
   DELETE DONATION
   ========================================================= */

async function deleteDonation(id) {

    if (!canDelete()) {
        showPermissionMessage();
        return;
    }

    const donation = allDonations.find(
        item => String(item.id) === String(id)
    );

    if (!donation) {
        alert('Taarifa ya mchango haijapatikana.');
        return;
    }

    const confirmed = confirm(
        `Je, una uhakika unataka kufuta taarifa hii?\n\n` +
        `Mchangiaji: ${donation.donor_name || '-'}\n` +
        `Risiti: ${donation.receipt_number || '-'}\n` +
        `Kiasi: ${donation.currency || 'TZS'} ${formatNumber(donation.amount)}\n\n` +
        `Kitendo hiki hakiwezi kutenduliwa.`
    );

    if (!confirmed) {
        return;
    }

    try {

        const { error } = await supabase
            .from('donations')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        toastOrAlert('Imefutwa', 'Mchango umefutwa kikamilifu.', 'success');

        await loadDonations();

    } catch (error) {

        console.error('Delete error:', error);

        toastOrAlert(
            'Kosa la kufuta',
            error.message || 'Imeshindikana kufuta mchango.',
            'error'
        );
    }
}

/* =========================================================
   SEARCH + FILTER
   ========================================================= */

function filterDonations() {

    const searchInput = document.getElementById('search-input');
    const typeFilter = document.getElementById('type-filter');

    const searchVal = (searchInput?.value || '').toLowerCase().trim();
    const typeVal = typeFilter?.value || 'ALL';

    const filtered = allDonations.filter(function (d) {

        const donorName = (d.donor_name || '').toLowerCase();
        const donorIdVal = (d.donor_id || '').toLowerCase();
        const email = (d.donor_email || '').toLowerCase();
        const phone = (d.donor_phone || '').toLowerCase();
        const receiptNo = (d.receipt_number || '').toLowerCase();

        const matchesSearch =
            !searchVal ||
            donorName.includes(searchVal) ||
            donorIdVal.includes(searchVal) ||
            email.includes(searchVal) ||
            phone.includes(searchVal) ||
            receiptNo.includes(searchVal);

        const matchesType =
            typeVal === 'ALL' ||
            d.allocation_type === typeVal ||
            d.donation_type === typeVal;

        return matchesSearch && matchesType;
    });

    renderTable(filtered);
}

/* =========================================================
   PERMISSION MESSAGE
   ========================================================= */

function showPermissionMessage() {
    alert(
        'Huna ruhusa ya kufanya kitendo hiki.\n\n' +
        'Huna ruhusa ya kuandika au kuhariri taarifa za michango.'
    );
}

/* =========================================================
   TOAST / ALERT FALLBACK
   ========================================================= */

function toastOrAlert(title, message, type) {

    const el = document.getElementById('toast');

    if (!el) {
        alert(`${title}\n\n${message}`);
        return;
    }

    const titleEl = document.getElementById('toast-title');
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    el.className = 'toast ' + (type || 'success') + ' show';

    if (iconEl) {
        iconEl.className =
            type === 'error'
                ? 'fas fa-exclamation-triangle mt-0.5'
                : 'fas fa-check-circle mt-0.5';
    }

    setTimeout(() => {
        el.classList.remove('show');
    }, 4000);
}

/* =========================================================
   MODAL CLOSE FALLBACK
   (only used if the inline closeModal from donations.html
   is somehow unavailable)
   ========================================================= */

function closeModalFallback() {
    const modal = document.getElementById('donation-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    editingDonationId = null;
}

/* =========================================================
   FORMAT NUMBER
   ========================================================= */

function formatNumber(value) {
    const number = Number(value) || 0;
    return number.toLocaleString('en-US');
}

/* =========================================================
   HTML SECURITY
   ========================================================= */

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return '';
    }
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

/* =========================================================
   KEYBOARD / SEARCH / SUBMIT EVENTS
   ========================================================= */

function initializeEvents() {

    const searchInput = document.getElementById('search-input');
    const typeFilter = document.getElementById('type-filter');

    if (searchInput) {
        searchInput.addEventListener('input', filterDonations);
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', filterDonations);
    }

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            window.closeModal ? window.closeModal() : closeModalFallback();
        }
    });

    const modal = document.getElementById('donation-modal');

    if (modal) {
        modal.addEventListener('click', function (event) {
            if (event.target === modal) {
                window.closeModal ? window.closeModal() : closeModalFallback();
            }
        });
    }

    /* FORM SUBMIT — this is the critical wiring that was missing */
    const form = document.getElementById('donation-form');

    if (form) {
        form.addEventListener('submit', saveDonation);
    }

    /* Reset editingDonationId when Add (not Edit) is opened */
    const addBtn = document.getElementById('add-donation-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function () {
            editingDonationId = null;
        });
    }
}

/* =========================================================
   INITIALIZE SYSTEM
   ========================================================= */

document.addEventListener('DOMContentLoaded', async function () {

    const authenticated = checkAuthentication();

    if (!authenticated) {
        return;
    }

    displayCurrentUser();
    applyPermissions();
    initializeEvents();

    await loadDonations();
});

/* =========================================================
   PUBLIC EXPORTS
   ========================================================= */

window.openEditModal = openEditModal;
window.deleteDonation = deleteDonation;
window.saveDonation = saveDonation;
window.filterDonations = filterDonations;
window.printDonations = window.printDonations || function () {
    window.print();
};