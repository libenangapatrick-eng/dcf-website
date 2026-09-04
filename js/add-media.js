import { supabase } from "./supabase.js";

const form = document.getElementById("mediaForm");
const accessDenied = document.getElementById("accessDenied");
const message = document.getElementById("message");

const titleInput = document.getElementById("title");
const categoryInput = document.getElementById("category");
const descriptionInput = document.getElementById("description");

const photoFileInput = document.getElementById("photoFile");
const imageUrlInput = document.getElementById("image_url");
const downloadUrlInput = document.getElementById("download_url");

const statusInput = document.getElementById("status");

const imagePreview = document.getElementById("imagePreview");
const imageUrlStatus = document.getElementById("imageUrlStatus");

const saveButton = document.getElementById("saveButton");
const clearButton = document.getElementById("clearButton");


// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(text, type) {
    if (!message) return;
    message.textContent = text;
    message.className = "message " + type;
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// =====================================================
// CHECK LOGIN
// =====================================================

async function checkUser() {
    try {
        const {
            data: { user },
            error
        } = await supabase.auth.getUser();

        if (error || !user) {
            if (form) form.style.display = "none";
            if (accessDenied) {
                accessDenied.style.display = "flex";
                const p = accessDenied.querySelector("p");
                if (p) p.textContent = "Please login before adding a photo.";
            }
            return false;
        }

        if (form) form.style.display = "block";
        if (accessDenied) accessDenied.style.display = "none";
        return true;
    } catch (error) {
        console.error(error);
        if (form) form.style.display = "none";
        if (accessDenied) accessDenied.style.display = "flex";
        return false;
    }
}


// =====================================================
// IMAGE URL VALIDATION
// =====================================================

function isValidImageUrl(url) {
    try {
        const parsed = new URL(url);
        return (
            parsed.protocol === "https:" ||
            parsed.protocol === "http:"
        );
    } catch {
        return false;
    }
}


// =====================================================
// IMAGE PREVIEW (URL)
// =====================================================

function showImagePreview(url) {
    if (!imagePreview) return;

    if (!url) {
        imagePreview.innerHTML = `
            <div class="preview-placeholder">
                Paste an image URL or select a file
                and the preview will appear here.
            </div>
        `;
        if (imageUrlStatus) imageUrlStatus.textContent = "";
        return;
    }

    if (!isValidImageUrl(url)) {
        imagePreview.innerHTML = `
            <div class="preview-error">
                Invalid image URL.
                Please enter a valid HTTPS image link.
            </div>
        `;
        if (imageUrlStatus) {
            imageUrlStatus.textContent = "✕ Invalid URL";
            imageUrlStatus.className = "url-status url-invalid";
        }
        return;
    }

    if (imageUrlStatus) {
        imageUrlStatus.textContent = "Checking image...";
        imageUrlStatus.className = "url-status";
    }

    imagePreview.innerHTML = "";

    const img = document.createElement("img");
    img.src = url;
    img.alt = "Photo Preview";

    img.onload = function () {
        if (imageUrlStatus) {
            imageUrlStatus.textContent = "✓ Image URL is valid";
            imageUrlStatus.className = "url-status url-valid";
        }
    };

    img.onerror = function () {
        if (imageUrlStatus) {
            imageUrlStatus.textContent = "✕ This link does not appear to be a direct image";
            imageUrlStatus.className = "url-status url-invalid";
        }
        imagePreview.innerHTML = `
            <div class="preview-error">
                Unable to load this image.
                <br><br>
                Make sure you pasted a direct image URL,
                for example .jpg, .jpeg, .png or .webp.
            </div>
        `;
    };

    imagePreview.appendChild(img);
}


// =====================================================
// FILE INPUT EVENT LISTENER
// =====================================================

if (photoFileInput) {
    photoFileInput.addEventListener("change", function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                if (imagePreview) {
                    imagePreview.innerHTML = `<img src="${evt.target.result}" alt="Preview" style="width:100%; max-height:300px; object-fit:cover;">`;
                }
            }
            reader.readAsDataURL(file);
            // Safisha sehemu ya URL kama amechagua faili kutoka kwenye kifaa
            if (imageUrlInput) imageUrlInput.value = "";
            if (imageUrlStatus) imageUrlStatus.textContent = "";
        }
    });
}


// =====================================================
// IMAGE URL INPUT LISTENER
// =====================================================

if (imageUrlInput) {
    imageUrlInput.addEventListener("input", function () {
        const url = imageUrlInput.value.trim();
        showImagePreview(url);
        // Safisha faili lililochaguliwa kama kaweka link
        if (photoFileInput) photoFileInput.value = "";
    });
}


// =====================================================
// DOWNLOAD URL BLUR
// =====================================================

if (imageUrlInput && downloadUrlInput) {
    imageUrlInput.addEventListener("blur", function () {
        const imageUrl = imageUrlInput.value.trim();
        const downloadUrl = downloadUrlInput.value.trim();

        if (imageUrl && !downloadUrl) {
            downloadUrlInput.value = imageUrl;
        }
    });
}


// =====================================================
// FORM SUBMIT (Inashughulikia Faili au Link)
// =====================================================

if (form) {
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = "Saving...";
        }

        try {
            const {
                data: { user },
                error: userError
            } = await supabase.auth.getUser();

            if (userError || !user) {
                throw new Error("You must login before adding a photo.");
            }

            const title = titleInput ? titleInput.value.trim() : "";
            const category = categoryInput ? categoryInput.value : "";
            const description = descriptionInput ? descriptionInput.value.trim() : "";
            let downloadUrl = downloadUrlInput ? downloadUrlInput.value.trim() : "";
            const status = statusInput ? statusInput.value : "Published";

            // ==========================================
            // VALIDATION
            // ==========================================

            if (!title) {
                throw new Error("Please enter the photo title.");
            }

            if (!category) {
                throw new Error("Please select a category.");
            }

            let finalImageUrl = "";

            const hasFile = photoFileInput && photoFileInput.files.length > 0;
            const hasUrl = imageUrlInput && imageUrlInput.value.trim() !== "";

            if (!hasFile && !hasUrl) {
                throw new Error("Please upload an image file or enter an Image URL.");
            }

            // KAMA AMETOA FAIL KUTOKA KWENYE KIFAA -> PAKIA SUPABASE STORAGE
            if (hasFile) {
                const file = photoFileInput.files[0];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                const folderName = category.toLowerCase(); // Folda inatengenezwa kulingana na Category
                const filePath = `${folderName}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('media-bucket') // Hakikisha bucket hii ipandishwe kwenye Supabase yako
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // Pata Public URL ya Faili lililopakiwa
                const { data: urlData } = supabase.storage
                    .from('media-bucket')
                    .getPublicUrl(filePath);

                finalImageUrl = urlData.publicUrl;

            } else {
                // KAMA AMETUMIA LINK YA KAWAIDA (URL)
                finalImageUrl = imageUrlInput.value.trim();
                if (!isValidImageUrl(finalImageUrl)) {
                    throw new Error("Please enter a valid Image URL.");
                }
            }

            // Auto download URL kama haipo
            if (!downloadUrl) {
                downloadUrl = finalImageUrl;
            }

            // ==========================================
            // SAVE TO DATABASE (Table ya 'media')
            // ==========================================

            const { data, error } = await supabase
                .from("media")
                .insert([{
                    title: title,
                    category: category,
                    description: description || null,
                    image_url: finalImageUrl,
                    download_url: downloadUrl,
                    status: status,
                    user_id: user.id
                }])
                .select();

            if (error) {
                console.error(error);
                throw new Error(error.message);
            }

            // ==========================================
            // SUCCESS
            // ==========================================

            showMessage("✓ Photo saved successfully.", "success");

            form.reset();
            if (photoFileInput) photoFileInput.value = "";
            
            if (imagePreview) {
                imagePreview.innerHTML = `
                    <div class="preview-placeholder">
                        Paste an image URL or select a file
                        and the preview will appear here.
                    </div>
                `;
            }

            if (imageUrlStatus) imageUrlStatus.textContent = "";

            console.log("Photo saved:", data);

        } catch (error) {
            console.error(error);
            showMessage("Error: " + error.message, "error");
        } finally {
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = "Save Photo";
            }
        }
    });
}


// =====================================================
// CLEAR BUTTON
// =====================================================

if (clearButton) {
    clearButton.addEventListener("click", function () {
        setTimeout(() => {
            if (imagePreview) {
                imagePreview.innerHTML = `
                    <div class="preview-placeholder">
                        Paste an image URL or select a file
                        and the preview will appear here.
                    </div>
                `;
            }
            if (imageUrlStatus) imageUrlStatus.textContent = "";
            if (photoFileInput) photoFileInput.value = "";
        }, 50);
    });
}


// =====================================================
// START
// =====================================================

checkUser();import { supabase } from "./supabase.js";

const form = document.getElementById("mediaForm");
const accessDenied = document.getElementById("accessDenied");
const message = document.getElementById("message");

const titleInput = document.getElementById("title");
const categoryInput = document.getElementById("category");
const descriptionInput = document.getElementById("description");

const photoFileInput = document.getElementById("photoFile");
const imageUrlInput = document.getElementById("image_url");
const downloadUrlInput = document.getElementById("download_url");

const statusInput = document.getElementById("status");

const imagePreview = document.getElementById("imagePreview");
const imageUrlStatus = document.getElementById("imageUrlStatus");

const saveButton = document.getElementById("saveButton");
const clearButton = document.getElementById("clearButton");


// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(text, type) {
    if (!message) return;
    message.textContent = text;
    message.className = "message " + type;
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// =====================================================
// CHECK LOGIN
// =====================================================

async function checkUser() {
    try {
        const {
            data: { user },
            error
        } = await supabase.auth.getUser();

        if (error || !user) {
            if (form) form.style.display = "none";
            if (accessDenied) {
                accessDenied.style.display = "flex";
                const p = accessDenied.querySelector("p");
                if (p) p.textContent = "Please login before adding a photo.";
            }
            return false;
        }

        if (form) form.style.display = "block";
        if (accessDenied) accessDenied.style.display = "none";
        return true;
    } catch (error) {
        console.error(error);
        if (form) form.style.display = "none";
        if (accessDenied) accessDenied.style.display = "flex";
        return false;
    }
}


// =====================================================
// IMAGE URL VALIDATION
// =====================================================

function isValidImageUrl(url) {
    try {
        const parsed = new URL(url);
        return (
            parsed.protocol === "https:" ||
            parsed.protocol === "http:"
        );
    } catch {
        return false;
    }
}


// =====================================================
// IMAGE PREVIEW (URL)
// =====================================================

function showImagePreview(url) {
    if (!imagePreview) return;

    if (!url) {
        imagePreview.innerHTML = `
            <div class="preview-placeholder">
                Paste an image URL or select a file
                and the preview will appear here.
            </div>
        `;
        if (imageUrlStatus) imageUrlStatus.textContent = "";
        return;
    }

    if (!isValidImageUrl(url)) {
        imagePreview.innerHTML = `
            <div class="preview-error">
                Invalid image URL.
                Please enter a valid HTTPS image link.
            </div>
        `;
        if (imageUrlStatus) {
            imageUrlStatus.textContent = "✕ Invalid URL";
            imageUrlStatus.className = "url-status url-invalid";
        }
        return;
    }

    if (imageUrlStatus) {
        imageUrlStatus.textContent = "Checking image...";
        imageUrlStatus.className = "url-status";
    }

    imagePreview.innerHTML = "";

    const img = document.createElement("img");
    img.src = url;
    img.alt = "Photo Preview";

    img.onload = function () {
        if (imageUrlStatus) {
            imageUrlStatus.textContent = "✓ Image URL is valid";
            imageUrlStatus.className = "url-status url-valid";
        }
    };

    img.onerror = function () {
        if (imageUrlStatus) {
            imageUrlStatus.textContent = "✕ This link does not appear to be a direct image";
            imageUrlStatus.className = "url-status url-invalid";
        }
        imagePreview.innerHTML = `
            <div class="preview-error">
                Unable to load this image.
                <br><br>
                Make sure you pasted a direct image URL,
                for example .jpg, .jpeg, .png or .webp.
            </div>
        `;
    };

    imagePreview.appendChild(img);
}


// =====================================================
// FILE INPUT EVENT LISTENER
// =====================================================

if (photoFileInput) {
    photoFileInput.addEventListener("change", function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                if (imagePreview) {
                    imagePreview.innerHTML = `<img src="${evt.target.result}" alt="Preview" style="width:100%; max-height:300px; object-fit:cover;">`;
                }
            }
            reader.readAsDataURL(file);
            // Safisha sehemu ya URL kama amechagua faili kutoka kwenye kifaa
            if (imageUrlInput) imageUrlInput.value = "";
            if (imageUrlStatus) imageUrlStatus.textContent = "";
        }
    });
}


// =====================================================
// IMAGE URL INPUT LISTENER
// =====================================================

if (imageUrlInput) {
    imageUrlInput.addEventListener("input", function () {
        const url = imageUrlInput.value.trim();
        showImagePreview(url);
        // Safisha faili lililochaguliwa kama kaweka link
        if (photoFileInput) photoFileInput.value = "";
    });
}


// =====================================================
// DOWNLOAD URL BLUR
// =====================================================

if (imageUrlInput && downloadUrlInput) {
    imageUrlInput.addEventListener("blur", function () {
        const imageUrl = imageUrlInput.value.trim();
        const downloadUrl = downloadUrlInput.value.trim();

        if (imageUrl && !downloadUrl) {
            downloadUrlInput.value = imageUrl;
        }
    });
}


// =====================================================
// FORM SUBMIT (Inashughulikia Faili au Link)
// =====================================================

if (form) {
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = "Saving...";
        }

        try {
            const {
                data: { user },
                error: userError
            } = await supabase.auth.getUser();

            if (userError || !user) {
                throw new Error("You must login before adding a photo.");
            }

            const title = titleInput ? titleInput.value.trim() : "";
            const category = categoryInput ? categoryInput.value : "";
            const description = descriptionInput ? descriptionInput.value.trim() : "";
            let downloadUrl = downloadUrlInput ? downloadUrlInput.value.trim() : "";
            const status = statusInput ? statusInput.value : "Published";

            // ==========================================
            // VALIDATION
            // ==========================================

            if (!title) {
                throw new Error("Please enter the photo title.");
            }

            if (!category) {
                throw new Error("Please select a category.");
            }

            let finalImageUrl = "";

            const hasFile = photoFileInput && photoFileInput.files.length > 0;
            const hasUrl = imageUrlInput && imageUrlInput.value.trim() !== "";

            if (!hasFile && !hasUrl) {
                throw new Error("Please upload an image file or enter an Image URL.");
            }

            // KAMA AMETOA FAIL KUTOKA KWENYE KIFAA -> PAKIA SUPABASE STORAGE
            if (hasFile) {
                const file = photoFileInput.files[0];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                const folderName = category.toLowerCase(); // Folda inatengenezwa kulingana na Category
                const filePath = `${folderName}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('media-bucket') // Hakikisha bucket hii ipandishwe kwenye Supabase yako
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // Pata Public URL ya Faili lililopakiwa
                const { data: urlData } = supabase.storage
                    .from('media-bucket')
                    .getPublicUrl(filePath);

                finalImageUrl = urlData.publicUrl;

            } else {
                // KAMA AMETUMIA LINK YA KAWAIDA (URL)
                finalImageUrl = imageUrlInput.value.trim();
                if (!isValidImageUrl(finalImageUrl)) {
                    throw new Error("Please enter a valid Image URL.");
                }
            }

            // Auto download URL kama haipo
            if (!downloadUrl) {
                downloadUrl = finalImageUrl;
            }

            // ==========================================
            // SAVE TO DATABASE (Table ya 'media')
            // ==========================================

            const { data, error } = await supabase
                .from("media")
                .insert([{
                    title: title,
                    category: category,
                    description: description || null,
                    image_url: finalImageUrl,
                    download_url: downloadUrl,
                    status: status,
                    user_id: user.id
                }])
                .select();

            if (error) {
                console.error(error);
                throw new Error(error.message);
            }

            // ==========================================
            // SUCCESS
            // ==========================================

            showMessage("✓ Photo saved successfully.", "success");

            form.reset();
            if (photoFileInput) photoFileInput.value = "";
            
            if (imagePreview) {
                imagePreview.innerHTML = `
                    <div class="preview-placeholder">
                        Paste an image URL or select a file
                        and the preview will appear here.
                    </div>
                `;
            }

            if (imageUrlStatus) imageUrlStatus.textContent = "";

            console.log("Photo saved:", data);

        } catch (error) {
            console.error(error);
            showMessage("Error: " + error.message, "error");
        } finally {
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = "Save Photo";
            }
        }
    });
}


// =====================================================
// CLEAR BUTTON
// =====================================================

if (clearButton) {
    clearButton.addEventListener("click", function () {
        setTimeout(() => {
            if (imagePreview) {
                imagePreview.innerHTML = `
                    <div class="preview-placeholder">
                        Paste an image URL or select a file
                        and the preview will appear here.
                    </div>
                `;
            }
            if (imageUrlStatus) imageUrlStatus.textContent = "";
            if (photoFileInput) photoFileInput.value = "";
        }, 50);
    });
}


// =====================================================
// START
// =====================================================

checkUser();