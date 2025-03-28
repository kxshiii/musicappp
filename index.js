let playlist = JSON.parse(localStorage.getItem('playlist')) || [];
let accessToken = '';

// Function to get Spotify access token
async function getSpotifyToken() {
    const clientId = '90103886f3ff4d4a84017db6c327d2c9'; // Replace with your Spotify Client ID
    const clientSecret = '459df6e7713d44f8a98cb7841026c791'; // Replace with your Spotify Client Secret
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    accessToken = data.access_token;
}

// Function to fetch songs from Spotify API
async function searchSongs(query) {
    const resultsDiv = document.getElementById('results');
    const searchButton = document.getElementById('searchButton');
    resultsDiv.innerHTML = '<div class="spinner">Loading...</div>';
    searchButton.disabled = true;

    if (!accessToken) await getSpotifyToken();

    try {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!response.ok) throw new Error('Unable to fetch songs from Spotify. Try again later.');
        const data = await response.json();
        displayResults(data.tracks.items);
    } catch (error) {
        resultsDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        console.error('Error fetching Spotify songs:', error);
    } finally {
        searchButton.disabled = false;
    }
}

// Function to display the results on the page
function displayResults(tracks) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    if (!tracks || tracks.length === 0) {
        resultsDiv.innerHTML = '<p>No songs found on Spotify. Try a different search (e.g., "Dilbar").</p>';
        return;
    }

    tracks.forEach(track => {
        const songDiv = document.createElement('div');
        songDiv.classList.add('song');
        songDiv.innerHTML = `
            <h3>${track.name}</h3>
            <p>Artist: ${track.artists.map(artist => artist.name).join(', ')}</p>
            <p>Album: ${track.album.name}</p>
            <a href="${track.external_urls.spotify}" target="_blank">Stream on Spotify</a>
            <button class="add-to-playlist" data-song='${JSON.stringify(track)}'>Add to Playlist</button>
        `;
        resultsDiv.appendChild(songDiv);
    });

    // Add event listeners to "Add to Playlist" buttons
    document.querySelectorAll('.add-to-playlist').forEach(button => {
        button.addEventListener('click', () => {
            const song = JSON.parse(button.getAttribute('data-song'));
            addToPlaylist(song);
        });
    });
}

// Function to add a song to the playlist
function addToPlaylist(song) {
    if (!playlist.some(item => item.id === song.id)) {
        playlist.push(song);
        localStorage.setItem('playlist', JSON.stringify(playlist));
        renderPlaylist();
    }
}

// Function to render the playlist
function renderPlaylist() {
    const playlistUl = document.getElementById('playlist');
    playlistUl.innerHTML = '';
    playlist.forEach((song, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${song.name} - ${song.artists.map(artist => artist.name).join(', ')}
            <button class="remove-song" data-index="${index}">Remove</button>
        `;
        playlistUl.appendChild(li);
    });

    // Add event listeners to "Remove" buttons
    document.querySelectorAll('.remove-song').forEach(button => {
        button.addEventListener('click', () => {
            const index = button.getAttribute('data-index');
            removeFromPlaylist(index);
        });
    });
}

// Function to remove a song from the playlist
function removeFromPlaylist(index) {
    playlist.splice(index, 1);
    localStorage.setItem('playlist', JSON.stringify(playlist));
    renderPlaylist();
}

// Function to clear the playlist
function clearPlaylist() {
    playlist = [];
    localStorage.setItem('playlist', JSON.stringify(playlist));
    renderPlaylist();
}

// Function to handle search
function handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
        alert('Please enter a song name to search Spotify.');
        return;
    }
    if (query.length < 2) {
        alert('Search query must be at least 2 characters long.');
        return;
    }
    searchSongs(query);
}

// Event listeners
document.getElementById('searchButton').addEventListener('click', handleSearch);
document.getElementById('searchInput').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') handleSearch();
});
document.getElementById('clearPlaylist').addEventListener('click', clearPlaylist);

// Render playlist on page load
renderPlaylist();