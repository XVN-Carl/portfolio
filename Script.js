
"use strict";

// ==========================================
// DEV//SPACE - MAIN JAVASCRIPT
// ==========================================

// 1. PROFILE PHOTO SETTINGS

const DEFAULT_PHOTO =
  "https://placehold.co/600x700/101713/39ff88?text=YOUR+PHOTO";

const PHOTO_STORAGE_KEY = "devspace_profile_photo_v1";
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB
const MAX_IMAGE_DIMENSION = 900;

const profileImage = document.getElementById("profileImage");
const editPhotoButton = document.getElementById("editPhotoButton");
const photoInput = document.getElementById("photoInput");
const photoModal = document.getElementById("photoModal");
const photoPreview = document.getElementById("photoPreview");
const savePhotoButton = document.getElementById("savePhoto");
const cancelPhotoButton = document.getElementById("cancelPhoto");
const closeModalButton = document.getElementById("closeModal");
const resetPhotoButton = document.getElementById("resetPhoto");
const photoMessage = document.getElementById("photoMessage");
const toast = document.getElementById("toast");

let pendingPhoto = null;
let previousFocus = null;
let toastTimeout = null;

// Load the saved picture when the page opens.
function loadSavedPhoto() {
  try {
    const savedPhoto = localStorage.getItem(PHOTO_STORAGE_KEY);

    if (savedPhoto) {
      profileImage.src = savedPhoto;
    } else {
      profileImage.src = DEFAULT_PHOTO;
    }
  } catch (error) {
    console.warn("Could not read the saved profile photo.", error);
    profileImage.src = DEFAULT_PHOTO;
  }
}

loadSavedPhoto();

// Show a temporary notification.
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Open the profile photo editor.
function openPhotoEditor() {
  previousFocus = document.activeElement;

  pendingPhoto = null;
  photoInput.value = "";
  savePhotoButton.disabled = true;
  photoMessage.textContent = "";

  photoPreview.src = profileImage.src || DEFAULT_PHOTO;

  photoModal.hidden = false;
  document.body.classList.add("modal-open");

  closeModalButton.focus();
}

// Close the profile photo editor.
function closePhotoEditor() {
  photoModal.hidden = true;
  document.body.classList.remove("modal-open");

  pendingPhoto = null;
  photoInput.value = "";
  savePhotoButton.disabled = true;
  photoMessage.textContent = "";

  if (previousFocus && typeof previousFocus.focus === "function") {
    previousFocus.focus();
  }
}

editPhotoButton.addEventListener("click", openPhotoEditor);
closeModalButton.addEventListener("click", closePhotoEditor);
cancelPhotoButton.addEventListener("click", closePhotoEditor);

// Close when the user clicks the dark area outside the modal.
photoModal.addEventListener("click", (event) => {
  if (event.target === photoModal) {
    closePhotoEditor();
  }
});

// Close with the Escape key.
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !photoModal.hidden) {
    closePhotoEditor();
  }
});

// 2. SELECT AND PREVIEW A PHOTO

photoInput.addEventListener("change", async () => {
  const file = photoInput.files && photoInput.files[0];

  if (!file) return;

  photoMessage.textContent = "";
  pendingPhoto = null;
  savePhotoButton.disabled = true;

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {
    photoMessage.textContent =
      "Please choose a JPG, PNG, or WebP image.";

    photoInput.value = "";
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    photoMessage.textContent =
      "Image is too large. Choose a file smaller than 8 MB.";

    photoInput.value = "";
    return;
  }

  photoMessage.textContent = "Preparing your photo...";

  try {
    const compressedPhoto = await compressImage(file);

    pendingPhoto = compressedPhoto;
    photoPreview.src = compressedPhoto;

    savePhotoButton.disabled = false;
    photoMessage.textContent =
      "Preview ready! Click Save Photo to apply it.";
  } catch (error) {
    console.error("Image processing failed:", error);

    photoMessage.textContent =
      "Could not process this image. Please try another one.";

    pendingPhoto = null;
    savePhotoButton.disabled = true;
  }
});

// Resize and compress the selected image to reduce storage usage.
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const originalWidth = image.naturalWidth;
      const originalHeight = image.naturalHeight;

      if (!originalWidth || !originalHeight) {
        reject(new Error("Invalid image dimensions."));
        return;
      }

      const scale = Math.min(
        1,
        MAX_IMAGE_DIMENSION / Math.max(originalWidth, originalHeight)
      );

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(originalWidth * scale));
      canvas.height = Math.max(1, Math.round(originalHeight * scale));

      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Canvas is not supported."));
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      // JPEG compression helps keep localStorage usage smaller.
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to load image."));
    };

    image.src = objectUrl;
  });
}

// 3. SAVE THE NEW PHOTO

savePhotoButton.addEventListener("click", () => {
  if (!pendingPhoto) {
    photoMessage.textContent = "Choose a photo first.";
    return;
  }

  try {
    // Save to this browser's local storage.
    localStorage.setItem(PHOTO_STORAGE_KEY, pendingPhoto);

    // Update the profile image on the current page.
    profileImage.src = pendingPhoto;

    closePhotoEditor();
    showToast("Profile photo saved successfully!");
  } catch (error) {
    console.error("Could not save photo:", error);

    photoMessage.textContent =
      "Unable to save. Try a smaller image or free browser storage.";
  }
});

// 4. RESET THE PROFILE PHOTO

resetPhotoButton.addEventListener("click", () => {
  const confirmed = window.confirm(
    "Reset your profile photo to the default image?"
  );

  if (!confirmed) return;

  try {
    localStorage.removeItem(PHOTO_STORAGE_KEY);
    profileImage.src = DEFAULT_PHOTO;

    closePhotoEditor();
    showToast("Profile photo reset to default.");
  } catch (error) {
    console.error("Could not reset photo:", error);

    photoMessage.textContent =
      "Unable to reset the saved photo in this browser.";
  }
});

// 5. MOBILE NAVIGATION

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const navLinkItems = document.querySelectorAll(".nav-link");

menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");

  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.textContent = isOpen ? "×" : "☰";
});

navLinkItems.forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "☰";
  });
});

// 6. TYPING ANIMATION

const typedRole = document.getElementById("typedRole");

const roles = [
  "Web Developer",
  "IT Student",
  "Software Engineer",
  "Network Engineer"
];

let roleIndex = 0;
let characterIndex = roles[0].length;
let deleting = true;

function typeRole() {
  const currentRole = roles[roleIndex];

  if (deleting) {
    characterIndex--;
    typedRole.textContent = currentRole.slice(0, characterIndex);
  } else {
    characterIndex++;
    typedRole.textContent = currentRole.slice(0, characterIndex);
  }

  let delay = deleting ? 45 : 85;

  if (!deleting && characterIndex === currentRole.length) {
    deleting = true;
    delay = 1300;
  } else if (deleting && characterIndex === 0) {
    deleting = false;
    roleIndex = (roleIndex + 1) % roles.length;
    delay = 300;
  }

  setTimeout(typeRole, delay);
}

// Start after the initial role is visible.
setTimeout(typeRole, 1500);

// 7. SCROLL REVEAL ANIMATIONS

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12
    }
  );

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });
} else {
  revealElements.forEach((element) => {
    element.classList.add("visible");
  });
}

// 8. ACTIVE NAVIGATION LINK

const sections = document.querySelectorAll("main section[id]");

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const currentId = entry.target.id;

        navLinkItems.forEach((link) => {
          const isActive = link.getAttribute("href") === `#${currentId}`;
          link.classList.toggle("active", isActive);
        });
      });
    },
    {
      rootMargin: "-25% 0px -60% 0px"
    }
  );

  sections.forEach((section) => {
    sectionObserver.observe(section);
  });
}

// 9. HANDLE A MISSING DEFAULT PHOTO

profileImage.addEventListener("error", () => {
  if (profileImage.src !== DEFAULT_PHOTO) {
    return;
  }

  profileImage.alt = "Profile photo placeholder";
});
