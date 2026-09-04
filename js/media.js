// =========================================================
// DCCF ONLINE SYSTEM
// MEDIA GALLERY
// =========================================================

import { supabase } from "./supabase.js";


// =========================================================
// GLOBAL VARIABLES
// =========================================================

let allMedia = [];


// =========================================================
// LOAD MEDIA
// =========================================================

async function loadMedia() {

    const gallery = document.getElementById("mediaGallery");

    if (!gallery) return;

    gallery.innerHTML = `
        <div class="media-loading">
            <div class="spinner"></div>
            <p>Loading DCCF photos...</p>
        </div>
    `;


    const { data, error } = await supabase
        .from("media")
        .select("*")
        .eq("status", "Published")
        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(error);

        gallery.innerHTML = `
            <div class="media-error">
                <h3>Unable to load photos</h3>
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;

        return;
    }


    allMedia = data || [];

    updateStatistics();

    populateCategories();

    displayMedia(allMedia);
}


// =========================================================
// DISPLAY MEDIA
// =========================================================

function displayMedia(mediaList) {

    const gallery =
        document.getElementById("mediaGallery");

    if (!gallery) return;


    if (!mediaList.length) {

        gallery.innerHTML = `
            <div class="empty-media">
                <div class="empty-icon">📷</div>

                <h3>No photos found</h3>

                <p>
                    There are no photos matching your search.
                </p>
            </div>
        `;

        return;
    }


    gallery.innerHTML = mediaList.map(photo => {

        const downloadURL =
            photo.download_url || photo.image_url;


        return `

            <article class="media-card">

                <div class="media-image-wrapper">

                    <img
                        src="${escapeAttribute(photo.image_url)}"
                        alt="${escapeAttribute(photo.title)}"
                        class="media-image"
                        loading="lazy"
                        onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%23e9eeeb%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 font-size=%2220%22 fill=%22%23606b65%22%3EImage unavailable%3C/text%3E%3C/svg%3E'"
                    >

                    <span class="media-category">
                        ${escapeHTML(photo.category)}
                    </span>

                </div>


                <div class="media-card-content">

                    <h3>
                        ${escapeHTML(photo.title)}
                    </h3>


                    <p>
                        ${escapeHTML(
                            photo.description || "DCCF Media"
                        )}
                    </p>


                    <div class="media-date">

                        ${formatDate(photo.created_at)}

                    </div>


                    <div class="media-actions">

                        <button
                            class="btn-view"
                            onclick="window.viewMedia('${photo.id}')">

                            View

                        </button>


                        <a
                            class="btn-download"
                            href="${escapeAttribute(downloadURL)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            download>

                            ↓ Download

                        </a>

                    </div>

                </div>

            </article>

        `;

    }).join("");
}


// =========================================================
// VIEW MEDIA
// =========================================================

window.viewMedia = function(id) {

    const photo =
        allMedia.find(item => item.id === id);

    if (!photo) return;


    const modal =
        document.getElementById("mediaModal");

    const modalImage =
        document.getElementById("modalImage");

    const modalTitle =
        document.getElementById("modalTitle");

    const modalDescription =
        document.getElementById("modalDescription");

    const modalCategory =
        document.getElementById("modalCategory");

    const modalDownload =
        document.getElementById("modalDownload");


    modalImage.src = photo.image_url;

    modalImage.alt = photo.title;

    modalTitle.textContent = photo.title;

    modalDescription.textContent =
        photo.description || "";

    modalCategory.textContent =
        photo.category;

    modalDownload.href =
        photo.download_url || photo.image_url;


    modal.classList.add("active");

    document.body.classList.add("modal-open");
};


// =========================================================
// CLOSE MODAL
// =========================================================

window.closeMediaModal = function() {

    const modal =
        document.getElementById("mediaModal");

    if (!modal) return;

    modal.classList.remove("active");

    document.body.classList.remove("modal-open");

};


// =========================================================
// SEARCH
// =========================================================

function searchMedia() {

    const searchInput =
        document.getElementById("mediaSearch");

    const categoryFilter =
        document.getElementById("mediaCategory");


    const search =
        (searchInput?.value || "")
        .toLowerCase()
        .trim();


    const category =
        categoryFilter?.value || "all";


    const filtered =
        allMedia.filter(photo => {

            const matchesSearch =
                !search ||

                photo.title
                    .toLowerCase()
                    .includes(search)

                ||

                (photo.description || "")
                    .toLowerCase()
                    .includes(search)

                ||

                photo.category
                    .toLowerCase()
                    .includes(search);


            const matchesCategory =
                category === "all" ||
                photo.category === category;


            return (
                matchesSearch &&
                matchesCategory
            );

        });


    displayMedia(filtered);
}


// =========================================================
// CATEGORY FILTER
// =========================================================

function populateCategories() {

    const select =
        document.getElementById("mediaCategory");

    if (!select) return;


    const categories =
        [...new Set(
            allMedia.map(photo => photo.category)
        )];


    select.innerHTML = `
        <option value="all">
            All Categories
        </option>
    `;


    categories.forEach(category => {

        const option =
            document.createElement("option");

        option.value = category;

        option.textContent = category;

        select.appendChild(option);

    });
}


// =========================================================
// STATISTICS
// =========================================================

function updateStatistics() {

    const total =
        document.getElementById("totalPhotos");

    const categories =
        document.getElementById("totalCategories");


    if (total) {

        total.textContent =
            allMedia.length;

    }


    if (categories) {

        categories.textContent =
            new Set(
                allMedia.map(
                    item => item.category
                )
            ).size;

    }
}


// =========================================================
// FORMAT DATE
// =========================================================

function formatDate(date) {

    if (!date) return "";

    return new Date(date).toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =========================================================
// ESCAPE ATTRIBUTE
// =========================================================

function escapeAttribute(value) {

    if (!value) return "";

    return String(value)
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =========================================================
// EVENTS
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const search =
            document.getElementById("mediaSearch");

        const category =
            document.getElementById("mediaCategory");


        search?.addEventListener(
            "input",
            searchMedia
        );


        category?.addEventListener(
            "change",
            searchMedia
        );


        document.addEventListener(
            "keydown",
            event => {

                if (event.key === "Escape") {

                    window.closeMediaModal();

                }

            }
        );


        loadMedia();

    }
);