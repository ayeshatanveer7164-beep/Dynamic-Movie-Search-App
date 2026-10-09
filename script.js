
"use strict";

// 1. Add your own OMDb API key here.
const API_KEY = "38a95452";
const API_URL = " http://www.omdbapi.com/?i=tt3896198&apikey=38a95452";

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const movieContainer = document.getElementById("movieContainer");
const statusMessage = document.getElementById("statusMessage");
const resultsHeading = document.getElementById("resultsHeading");
const resultCount = document.getElementById("resultCount");
const movieDialog = document.getElementById("movieDialog");
const movieDetails = document.getElementById("movieDetails");
const closeDialog = document.getElementById("closeDialog");

// 2. Display status messages.
function showStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = "status-message";

    if (type) {
        statusMessage.classList.add(type);
    }

    statusMessage.hidden = false;
}

// 3. Build a safe poster element.
function createPoster(movie) {
    const poster = document.createElement("img");

    poster.className = "poster";
    poster.alt = `${movie.Title} poster`;
    poster.loading = "lazy";

    // OMDb may return "N/A" when no poster exists.
    if (movie.Poster && movie.Poster !== "N/A") {
        poster.src = movie.Poster;

        poster.addEventListener("error", () => {
            const placeholder = document.createElement("div");
            placeholder.className = "poster-placeholder";
            placeholder.textContent = "Poster unavailable";
            poster.replaceWith(placeholder);
        }, { once: true });
    } else {
        const placeholder = document.createElement("div");
        placeholder.className = "poster-placeholder";
        placeholder.textContent = "Poster unavailable";
        return placeholder;
    }

    return poster;
}

// 4. Create each movie card dynamically.
function createMovieCard(movie) {
    const card = document.createElement("article");
    card.className = "movie-card";

    card.appendChild(createPoster(movie));

    const info = document.createElement("div");
    info.className = "movie-info";

    const title = document.createElement("h3");
    title.textContent = movie.Title;

    const meta = document.createElement("div");
    meta.className = "movie-meta";

    const year = document.createElement("span");
    year.textContent = movie.Year || "Year unknown";

    const type = document.createElement("span");
    type.textContent = movie.Type || "Movie";

    meta.append(year, type);

    const detailsButton = document.createElement("button");
    detailsButton.className = "details-button";
    detailsButton.type = "button";
    detailsButton.textContent = "View Details";

    detailsButton.addEventListener("click", () => {
        getMovieDetails(movie.imdbID);
    });

    info.append(title, meta, detailsButton);
    card.appendChild(info);

    return card;
}

// 5. Fetch search results from the API.
async function searchMovies(title) {
    const query = title.trim();

    if (!query) {
        showStatus("Please enter a movie title.", "error");
        searchInput.focus();
        return;
    }

    if (API_KEY === "YOUR_API_KEY_HERE") {
        showStatus(
            "Please add your OMDb API key in script.js before searching.",
            "error"
        );
        return;
    }

    searchButton.disabled = true;
    searchButton.textContent = "Searching...";
    movieContainer.replaceChildren();
    resultCount.textContent = "";
    resultsHeading.textContent = `Results for "${query}"`;
    showStatus("Loading movies...");

    try {
        const params = new URLSearchParams({
            apikey: API_KEY,
            s: query,
            type: "movie",
            page: "1"
        });

        const response = await fetch(`${API_URL}?${params}`);

        // fetch() does not automatically reject HTTP error statuses.
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        // OMDb can return an API-level error in a JSON response.
        if (data.Response === "False") {
            throw new Error(data.Error || "No movies found.");
        }

        if (!Array.isArray(data.Search) || data.Search.length === 0) {
            showStatus("No movies found. Try another title.");
            return;
        }

        // Create cards from the API results.
        const fragment = document.createDocumentFragment();

        data.Search.forEach((movie) => {
            fragment.appendChild(createMovieCard(movie));
        });

        movieContainer.appendChild(fragment);

        statusMessage.hidden = true;
        resultCount.textContent =
            `${data.Search.length} results shown`;

    } catch (error) {
        console.error("Movie search failed:", error);

        showStatus(
            error.message === "Failed to fetch"
                ? "Network error. Check your internet connection and try again."
                : error.message,
            "error"
        );
    } finally {
        // Always restore the button, even if a request fails.
        searchButton.disabled = false;
        searchButton.textContent = "Search";
    }
}

// 6. Fetch full details for a selected movie.
async function getMovieDetails(imdbID) {
    movieDetails.replaceChildren();

    const loading = document.createElement("p");
    loading.textContent = "Loading movie details...";
    movieDetails.appendChild(loading);

    if (!movieDialog.open) {
        movieDialog.showModal();
    }

    try {
        const params = new URLSearchParams({
            apikey: API_KEY,
            i: imdbID,
            plot: "full"
        });

        const response = await fetch(`${API_URL}?${params}`);

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const movie = await response.json();

        if (movie.Response === "False") {
            throw new Error(movie.Error || "Could not load details.");
        }

        const layout = document.createElement("div");
        layout.className = "details-layout";

        const poster = createPoster(movie);
        poster.classList.add("details-poster");

        const content = document.createElement("div");
        content.className = "details-content";

        const title = document.createElement("h2");
        title.textContent = movie.Title;

        const fields = [
            ["Year", movie.Year],
            ["Genre", movie.Genre],
            ["Director", movie.Director],
            ["Actors", movie.Actors],
            ["IMDb Rating", movie.imdbRating],
            ["Runtime", movie.Runtime],
            ["Plot", movie.Plot]
        ];

        content.appendChild(title);

        fields.forEach(([label, value]) => {
            const paragraph = document.createElement("p");
            const strong = document.createElement("strong");

            strong.textContent = `${label}: `;
            paragraph.appendChild(strong);

            const text = document.createTextNode(
                value && value !== "N/A" ? value : "Not available"
            );

            paragraph.appendChild(text);
            content.appendChild(paragraph);
        });

        layout.append(poster, content);
        movieDetails.replaceChildren(layout);

    } catch (error) {
        console.error("Could not load movie details:", error);

        const message = document.createElement("p");
        message.textContent = `Error: ${error.message}`;
        movieDetails.replaceChildren(message);
    }
}

// 7. Handle search form submission.
searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    searchMovies(searchInput.value);
});

// 8. Close the movie details popup.
closeDialog.addEventListener("click", () => {
    movieDialog.close();
});

// 9. Allow users to click outside the popup to close it.
movieDialog.addEventListener("click", (event) => {
    if (event.target === movieDialog) {
        movieDialog.close();
    }
});
