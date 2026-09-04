/* ============================================================
   DCF MIS - SECURE PAGE ROLE GUARD
   STEP 3
   ============================================================ */

(function () {
    "use strict";

    const ROLES = {
        ADMIN: "admin",
        STAFF: "staff",
        AUDITOR: "auditor",
        MEMBER: "member"
    };

    const ROLE_NAMES = {
        admin: "ADMINISTRATOR",
        staff: "STAFF",
        auditor: "AUDITOR",
        member: "MEMBER"
    };


    /* =========================================================
       SUPABASE CLIENT
       ========================================================= */

    function getClient() {

        if (window.supabaseClient) {
            return window.supabaseClient;
        }

        if (window._supabase) {
            return window._supabase;
        }

        console.error(
            "DCF MIS: Supabase client haijapatikana."
        );

        return null;
    }


    /* =========================================================
       GET SESSION
       ========================================================= */

    async function getSession() {

        const client = getClient();

        if (!client) {
            return null;
        }

        try {

            const result =
                await client.auth.getSession();

            return result?.data?.session || null;

        } catch (error) {

            console.error(
                "DCF MIS Session Error:",
                error
            );

            return null;
        }
    }


    /* =========================================================
       GET ROLE DIRECTLY FROM SUPABASE
       ========================================================= */

    async function getRole() {

        const client = getClient();

        if (!client) {
            return null;
        }

        const session =
            await getSession();

        if (!session?.user?.id) {
            return null;
        }

        try {

            const {
                data,
                error
            } = await client
                .from("profiles")
                .select("id, full_name, role")
                .eq("id", session.user.id)
                .maybeSingle();

            if (error) {

                console.error(
                    "DCF MIS Role Error:",
                    error
                );

                return null;
            }

            const role =
                String(data?.role || "")
                    .trim()
                    .toLowerCase();

            if (
                !Object.values(ROLES)
                    .includes(role)
            ) {

                console.error(
                    "DCF MIS: Invalid role:",
                    role
                );

                return null;
            }

            return role;

        } catch (error) {

            console.error(
                "DCF MIS Role Exception:",
                error
            );

            return null;
        }
    }


    /* =========================================================
       LOGIN REDIRECT
       ========================================================= */

    function redirectToLogin() {

        const path =
            window.location.pathname;

        if (
            path.includes("/pages/")
        ) {

            window.location.replace(
                "../login.html"
            );

        } else {

            window.location.replace(
                "login.html"
            );
        }
    }


    /* =========================================================
       DASHBOARD REDIRECT
       ========================================================= */

    function redirectAfterDenied(role) {

        const path =
            window.location.pathname;

        if (role === ROLES.MEMBER) {

            if (
                path.includes("/pages/")
            ) {

                window.location.replace(
                    "member-portal.html"
                );

            } else {

                window.location.replace(
                    "pages/member-portal.html"
                );
            }

            return;
        }


        if (
            path.includes("/pages/")
        ) {

            window.location.replace(
                "../dashboard.html"
            );

        } else {

            window.location.replace(
                "dashboard.html"
            );
        }
    }


    /* =========================================================
       ACCESS DENIED SCREEN
       ========================================================= */

    function showAccessDenied(role) {

        document.body.innerHTML = `

            <div style="
                min-height:100vh;
                display:flex;
                align-items:center;
                justify-content:center;
                background:#f8fafc;
                padding:20px;
                font-family:Arial,sans-serif;
            ">

                <div style="
                    max-width:520px;
                    width:100%;
                    background:#ffffff;
                    padding:40px 30px;
                    border-radius:18px;
                    text-align:center;
                    box-shadow:0 15px 45px rgba(0,0,0,.12);
                ">

                    <div style="
                        width:75px;
                        height:75px;
                        margin:0 auto 20px;
                        border-radius:50%;
                        background:#fee2e2;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:34px;
                    ">
                        🔒
                    </div>

                    <h1 style="
                        margin:0 0 12px;
                        font-size:27px;
                        color:#111827;
                    ">
                        Access Denied
                    </h1>

                    <p style="
                        color:#6b7280;
                        line-height:1.7;
                        margin-bottom:25px;
                    ">
                        Huna ruhusa ya kufungua ukurasa huu.
                    </p>

                    <p style="
                        font-size:13px;
                        color:#374151;
                        margin-bottom:25px;
                    ">
                        Role yako:
                        <strong>
                            ${ROLE_NAMES[role] || role}
                        </strong>
                    </p>

                    <button
                        id="dcfAccessBack"
                        style="
                            border:none;
                            background:#166534;
                            color:white;
                            padding:12px 25px;
                            border-radius:9px;
                            cursor:pointer;
                            font-weight:bold;
                        "
                    >
                        ← Rudi
                    </button>

                </div>

            </div>
        `;

        document
            .getElementById("dcfAccessBack")
            ?.addEventListener(
                "click",
                function () {
                    redirectAfterDenied(role);
                }
            );
    }


    /* =========================================================
       CHECK PAGE PERMISSION
       ========================================================= */

    async function protectCurrentPage() {

        const session =
            await getSession();

        if (!session) {

            redirectToLogin();

            return false;
        }


        const role =
            await getRole();

        if (!role) {

            const client =
                getClient();

            if (client) {
                await client.auth.signOut();
            }

            redirectToLogin();

            return false;
        }


        /*
         * Store only as convenience.
         * DATABASE remains the source of truth.
         */

        sessionStorage.setItem(
            "userRole",
            role
        );

        sessionStorage.setItem(
            "userId",
            session.user.id
        );


        window.DCF_USER_ROLE =
            role;


        const body =
            document.body;


        /*
         * Read allowed roles from:
         *
         * <body data-allowed-roles="admin,staff">
         */

        const allowedString =
            body.dataset.allowedRoles;


        if (allowedString) {

            const allowedRoles =
                allowedString
                    .split(",")
                    .map(
                        value =>
                            value
                                .trim()
                                .toLowerCase()
                    )
                    .filter(Boolean);


            if (
                !allowedRoles.includes(role)
            ) {

                showAccessDenied(role);

                return false;
            }
        }


        /*
         * Add role class
         */

        body.classList.add(
            "dcf-role-" + role
        );


        /*
         * Show current role
         */

        document
            .querySelectorAll(
                "[data-current-role]"
            )
            .forEach(
                element => {

                    element.textContent =
                        ROLE_NAMES[role] || role;

                }
            );


        /*
         * ROLE-BASED ELEMENTS
         */

        document
            .querySelectorAll(
                "[data-role]"
            )
            .forEach(
                element => {

                    const allowed =
                        element
                            .dataset
                            .role
                            .split(",")
                            .map(
                                value =>
                                    value
                                        .trim()
                                        .toLowerCase()
                            );

                    if (
                        !allowed.includes(role)
                    ) {

                        element.remove();

                    }

                }
            );


        /*
         * PERMISSION-BASED ELEMENTS
         */

        const permissions = {

            admin: [
                "view",
                "create",
                "edit",
                "delete",
                "approve",
                "export",
                "manage_users",
                "manage_roles",
                "audit"
            ],

            staff: [
                "view",
                "create",
                "edit",
                "export"
            ],

            auditor: [
                "view",
                "export",
                "audit"
            ],

            member: [
                "view_own",
                "edit_own"
            ]

        };


        document
            .querySelectorAll(
                "[data-permission]"
            )
            .forEach(
                element => {

                    const permission =
                        element
                            .dataset
                            .permission;

                    if (
                        !permissions[role]
                            ?.includes(permission)
                    ) {

                        element.remove();

                    }

                }
            );


        /*
         * MEMBER / AUDITOR:
         * Hide common mutation controls.
         */

        if (
            role === ROLES.MEMBER ||
            role === ROLES.AUDITOR
        ) {

            document
                .querySelectorAll(
                    ".edit-only, " +
                    ".delete-only, " +
                    ".add-only, " +
                    ".admin-only, " +
                    "[data-action='create'], " +
                    "[data-action='edit'], " +
                    "[data-action='delete'], " +
                    "[data-action='approve']"
                )
                .forEach(
                    element => {

                        element.remove();

                    }
                );
        }


        /*
         * AUDITOR:
         * Extra protection for forms.
         */

        if (
            role === ROLES.AUDITOR
        ) {

            document
                .querySelectorAll(
                    "form.data-entry-form"
                )
                .forEach(
                    form => {

                        form.remove();

                    }
                );
        }


        /*
         * MEMBER:
         * Remove management navigation.
         */

        if (
            role === ROLES.MEMBER
        ) {

            document
                .querySelectorAll(
                    ".management-only, " +
                    ".admin-only, " +
                    "[data-management-only]"
                )
                .forEach(
                    element => {

                        element.remove();

                    }
                );
        }


        return true;
    }


    /* =========================================================
       PUBLIC API
       ========================================================= */

    window.DCF_ROLE_GUARD = {

        roles: ROLES,

        getSession,

        getRole,

        protect:
            protectCurrentPage

    };


    /* =========================================================
       AUTO START
       ========================================================= */

    document.addEventListener(
        "DOMContentLoaded",
        async function () {

            await protectCurrentPage();

        }
    );

})();