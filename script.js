/* =========================
   ESTATEHUB - MAIN SCRIPT
========================= */

// DOM ELEMENTS

const propertyGrid = document.getElementById("property-grid");
const resultsCount = document.getElementById("results-count");

const searchButton = document.querySelector(".search-button");
const resetButton = document.querySelector(".reset-search-btn");
const featuredButton = document.querySelector(".featured-filter-btn");
const favoritesFilterButton = document.querySelector(".favorites-filter-btn");
const favoritesCount = document.getElementById("favorites-count");
const sortPrice = document.getElementById("sort-price");

const locationInput = document.getElementById("location");
const typeInput = document.getElementById("property-type");
const priceInput = document.getElementById("price-range");

// APPLICATION STATE

let allProperties = [];
let showingFeatured = false;
let showingFavorites = false;
// FAVORITES STORAGE

let favoriteProperties =
  JSON.parse(localStorage.getItem("estatehub-favorites")) || [];
// LOAD PROPERTY DATA

async function loadProperties() {
  try {
    const response = await fetch("properties.json");

    if (!response.ok) {
      throw new Error("Could not load property data.");
    }

    allProperties = await response.json();

    applyFilters();
  } catch (error) {
    console.error("Property loading error:", error);

    propertyGrid.innerHTML = `
            <p class="error-message">
                Unable to load properties. Please try again.
            </p>
        `;
  }
}

// APPLY ALL FILTERS AND SORTING

function applyFilters() {
  const locationValue = locationInput.value.trim().toLowerCase();

  const typeValue = typeInput.value;
  const priceValue = priceInput.value;
  const sortValue = sortPrice.value;

  let filteredProperties = allProperties.filter((property) => {
    const matchesLocation =
      !locationValue ||
      property.city.toLowerCase().includes(locationValue) ||
      property.country.toLowerCase().includes(locationValue) ||
      property.location.toLowerCase().includes(locationValue);

    const matchesType = !typeValue || property.type === typeValue;

    const matchesPrice = !priceValue || property.price <= Number(priceValue);

    const matchesFeatured = !showingFeatured || property.featured;
    const matchesFavorites =
      !showingFavorites || favoriteProperties.includes(property.id);
    return (
      matchesLocation &&
      matchesType &&
      matchesPrice &&
      matchesFeatured &&
      matchesFavorites
    );
  });

  // SORT PROPERTIES

  if (sortValue === "low-high") {
    filteredProperties.sort((a, b) => a.price - b.price);
  } else if (sortValue === "high-low") {
    filteredProperties.sort((a, b) => b.price - a.price);
  }

  renderProperties(filteredProperties);
}

// RENDER PROPERTY CARDS

function renderProperties(properties) {
  if (!propertyGrid) return;

  propertyGrid.innerHTML = "";

  if (resultsCount) {
    resultsCount.textContent = `Showing ${properties.length} properties`;
  }
  if (favoritesCount) {
    favoritesCount.textContent = favoriteProperties.length;
  }
  if (properties.length === 0) {
    propertyGrid.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">⌕</div>
            <h3>No Properties Found</h3>
            <p>We couldn't find any properties matching your search.</p>
            <span>Try adjusting your filters or search criteria.</span>
            <button type="button" class="empty-reset-btn">
    Clear All Filters
</button>
        </div>
    `;
    return;
  }
  properties.forEach((property) => {
    const card = document.createElement("article");

    card.className = "property-card";

    card.innerHTML = `
            <div class="property-image-wrapper">
<button
    type="button"
    class="favorite-btn ${
      favoriteProperties.includes(property.id) ? "active" : ""
    }"
    data-id="${property.id}"
    aria-label="${
      favoriteProperties.includes(property.id)
        ? "Remove from favorites"
        : "Add to favorites"
    }"
>
    ${favoriteProperties.includes(property.id) ? "♥" : "♡"}
</button>
                <img
                    src="${property.image}"
                    alt="${property.title}"
                    class="property-image"
                    loading="lazy"
                >

                <span class="property-type">
                    ${property.type}
                </span>

                ${
                  property.featured
                    ? '<span class="featured-label">FEATURED</span>'
                    : ""
                }

            </div>

            <div class="property-card-content">

                <span class="property-location">
                    ${property.location}, ${property.country}
                </span>

                <h3>${property.title}</h3>

                <div class="property-details">
                    <span>${property.beds} Beds</span>
                    <span>${property.baths} Baths</span>
                    <span>${property.area} m²</span>
                </div>

                <div class="property-card-footer">

                    <strong>
                        $${property.price.toLocaleString("en-US")}
                    </strong>

                    <button type="button" class="property-view-btn">
                        View Details ↗
                    </button>

                </div>

            </div>
        `;

    propertyGrid.appendChild(card);
  });
}

// SEARCH BUTTON

searchButton.addEventListener("click", applyFilters);

// RESET ALL FILTERS

resetButton.addEventListener("click", () => {
  locationInput.value = "";
  typeInput.value = "";
  priceInput.value = "";

  sortPrice.value = "default";

  showingFeatured = false;

  featuredButton.classList.remove("active");
  showingFavorites = false;
  favoritesFilterButton.classList.remove("active");
  applyFilters();
});

// FEATURED FILTER

featuredButton.addEventListener("click", () => {
  showingFeatured = !showingFeatured;

  featuredButton.classList.toggle("active", showingFeatured);

  applyFilters();
});
// FAVORITES FILTER
favoritesFilterButton.addEventListener("click", () => {
  showingFavorites = !showingFavorites;

  favoritesFilterButton.classList.toggle("active", showingFavorites);

  applyFilters();
});
// PRICE SORTING

sortPrice.addEventListener("change", applyFilters);

// INITIALIZE APPLICATION

loadProperties();
/* =========================
   PROPERTY DETAILS MODAL
========================= */

const propertyModal = document.getElementById("property-modal");
const modalDetails = document.getElementById("modal-property-details");
const modalCloseButton = document.querySelector(".modal-close-btn");
const modalOverlay = document.querySelector(".modal-overlay");
const fullscreenGallery = document.getElementById("fullscreen-gallery");
const fullscreenImage = document.getElementById("fullscreen-image");
const fullscreenCounter = document.getElementById("fullscreen-counter");
const fullscreenCloseButton = document.querySelector(".fullscreen-close");
let currentGalleryImages = [];
let currentGalleryIndex = 0;
// OPEN MODAL

function openPropertyModal(property) {
  currentGalleryImages = property.gallery;
  currentGalleryIndex = 0;
  modalDetails.innerHTML = `
        <img
    src="${property.gallery[0]}"
    alt="${property.title}"
    class="modal-property-image"
    id="main-gallery-image"
>
<div class="modal-gallery-thumbnails">
    ${property.gallery
      .map(
        (image, index) => `
        <button
            type="button"
            class="gallery-thumbnail ${index === 0 ? "active" : ""}"
            data-image="${image}"
        >
            <img src="${image}" alt="${property.title} - Image ${index + 1}">
        </button>
    `,
      )
      .join("")}
</div>

        <div class="modal-property-info">

            <span class="modal-property-location">
                ${property.location}, ${property.country}
            </span>

            <h2>${property.title}</h2>

            <div class="modal-property-price">
                $${property.price.toLocaleString("en-US")}
            </div>

            <div class="modal-property-details">
                <span>${property.beds} Bedrooms</span>
                <span>${property.baths} Bathrooms</span>
                <span>${property.area} m²</span>
                <span>${property.type}</span>
            </div>

            <p class="modal-property-description">
                Discover this exceptional ${property.type.toLowerCase()}
                in ${property.city}, ${property.country}.
                A beautiful property offering comfort, style
                and an excellent living experience.
            </p>

        </div>
        <div class="contact-agent-section">
    <h3>Interested in this property?</h3>
    <p>Send an inquiry to our property consultant.</p>
    <form class="contact-agent-form">
    <div class="form-group">
        <label for="agent-name">Full Name</label>
        <input
            type="text"
            id="agent-name"
            name="name"
            placeholder="Enter your full name"
            required
        >
    </div>
    <div class="form-group">
    <label for="agent-email">Email Address</label>
    <input
        type="email"
        id="agent-email"
        name="email"
        placeholder="Enter your email"
        required
    >
</div>
<div class="form-group">
    <label for="agent-phone">Phone Number</label>
    <input
        type="tel"
        id="agent-phone"
        name="phone"
        placeholder="Enter your phone number"
        required
    >
</div>
<div class="form-group">
    <label for="agent-message">Your Message</label>
    <textarea
        id="agent-message"
        name="message"
        rows="4"
        placeholder="Write your message here..."
        required
    ></textarea>
</div>
<button type="submit" class="send-inquiry-btn">
    Submit Inquiry
    <span>↗</span>
</button>
</form>
</div>
      `;

  propertyModal.classList.add("active");
  document.body.style.overflow = "hidden";
}
// UPDATE FULLSCREEN IMAGE
function updateFullscreenGallery() {
  if (currentGalleryImages.length === 0) return;

  fullscreenImage.src = currentGalleryImages[currentGalleryIndex];
  fullscreenImage.alt = `Property gallery image ${currentGalleryIndex + 1}`;

  fullscreenCounter.textContent = `${currentGalleryIndex + 1} / ${currentGalleryImages.length}`;

  const mainImage = document.getElementById("main-gallery-image");

  if (mainImage) {
    mainImage.src = currentGalleryImages[currentGalleryIndex];
  }

  modalDetails
    .querySelectorAll(".gallery-thumbnail")
    .forEach((button, index) => {
      button.classList.toggle("active", index === currentGalleryIndex);
    });
}

// OPEN FULLSCREEN
function openFullscreenGallery(index = 0) {
  currentGalleryIndex = index;
  updateFullscreenGallery();
  fullscreenGallery.classList.add("active");
}
// NEXT IMAGE
function showNextGalleryImage() {
  currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryImages.length;

  updateFullscreenGallery();
}

// PREVIOUS IMAGE
function showPreviousGalleryImage() {
  currentGalleryIndex =
    (currentGalleryIndex - 1 + currentGalleryImages.length) %
    currentGalleryImages.length;

  updateFullscreenGallery();
}
// CLOSE MODAL

function closePropertyModal() {
  propertyModal.classList.remove("active");
  document.body.style.overflow = "";
}

// HANDLE VIEW DETAILS BUTTONS

propertyGrid.addEventListener("click", (event) => {
  const viewButton = event.target.closest(".property-view-btn");

  if (!viewButton) return;

  const card = viewButton.closest(".property-card");

  const propertyTitle = card.querySelector("h3").textContent;

  const selectedProperty = allProperties.find(
    (property) => property.title === propertyTitle,
  );

  if (selectedProperty) {
    openPropertyModal(selectedProperty);
  }
});

// CLOSE BUTTON

modalCloseButton.addEventListener("click", closePropertyModal);

// CLOSE BY CLICKING OVERLAY

modalOverlay.addEventListener("click", closePropertyModal);

// CLOSE WITH ESCAPE KEY

document.addEventListener("keydown", (event) => {
  if (!fullscreenGallery.classList.contains("active")) {
    if (event.key === "Escape") {
      closePropertyModal();
    }
    return;
  }

  if (event.key === "Escape") {
    fullscreenGallery.classList.remove("active");
  }

  if (event.key === "ArrowRight") {
    showNextGalleryImage();
  }

  if (event.key === "ArrowLeft") {
    showPreviousGalleryImage();
  }
});
/* =========================
   FAVORITES FUNCTIONALITY
========================= */

propertyGrid.addEventListener("click", (event) => {
  const favoriteButton = event.target.closest(".favorite-btn");

  if (!favoriteButton) return;

  const propertyId = Number(favoriteButton.dataset.id);

  if (favoriteProperties.includes(propertyId)) {
    favoriteProperties = favoriteProperties.filter((id) => id !== propertyId);
  } else {
    favoriteProperties.push(propertyId);
  }

  localStorage.setItem(
    "estatehub-favorites",
    JSON.stringify(favoriteProperties),
  );

  applyFilters();
});
/* =========================
   GALLERY THUMBNAIL CLICK
========================= */

modalDetails.addEventListener("click", (event) => {
  const thumbnail = event.target.closest(".gallery-thumbnail");

  if (!thumbnail) return;

  const mainImage = document.getElementById("main-gallery-image");

  mainImage.src = thumbnail.dataset.image;
  currentGalleryIndex = currentGalleryImages.indexOf(thumbnail.dataset.image);
  document.querySelectorAll(".gallery-thumbnail").forEach((button) => {
    button.classList.remove("active");
  });

  thumbnail.classList.add("active");
});
/* =========================
   FULLSCREEN GALLERY EVENTS
========================= */

// OPEN FULLSCREEN BY CLICKING MAIN IMAGE
modalDetails.addEventListener("click", (event) => {
  if (event.target.id === "main-gallery-image") {
    openFullscreenGallery(0);
  }
});
// FULLSCREEN BUTTON EVENTS

document.querySelector(".gallery-next").addEventListener("click", () => {
  showNextGalleryImage();
});

document.querySelector(".gallery-prev").addEventListener("click", () => {
  showPreviousGalleryImage();
});

fullscreenCloseButton.addEventListener("click", () => {
  fullscreenGallery.classList.remove("active");
});
/* CONTACT AGENT FORM */

modalDetails.addEventListener("submit", (event) => {
  if (!event.target.matches(".contact-agent-form")) return;

  event.preventDefault();

  alert("Your inquiry has been submitted successfully!");
  event.target.reset();
});
propertyGrid.addEventListener("click", (event) => {
  if (event.target.closest(".empty-reset-btn")) {
    resetButton.click();
  }
});
