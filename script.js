// Elements
const audio = document.getElementById('audio');
const art = document.getElementById('art');
const titleEl = document.getElementById('title');
const artistEl = document.getElementById('artist');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const progress = document.getElementById('progress');
const progressContainer = document.getElementById('progress-container');

const playBtn = document.getElementById('play');
const playIcon = playBtn.querySelector('i');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const shuffleBtn = document.getElementById('shuffle');
const repeatBtn = document.getElementById('repeat');
const likeBtn = document.getElementById('like-btn');
const likeIcon = likeBtn.querySelector('i');

const player = document.getElementById('player');
const nowPlaying = document.getElementById('now-playing');
const expandToggle = document.getElementById('expand-toggle');
const expandIcon = expandToggle.querySelector('i');

const searchInput = document.getElementById('search-input');
const artistChips = document.getElementById('artist-chips');
const songListEl = document.getElementById('song-list');
const emptyState = document.getElementById('empty-state');
const songCountEl = document.getElementById('song-count');

const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menu-toggle');
const menuToggleIcon = menuToggle.querySelector('i');

// Music
const songs = [
  {
    name: 'interworld',
    displayName: 'Metamorphosis',
    artist: 'Interworld',
  },
  {
    name: 'NBSPLV',
    displayName: 'Lost Soul',
    artist: 'NBSPLV',
  },
  {
    name: 'VØJ, Narvent',
    displayName: 'Memory Reboot',
    artist: 'VØJ, Narvent',
  },
  {
    name: 'dark',
    displayName: 'After Dark',
    artist: 'Mr.Kitty',
  },
  {
    name: 'angel',
    displayName: '0% Angel',
    artist: 'Mr.Kitty',
  },
  {
    name: 'home',
    displayName: 'Home',
    artist: 'Resonance',
  },
  {
    name: 'lemonade',
    displayName: 'Lemonade',
    artist: 'Bumboi',
  },
  {
    name: 'rock',
    displayName: 'Rock With You Pt.2',
    artist: 'Lil God Dam',
  },
  {
    name: 'faceless',
    displayName: 'Faceless',
    artist: 'WesGhost',
  },
  {
    name: 'cursed',
    displayName: 'Cursed',
    artist: 'WesGhost',
  },
  {
    name: 'ecstacy',
    displayName: 'ecstacy',
    artist: 'SUICIDAL-IDOL',
  },
];

// State
let songIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let activeArtist = 'all';
let searchTerm = '';
const likedSongs = new Set(JSON.parse(localStorage.getItem('likedSongs') || '[]'));
const durationCache = {};

function songSrc(song) {
  return encodeURI(`music/${song.name}.mp3`);
}

function songArt(song) {
  return encodeURI(`img/${song.name}.jpg`);
}

function formatTime(seconds) {
  if (!isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  let secs = Math.floor(seconds % 60);
  if (secs < 10) secs = `0${secs}`;
  return `${minutes}:${secs}`;
}

// Artist filter chips
function initChips() {
  const artists = [...new Set(songs.map((s) => s.artist))].sort();
  artists.forEach((artist) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.type = 'button';
    chip.textContent = artist;
    chip.dataset.artist = artist;
    artistChips.appendChild(chip);
  });
}

artistChips.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  activeArtist = chip.dataset.artist;
  [...artistChips.children].forEach((c) => c.classList.toggle('active', c === chip));
  renderList();
  closeArtistMenu();
});

// Mobile artist dropdown
function openArtistMenu() {
  sidebar.classList.add('menu-open');
  menuToggle.setAttribute('aria-expanded', 'true');
  menuToggleIcon.classList.replace('fa-bars', 'fa-times');
}

function closeArtistMenu() {
  sidebar.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggleIcon.classList.replace('fa-times', 'fa-bars');
}

menuToggle.addEventListener('click', () => {
  sidebar.classList.contains('menu-open') ? closeArtistMenu() : openArtistMenu();
});

document.addEventListener('click', (e) => {
  if (sidebar.classList.contains('menu-open') && !sidebar.contains(e.target)) {
    closeArtistMenu();
  }
});

searchInput.addEventListener('input', (e) => {
  searchTerm = e.target.value.trim().toLowerCase();
  renderList();
});

function getFilteredSongs() {
  return songs
    .map((song, index) => ({ ...song, index }))
    .filter((song) => activeArtist === 'all' || song.artist === activeArtist)
    .filter(
      (song) =>
        !searchTerm ||
        song.displayName.toLowerCase().includes(searchTerm) ||
        song.artist.toLowerCase().includes(searchTerm)
    );
}

// Render song list
function renderList() {
  const filtered = getFilteredSongs();
  songListEl.innerHTML = '';
  emptyState.hidden = filtered.length > 0;

  filtered.forEach((song) => {
    const row = document.createElement('div');
    row.className = 'song-row';
    row.dataset.index = song.index;
    if (song.index === songIndex) row.classList.add('active');
    if (song.index === songIndex && isPlaying) row.classList.add('playing');

    row.innerHTML = `
      <div class="song-row-art">
        <img src="${songArt(song)}" alt="" loading="lazy">
        <button class="row-play" type="button" aria-label="Play ${song.displayName}"><i class="fas fa-play"></i></button>
        <span class="eq"><i></i><i></i><i></i></span>
      </div>
      <div class="song-row-meta">
        <p class="song-row-title">${song.displayName}</p>
        <p class="song-row-artist">${song.artist}</p>
      </div>
      <button class="icon-btn row-like" type="button" data-index="${song.index}" aria-label="Like ${song.displayName}">
        <i class="${likedSongs.has(song.index) ? 'fas' : 'far'} fa-heart"></i>
      </button>
      <span class="song-row-duration" data-duration-for="${song.index}">${durationCache[song.index] || '--:--'}</span>
    `;
    songListEl.appendChild(row);
  });

  primeDurations(filtered);
}

songListEl.addEventListener('click', (e) => {
  const likeBtnRow = e.target.closest('.row-like');
  if (likeBtnRow) {
    toggleLike(Number(likeBtnRow.dataset.index));
    return;
  }
  const row = e.target.closest('.song-row');
  if (!row) return;
  const index = Number(row.dataset.index);
  if (index === songIndex) {
    isPlaying ? pauseSong() : playSong();
  } else {
    songIndex = index;
    loadSong(songs[songIndex]);
    playSong();
  }
});

function toggleLike(index) {
  if (likedSongs.has(index)) {
    likedSongs.delete(index);
  } else {
    likedSongs.add(index);
  }
  localStorage.setItem('likedSongs', JSON.stringify([...likedSongs]));
  syncLikeUI();
  renderList();
}

function syncLikeUI() {
  const liked = likedSongs.has(songIndex);
  likeIcon.classList.toggle('fas', liked);
  likeIcon.classList.toggle('far', !liked);
  likeBtn.classList.toggle('active', liked);
}

// Lazily probe durations for visible rows so the list shows real track lengths
function primeDurations(list) {
  list.forEach((song) => {
    if (durationCache[song.index]) return;
    const probe = new Audio();
    probe.preload = 'metadata';
    probe.src = songSrc(song);
    probe.addEventListener(
      'loadedmetadata',
      () => {
        const formatted = formatTime(probe.duration);
        durationCache[song.index] = formatted;
        const span = songListEl.querySelector(`[data-duration-for="${song.index}"]`);
        if (span) span.textContent = formatted;
        if (song.index === songIndex) durationEl.textContent = formatted;
      },
      { once: true }
    );
  });
}

// Load / Play / Pause
function loadSong(song) {
  titleEl.textContent = song.displayName;
  artistEl.textContent = song.artist;
  audio.src = songSrc(song);
  art.src = songArt(song);
  progress.style.width = '0%';
  currentTimeEl.textContent = '0:00';
  durationEl.textContent = durationCache[songIndex] || '0:00';
  syncLikeUI();
  updateActiveRow();
}

function updateActiveRow() {
  [...songListEl.children].forEach((row) => {
    const idx = Number(row.dataset.index);
    row.classList.toggle('active', idx === songIndex);
    row.classList.toggle('playing', idx === songIndex && isPlaying);
  });
}

function playSong() {
  isPlaying = true;
  playIcon.classList.replace('fa-play', 'fa-pause');
  playBtn.setAttribute('title', 'Pause');
  audio.play();
  updateActiveRow();
}

function pauseSong() {
  isPlaying = false;
  playIcon.classList.replace('fa-pause', 'fa-play');
  playBtn.setAttribute('title', 'Play');
  audio.pause();
  updateActiveRow();
}

playBtn.addEventListener('click', () => (isPlaying ? pauseSong() : playSong()));

function pickNextIndex(direction) {
  if (isShuffle && songs.length > 1) {
    let next;
    do {
      next = Math.floor(Math.random() * songs.length);
    } while (next === songIndex);
    return next;
  }
  let next = songIndex + direction;
  if (next < 0) next = songs.length - 1;
  if (next > songs.length - 1) next = 0;
  return next;
}

function prevSong() {
  songIndex = pickNextIndex(-1);
  loadSong(songs[songIndex]);
  playSong();
}

function nextSong() {
  songIndex = pickNextIndex(1);
  loadSong(songs[songIndex]);
  playSong();
}

prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);

shuffleBtn.addEventListener('click', () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle('active', isShuffle);
});

repeatBtn.addEventListener('click', () => {
  isRepeat = !isRepeat;
  repeatBtn.classList.toggle('active', isRepeat);
});

likeBtn.addEventListener('click', () => toggleLike(songIndex));

audio.addEventListener('ended', () => {
  if (isRepeat) {
    audio.currentTime = 0;
    audio.play();
  } else {
    nextSong();
  }
});

audio.addEventListener('loadedmetadata', () => {
  const formatted = formatTime(audio.duration);
  durationCache[songIndex] = formatted;
  durationEl.textContent = formatted;
  const span = songListEl.querySelector(`[data-duration-for="${songIndex}"]`);
  if (span) span.textContent = formatted;
});

audio.addEventListener('timeupdate', () => {
  const { duration, currentTime } = audio;
  if (duration) {
    progress.style.width = `${(currentTime / duration) * 100}%`;
  }
  currentTimeEl.textContent = formatTime(currentTime);
});

progressContainer.addEventListener('click', (e) => {
  const width = progressContainer.clientWidth;
  if (audio.duration) {
    audio.currentTime = (e.offsetX / width) * audio.duration;
  }
});

// Expand / collapse full-screen player
function toggleExpand() {
  const expanded = player.classList.toggle('expanded');
  expandIcon.classList.toggle('fa-chevron-up', !expanded);
  expandIcon.classList.toggle('fa-chevron-down', expanded);
  document.body.classList.toggle('scroll-locked', expanded);
}

expandToggle.addEventListener('click', toggleExpand);
nowPlaying.addEventListener('click', (e) => {
  if (e.target.closest('.like-btn')) return;
  if (!player.classList.contains('expanded')) toggleExpand();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (player.classList.contains('expanded')) toggleExpand();
  if (sidebar.classList.contains('menu-open')) closeArtistMenu();
});

// Init
initChips();
songCountEl.textContent = songs.length;
renderList();
loadSong(songs[songIndex]);
