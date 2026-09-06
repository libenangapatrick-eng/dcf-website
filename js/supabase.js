/**
 * DCF MIS — SUPABASE CENTRAL CONNECTION
 * =====================================================================
 * Version: 2.3.0 (Enhanced Security, PKCE Support, Turnstile-aware
 * password reset, and shared member/session helpers)
 * =====================================================================
 */

/* =====================================================================
   SUPABASE PROJECT CONFIGURATION
   ===================================================================== */
const SUPABASE_URL = "https://fcjvvfbaqnaohbtbljui.supabase.co";
const SUPABASE_KEY = "sb_publishable_iSG3Vea2d4Fq1evF2fvbnw_0ri5huMQ";

/* =====================================================================
   VERIFY SUPABASE LIBRARY
   ===================================================================== */
if (
    typeof window === "undefined" ||
    typeof window.supabase === "undefined" ||
    typeof window.supabase.createClient !== "function"
) {
    const errorMsg = "DCF MIS: Supabase JS library (@supabase/supabase-js@2) haijapakiwa kabla ya js/supabase.js";
    console.error(errorMsg);
    throw new Error(errorMsg);
}

/* Save reference to CDN Library function before binding globally */
const _supabaseCDN = window.supabase;

/* =====================================================================
   PREVENT DUPLICATE CLIENT
   ===================================================================== */
let _dcfSupabaseClient;

if (window.__DCF_SUPABASE_CLIENT__) {
    _dcfSupabaseClient = window.__DCF_SUPABASE_CLIENT__;
} else {
    /* ================================================================
       CREATE CENTRAL SUPABASE CLIENT
       ================================================================ */
    _dcfSupabaseClient = _supabaseCDN.createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                flowType: "pkce" // Imerekebishwa kutoka implicit kwenda pkce kwa usalama zaidi
            }
        }
    );

    window.__DCF_SUPABASE_CLIENT__ = _dcfSupabaseClient;
}

/* =====================================================================
   GLOBAL CLIENT ALIASES
   ===================================================================== */
window.supabaseClient = _dcfSupabaseClient;
window._supabase = _dcfSupabaseClient;

// Hakikisha window.supabase pia inatumika kama Client Instance kwa HTML zote zilizopo
window.supabase = _dcfSupabaseClient;

/* =====================================================================
   PASSWORD RECOVERY GLOBAL STATE
   ===================================================================== */
if (!window.dcfPasswordRecovery) {
    window.dcfPasswordRecovery = {
        ready: false,
        session: null,
        user: null,
        event: null
    };
}

/* =====================================================================
   SUPABASE AUTH STATE LISTENER
   ===================================================================== */
if (!window.__DCF_SUPABASE_AUTH_LISTENER__) {
    window.__DCF_SUPABASE_AUTH_LISTENER__ = true;

    _dcfSupabaseClient.auth.onAuthStateChange((event, session) => {
        console.log("DCF Supabase Auth Event:", event);

        window.dcfPasswordRecovery.event = event;

        switch (event) {
            case "PASSWORD_RECOVERY":
                window.dcfPasswordRecovery.ready = true;
                window.dcfPasswordRecovery.session = session || null;
                window.dcfPasswordRecovery.user = session?.user || null;
                console.log("DCF Password Recovery Session Ready:", !!session);
                break;

            case "SIGNED_IN":
            case "TOKEN_REFRESHED":
            case "USER_UPDATED":
                window.dcfPasswordRecovery.session = session || null;
                window.dcfPasswordRecovery.user = session?.user || null;
                break;

            case "SIGNED_OUT":
                window.dcfPasswordRecovery.ready = false;
                window.dcfPasswordRecovery.session = null;
                window.dcfPasswordRecovery.user = null;
                break;
        }
    });
}

/* =====================================================================
   HELPERS — AUTHENTICATION & SESSIONS
   ===================================================================== */

// 1. Get Current Session
window.dcfGetSupabaseSession = async function () {
    try {
        const { data, error } = await _dcfSupabaseClient.auth.getSession();
        if (error) throw error;

        const session = data?.session || null;
        if (session) {
            window.dcfPasswordRecovery.session = session;
            window.dcfPasswordRecovery.user = session.user || null;
        }
        return session;
    } catch (error) {
        console.error("DCF Supabase getSession error:", error);
        throw error;
    }
};

// 2. Get Current User
window.dcfGetSupabaseUser = async function () {
    try {
        const { data, error } = await _dcfSupabaseClient.auth.getUser();
        if (error) throw error;

        const user = data?.user || null;
        if (user) {
            window.dcfPasswordRecovery.user = user;
        }
        return user;
    } catch (error) {
        console.error("DCF Supabase getUser error:", error);
        throw error;
    }
};

// 3. Send Password Reset Email
//    NOTE: If Cloudflare Turnstile / Captcha protection is enabled on
//    your Supabase Auth project (Authentication → Settings → Bot and
//    Abuse Protection), resetPasswordForEmail REQUIRES a captchaToken
//    or it will be rejected. Pass the Turnstile token as the second
//    argument so pages that already render a Turnstile widget
//    (like login.html) can supply it.
window.dcfSendPasswordReset = async function (email, captchaToken) {
    const cleanEmail = String(email || "").trim();
    if (!cleanEmail) {
        throw new Error("Tafadhali weka anwani yako ya barua pepe (email).");
    }

    // Inatengeneza URL salama ya kurudi bila kujali folder/path iliyopo
    const baseUrl = window.location.origin;
    const redirectTo = `${baseUrl}/reset-password.html`;

    console.log("DCF Password Reset Redirect Target:", redirectTo);

    const options = { redirectTo: redirectTo };

    if (captchaToken) {
        options.captchaToken = captchaToken;
    }

    const { data, error } = await _dcfSupabaseClient.auth.resetPasswordForEmail(
        cleanEmail,
        options
    );

    if (error) {
        console.error("DCF Password Reset Error:", error);
        throw error;
    }

    console.log("DCF Password Reset Email Sent Successfully.");
    return data;
};

// 4. Check Recovery Session
window.dcfIsPasswordRecoveryReady = async function () {
    try {
        const session = await window.dcfGetSupabaseSession();
        return !!(session && session.user);
    } catch (error) {
        console.error("DCF Recovery Session Check Error:", error);
        return false;
    }
};

// 5. Update Password
window.dcfUpdatePassword = async function (newPassword) {
    if (!newPassword || String(newPassword).length < 6) {
        throw new Error("Nenosiri lazima liwe na angalau herufi au namba 6.");
    }

    const session = await window.dcfGetSupabaseSession();
    if (!session || !session.user) {
        throw new Error(
            "Recovery session haipo au link imekwisha muda wake. Tafadhali omba link mpya."
        );
    }

    console.log("DCF Updating Supabase Auth password...");

    const { data, error } = await _dcfSupabaseClient.auth.updateUser({
        password: newPassword
    });

    if (error) {
        console.error("DCF Password Update Error:", error);
        throw error;
    }

    console.log("DCF Password Updated Successfully.");
    return data;
};

// 6. Sign Out
window.dcfSupabaseSignOut = async function () {
    const { error } = await _dcfSupabaseClient.auth.signOut();
    if (error) {
        console.error("DCF Supabase SignOut Error:", error);
        throw error;
    }

    window.dcfPasswordRecovery = {
        ready: false,
        session: null,
        user: null,
        event: "SIGNED_OUT"
    };

    return true;
};

/* =====================================================================
   HELPERS — MEMBER PROFILE SHORTCUTS
   =====================================================================
   These mirror the logic used in login.html so any page can reuse
   them without duplicating queries against the "members" table.
   ===================================================================== */

// 7. Fetch the members row linked to a given auth user (or null)
window.dcfFindMemberForUser = async function (user) {
    if (!user || !user.id) {
        return null;
    }

    try {
        const { data, error } = await _dcfSupabaseClient
            .from("members")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

        if (error) {
            console.error("DCF Find Member Error:", error);
            return null;
        }

        return data || null;
    } catch (error) {
        console.error("DCF Find Member Error:", error);
        return null;
    }
};

// 8. Check whether a members row has all mandatory fields filled in
window.dcfIsMemberComplete = function (member) {
    if (!member) {
        return false;
    }

    const requiredFields = [
        "full_name", "gender", "dob", "phone",
        "nationality", "country", "address", "member_type"
    ];

    for (const field of requiredFields) {
        if (!member[field]) {
            return false;
        }
    }

    if (member.nationality === "Tanzanian" && !member.nida_no) {
        return false;
    }

    if (member.nationality === "Non-Tanzanian" && !member.passport_no) {
        return false;
    }

    if (!member.passport_image_url) {
        return false;
    }

    return true;
};

// 9. Fetch the profiles row (id, full_name, role) for a given user id
window.dcfGetProfile = async function (userId) {
    if (!userId) {
        return null;
    }

    try {
        const { data, error } = await _dcfSupabaseClient
            .from("profiles")
            .select("id, full_name, role")
            .eq("id", userId)
            .maybeSingle();

        if (error) {
            console.error("DCF Get Profile Error:", error);
            throw error;
        }

        return data || null;
    } catch (error) {
        console.error("DCF Get Profile Error:", error);
        throw error;
    }
};

/* =====================================================================
   INITIALIZATION STATUS REPORT
   ===================================================================== */
console.log("============================================================");
console.log("DCF MIS — SUPABASE INITIALIZED SUCCESSFULLY");
console.log("URL:", SUPABASE_URL);
console.log("Client Aliases Ready:", !!window.supabaseClient && !!window._supabase && !!window.supabase);
console.log("Flow Type:", "PKCE (Secure Flow)");
console.log("============================================================");