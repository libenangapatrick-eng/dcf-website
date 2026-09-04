/* =========================================================
   DCF GLOBAL LANGUAGE SYSTEM
   Version: 1.0
   Languages:
   - Swahili (sw)
   - English (en)
========================================================= */

(function () {

    "use strict";

    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const STORAGE_KEY = "dcf_language";
    const DEFAULT_LANGUAGE = "sw";

    const SUPPORTED_LANGUAGES = {
        sw: {
            name: "Kiswahili",
            short: "SW",
            flag: "🇹🇿",
            direction: "ltr"
        },

        en: {
            name: "English",
            short: "EN",
            flag: "🇬🇧",
            direction: "ltr"
        }
    };


    /* =====================================================
       TRANSLATIONS
    ===================================================== */

    const TRANSLATIONS = {

        sw: {

            /* General */
            "common.dashboard": "Dashibodi",
            "common.home": "Mwanzo",
            "common.save": "Hifadhi",
            "common.cancel": "Ghairi",
            "common.close": "Funga",
            "common.delete": "Futa",
            "common.edit": "Hariri",
            "common.update": "Sasisha",
            "common.add": "Ongeza",
            "common.create": "Unda",
            "common.search": "Tafuta",
            "common.filter": "Chuja",
            "common.refresh": "Onyesha upya",
            "common.view": "Angalia",
            "common.details": "Maelezo",
            "common.submit": "Wasilisha",
            "common.confirm": "Thibitisha",
            "common.back": "Rudi",
            "common.next": "Endelea",
            "common.previous": "Nyuma",
            "common.loading": "Inapakia...",
            "common.yes": "Ndiyo",
            "common.no": "Hapana",
            "common.all": "Zote",
            "common.status": "Hali",
            "common.date": "Tarehe",
            "common.time": "Muda",
            "common.name": "Jina",
            "common.email": "Barua pepe",
            "common.phone": "Namba ya simu",

            /* Authentication */
            "auth.login": "Ingia",
            "auth.logout": "Ondoka",
            "auth.username": "Barua pepe",
            "auth.password": "Nenosiri",
            "auth.remember": "Nikumbuke",
            "auth.forgotPassword": "Umesahau nenosiri?",
            "auth.signIn": "Ingia kwenye mfumo",
            "auth.register": "Jisajili",
            "auth.createAccount": "Fungua akaunti",

            /* Navigation */
            "nav.dashboard": "Dashibodi",
            "nav.members": "Wanachama",
            "nav.users": "Watumiaji",
            "nav.donations": "Michango",
            "nav.projects": "Miradi",
            "nav.events": "Matukio",
            "nav.media": "Maktaba ya Picha",
            "nav.reports": "Ripoti",
            "nav.auditTrail": "Audit Trail",
            "nav.settings": "Mipangilio",
            "nav.profile": "Wasifu",

            /* Members */
            "members.title": "Usimamizi wa Wanachama",
            "members.add": "Ongeza Mwanachama",
            "members.memberId": "Namba ya Mwanachama",
            "members.fullName": "Majina Kamili",
            "members.gender": "Jinsia",
            "members.dob": "Tarehe ya Kuzaliwa",
            "members.occupation": "Kazi",
            "members.nationality": "Uraia",
            "members.address": "Anwani",

            /* Donations */
            "donations.title": "Usimamizi wa Michango",
            "donations.add": "Sajili Mchango",
            "donations.amount": "Kiasi",
            "donations.currency": "Sarafu",
            "donations.type": "Aina ya Mchango",
            "donations.date": "Tarehe ya Mchango",
            "donations.reference": "Namba ya Kumbukumbu",
            "donations.description": "Maelezo",

            /* Projects */
            "projects.title": "Usimamizi wa Miradi",
            "projects.add": "Ongeza Mradi",
            "projects.name": "Jina la Mradi",
            "projects.description": "Maelezo ya Mradi",
            "projects.startDate": "Tarehe ya Kuanza",
            "projects.endDate": "Tarehe ya Kumalizika",

            /* Reports */
            "reports.title": "Ripoti",
            "reports.generate": "Tengeneza Ripoti",
            "reports.download": "Pakua Ripoti",
            "reports.print": "Chapisha",

            /* Settings */
            "settings.title": "Mipangilio",
            "settings.language": "Lugha",
            "settings.selectLanguage": "Chagua Lugha",

            /* Messages */
            "message.success": "Operesheni imefanikiwa.",
            "message.error": "Kuna tatizo limetokea.",
            "message.saved": "Taarifa zimehifadhiwa.",
            "message.deleted": "Taarifa zimefutwa.",
            "message.noData": "Hakuna taarifa zilizopatikana.",

            /* System */
            "system.languageChanged": "Lugha imebadilishwa kuwa Kiswahili."
        },


        en: {

            /* General */
            "common.dashboard": "Dashboard",
            "common.home": "Home",
            "common.save": "Save",
            "common.cancel": "Cancel",
            "common.close": "Close",
            "common.delete": "Delete",
            "common.edit": "Edit",
            "common.update": "Update",
            "common.add": "Add",
            "common.create": "Create",
            "common.search": "Search",
            "common.filter": "Filter",
            "common.refresh": "Refresh",
            "common.view": "View",
            "common.details": "Details",
            "common.submit": "Submit",
            "common.confirm": "Confirm",
            "common.back": "Back",
            "common.next": "Next",
            "common.previous": "Previous",
            "common.loading": "Loading...",
            "common.yes": "Yes",
            "common.no": "No",
            "common.all": "All",
            "common.status": "Status",
            "common.date": "Date",
            "common.time": "Time",
            "common.name": "Name",
            "common.email": "Email",
            "common.phone": "Phone",

            /* Authentication */
            "auth.login": "Login",
            "auth.logout": "Logout",
            "auth.username": "Email",
            "auth.password": "Password",
            "auth.remember": "Remember me",
            "auth.forgotPassword": "Forgot password?",
            "auth.signIn": "Sign in",
            "auth.register": "Register",
            "auth.createAccount": "Create account",

            /* Navigation */
            "nav.dashboard": "Dashboard",
            "nav.members": "Members",
            "nav.users": "Users",
            "nav.donations": "Donations",
            "nav.projects": "Projects",
            "nav.events": "Events",
            "nav.media": "Media Library",
            "nav.reports": "Reports",
            "nav.auditTrail": "Audit Trail",
            "nav.settings": "Settings",
            "nav.profile": "Profile",

            /* Members */
            "members.title": "Member Management",
            "members.add": "Add Member",
            "members.memberId": "Member ID",
            "members.fullName": "Full Name",
            "members.gender": "Gender",
            "members.dob": "Date of Birth",
            "members.occupation": "Occupation",
            "members.nationality": "Nationality",
            "members.address": "Address",

            /* Donations */
            "donations.title": "Donation Management",
            "donations.add": "Register Donation",
            "donations.amount": "Amount",
            "donations.currency": "Currency",
            "donations.type": "Donation Type",
            "donations.date": "Donation Date",
            "donations.reference": "Reference Number",
            "donations.description": "Description",

            /* Projects */
            "projects.title": "Project Management",
            "projects.add": "Add Project",
            "projects.name": "Project Name",
            "projects.description": "Project Description",
            "projects.startDate": "Start Date",
            "projects.endDate": "End Date",

            /* Reports */
            "reports.title": "Reports",
            "reports.generate": "Generate Report",
            "reports.download": "Download Report",
            "reports.print": "Print",

            /* Settings */
            "settings.title": "Settings",
            "settings.language": "Language",
            "settings.selectLanguage": "Select Language",

            /* Messages */
            "message.success": "Operation completed successfully.",
            "message.error": "An error occurred.",
            "message.saved": "Information saved successfully.",
            "message.deleted": "Information deleted successfully.",
            "message.noData": "No information found.",

            /* System */
            "system.languageChanged": "Language changed to English."
        }

    };


    /* =====================================================
       GET CURRENT LANGUAGE
    ===================================================== */

    function getLanguage() {

        const savedLanguage =
            localStorage.getItem(STORAGE_KEY);

        if (
            savedLanguage &&
            SUPPORTED_LANGUAGES[savedLanguage]
        ) {
            return savedLanguage;
        }

        const browserLanguage =
            (navigator.language || "").toLowerCase();

        if (browserLanguage.startsWith("sw")) {
            return "sw";
        }

        if (browserLanguage.startsWith("en")) {
            return "en";
        }

        return DEFAULT_LANGUAGE;
    }


    /* =====================================================
       TRANSLATION FUNCTION
    ===================================================== */

    function translate(key, fallback = "") {

        const language = getLanguage();

        return (
            TRANSLATIONS[language]?.[key] ??
            TRANSLATIONS[DEFAULT_LANGUAGE]?.[key] ??
            fallback ??
            key
        );
    }


    /* =====================================================
       APPLY TRANSLATIONS
    ===================================================== */

    function applyTranslations() {

        const language = getLanguage();

        document.documentElement.lang = language;

        document.documentElement.dir =
            SUPPORTED_LANGUAGES[language].direction;


        /* ---------------------------------------------
           Normal text
        --------------------------------------------- */

        document
            .querySelectorAll("[data-i18n]")
            .forEach(element => {

                const key =
                    element.getAttribute("data-i18n");

                const translation =
                    translate(key);

                if (translation) {
                    element.textContent = translation;
                }
            });


        /* ---------------------------------------------
           Placeholder
        --------------------------------------------- */

        document
            .querySelectorAll("[data-i18n-placeholder]")
            .forEach(element => {

                const key =
                    element.getAttribute(
                        "data-i18n-placeholder"
                    );

                element.placeholder =
                    translate(key);
            });


        /* ---------------------------------------------
           Title
        --------------------------------------------- */

        document
            .querySelectorAll("[data-i18n-title]")
            .forEach(element => {

                const key =
                    element.getAttribute(
                        "data-i18n-title"
                    );

                element.title =
                    translate(key);
            });


        /* ---------------------------------------------
           ARIA label
        --------------------------------------------- */

        document
            .querySelectorAll("[data-i18n-aria-label]")
            .forEach(element => {

                const key =
                    element.getAttribute(
                        "data-i18n-aria-label"
                    );

                element.setAttribute(
                    "aria-label",
                    translate(key)
                );
            });


        /* ---------------------------------------------
           Update language selector
        --------------------------------------------- */

        const selector =
            document.getElementById(
                "dcfLanguageSelector"
            );

        if (selector) {
            selector.value = language;
        }
    }


    /* =====================================================
       CHANGE LANGUAGE
    ===================================================== */

    function setLanguage(language) {

        if (!SUPPORTED_LANGUAGES[language]) {
            language = DEFAULT_LANGUAGE;
        }

        localStorage.setItem(
            STORAGE_KEY,
            language
        );

        applyTranslations();

        document.dispatchEvent(
            new CustomEvent(
                "dcfLanguageChanged",
                {
                    detail: {
                        language: language
                    }
                }
            )
        );
    }


    /* =====================================================
       CREATE GLOBAL LANGUAGE SELECTOR
    ===================================================== */

    function createLanguageSelector() {

        if (
            document.getElementById(
                "dcfLanguageSelector"
            )
        ) {
            return;
        }

        const wrapper =
            document.createElement("div");

        wrapper.id =
            "dcfLanguageSwitcher";

        wrapper.style.cssText = `
            position: fixed;
            top: 18px;
            right: 20px;
            z-index: 99999;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 5px 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        `;


        const selector =
            document.createElement("select");

        selector.id =
            "dcfLanguageSelector";

        selector.setAttribute(
            "aria-label",
            "Select language"
        );

        selector.style.cssText = `
            border: none;
            outline: none;
            background: transparent;
            font-size: 14px;
            font-weight: 600;
            color: #174a35;
            cursor: pointer;
            padding: 4px;
        `;


        Object.entries(
            SUPPORTED_LANGUAGES
        ).forEach(
            ([code, language]) => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value = code;

                option.textContent =
                    `${language.flag} ${language.name}`;

                selector.appendChild(option);
            }
        );


        selector.value =
            getLanguage();


        selector.addEventListener(
            "change",
            function () {

                setLanguage(
                    this.value
                );

            }
        );


        wrapper.appendChild(selector);

        document.body.appendChild(wrapper);
    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    function initializeDCFLanguage() {

        applyTranslations();

        createLanguageSelector();

        applyTranslations();
    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.DCF_I18N = {

        getLanguage,

        setLanguage,

        translate,

        t: translate,

        applyTranslations,

        languages:
            SUPPORTED_LANGUAGES

    };


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeDCFLanguage
        );

    } else {

        initializeDCFLanguage();

    }

})();