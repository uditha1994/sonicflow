// ========================================================
// SonicFlow - Webview Player Controller
// Handles all UI interactions and audio playback
// ========================================================

(function () {
    'use strict';

    // VS Code API
    const vscode = acquireVsCodeApi();

    // ===== State =====
    let state = {
        isPlaying: false,
        currentTrack: null,
        volume: 70,
        shuffle: false,
        repeat: 'none', // 'none' | 'one' | 'all'
        vibeMode: false,
        queue: [],
        queueIndex: -1,
        isDraggingProgress: false,
        queueExpanded: false,
        currentThemeIndex: 0
    };

    const themes = ['theme-aurora', 'theme-neon-midnight', 'theme-cyber-sunset', 'theme-deep-ocean'];

    // ===== DOM Elements =====
    const $ = (id) => document.getElementById(id);
    const app = $('sonicflow-app');
    const audio = $('audioPlayer');
    const btnPlayPause = $('btnPlayPause');
    const btnPrev = $('btnPrev');
    const btnNext = $('btnNext');
    const btnShuffle = $('btnShuffle');
    const btnRepeat = $('btnRepeat');
    const btnBrowse = $('btnBrowse');
    const btnYouTube = $('btnYouTube');
    const btnPlaylist = $('btnPlaylist');
    const btnVibe = $('btnVibe');
    const btnVolume = $('btnVolume');
    const btnTheme = $('btnTheme');
    const volumeSlider = $('volumeSlider');
    const progressBar = $('progressBar');
    const progressFill = $('progressFill');
    const progressHandle = $('progressHandle');
    const currentTimeEl = $('currentTime');
    const totalTimeEl = $('totalTime');
    const trackTitle = $('trackTitle');
    const trackArtist = $('trackArtist');
    const trackSource = $('trackSource');
    const artworkImg = $('artworkImg');
    const artworkGlow = $('artworkGlow');
    const playIcon = $('playIcon');
    const pauseIcon = $('pauseIcon');
    const repeatBadge = $('repeatBadge');
    const queueToggle = $('queueToggle');
    const queueList = $('queueList');
    const queueCount = $('queueCount');

    // ===== Initialize =====
    function init() {
        setupEventListeners();
        setupAudioListeners();
        setupMessageHandler();
        restoreState();

        // Set initial volume
        audio.volume = state.volume / 100;
        volumeSlider.value = state.volume;
    }

    // ===== Event Listeners =====
    function setupEventListeners() {
        // Play/Pause
        btnPlayPause.addEventListener('click', togglePlayPause);

        // Navigation
        btnPrev.addEventListener('click', () => sendMessage('previous'));
        btnNext.addEventListener('click', () => sendMessage('next'));

        // Shuffle
        btnShuffle.addEventListener('click', () => {
            state.shuffle = !state.shuffle;
            btnShuffle.classList.toggle('active', state.shuffle);
            sendMessage('toggleShuffle');
        });

        // Repeat
        btnRepeat.addEventListener('click', () => {
            const modes = ['none', 'all', 'one'];
            const currentIdx = modes.indexOf(state.repeat);
            state.repeat = modes[(currentIdx + 1) % modes.length];
            updateRepeatUI();
            sendMessage('toggleRepeat');
        });

        // Volume
        volumeSlider.addEventListener('input', (e) => {
            const vol = parseInt(e.target.value);
            state.volume = vol;
            audio.volume = vol / 100;
            sendMessage('setVolume', { volume: vol });
            updateVolumeIcon();
        });

        btnVolume.addEventListener('click', () => {
            if (state.volume > 0) {
                state._prevVolume = state.volume;
                state.volume = 0;
            } else {
                state.volume = state._prevVolume || 70;
            }
            audio.volume = state.volume / 100;
            volumeSlider.value = state.volume;
            updateVolumeIcon();
            sendMessage('setVolume', { volume: state.volume });
        });

        // Progress bar
        progressBar.addEventListener('mousedown', startProgressDrag);
        progressBar.addEventListener('click', seekFromClick);

        // Action buttons
        btnBrowse.addEventListener('click', () => sendMessage('browseLocal'));
        btnYouTube.addEventListener('click', () => sendMessage('searchYouTube'));
        btnPlaylist.addEventListener('click', () => sendMessage('showPlaylist'));
        btnVibe.addEventListener('click', () => {
            state.vibeMode = !state.vibeMode;
            btnVibe.classList.toggle('active', state.vibeMode);
            sendMessage('toggleVibeMode');
        });

        // Theme switcher
        btnTheme.addEventListener('click', cycleTheme);

        // Queue toggle
        queueToggle.addEventListener('click', toggleQueue);

        // Keyboard shortcuts within webview
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                togglePlayPause();
            } else if (e.code === 'ArrowRight' && e.ctrlKey) {
                sendMessage('next');
            } else if (e.code === 'ArrowLeft' && e.ctrlKey) {
                sendMessage('previous');
            } else if (e.code === 'ArrowUp') {
                e.preventDefault();
                state.volume = Math.min(100, state.volume + 5);
                audio.volume = state.volume / 100;
                volumeSlider.value = state.volume;
                sendMessage('setVolume', { volume: state.volume });
            } else if (e.code === 'ArrowDown') {
                e.preventDefault();
                state.volume = Math.max(0, state.volume - 5);
                audio.volume = state.volume / 100;
                volumeSlider.value = state.volume;
                sendMessage('setVolume', { volume: state.volume });
            }
        });
    }

    // ===== Audio Event Listeners =====
    function setupAudioListeners() {
        audio.addEventListener('timeupdate', () => {
            if (!state.isDraggingProgress && audio.duration) {
                const progress = (audio.currentTime / audio.duration) * 100;
                progressFill.style.width = `${progress}%`;
                currentTimeEl.textContent = formatTime(audio.currentTime);

                // Throttled position update to extension
                sendMessage('updatePosition', { position: audio.currentTime });
            }
        });

        audio.addEventListener('loadedmetadata', () => {
            totalTimeEl.textContent = formatTime(audio.duration);
        });

        audio.addEventListener('ended', () => {
            if (state.repeat === 'one') {
                audio.currentTime = 0;
                audio.play();
            } else {
                sendMessage('trackEnded');
            }
        });

        audio.addEventListener('play', () => {
            state.isPlaying = true;
            updatePlayPauseUI();
            app.classList.add('playing');
        });

        audio.addEventListener('pause', () => {
            state.isPlaying = false;
            updatePlayPauseUI();
            app.classList.remove('playing');
        });

        audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            showToast('Failed to load audio');
            sendMessage('audioError', { error: audio.error?.message });
        });

        audio.addEventListener('waiting', () => {
            // Show loading indicator
            btnPlayPause.classList.add('loading');
        });

        audio.addEventListener('canplay', () => {
            btnPlayPause.classList.remove('loading');
        });
    }

    // ===== Message Handler (from Extension) =====
    function setupMessageHandler() {
        window.addEventListener('message', (event) => {
            const message = event.data;

            switch (message.type) {
                case 'loadTrack':
                    loadTrack(message.track, message.streamUrl);
                    break;

                case 'play':
                    audio.play().catch(console.error);
                    break;

                case 'pause':
                    audio.pause();
                    break;

                case 'togglePlayPause':
                    togglePlayPause();
                    break;

                case 'setVolume':
                    state.volume = message.volume;
                    audio.volume = message.volume / 100;
                    volumeSlider.value = message.volume;
                    updateVolumeIcon();
                    break;

                case 'seek':
                    if (audio.duration) {
                        audio.currentTime = message.position;
                    }
                    break;

                case 'updateState':
                    updateFromState(message.state);
                    break;

                case 'updateQueue':
                    state.queue = message.queue || [];
                    state.queueIndex = message.queueIndex || 0;
                    renderQueue();
                    break;

                case 'setTheme':
                    setTheme(message.theme);
                    break;

                case 'toast':
                    showToast(message.text);
                    break;
            }
        });
    }

    // ===== Core Functions =====
    function togglePlayPause() {
        if (!state.currentTrack) {
            sendMessage('browseLocal');
            return;
        }

        if (audio.paused) {
            audio.play().catch(console.error);
        } else {
            audio.pause();
        }
        sendMessage('togglePlayPause');
    }

    function loadTrack(track, streamUrl) {
        state.currentTrack = track;

        // Update UI
        trackTitle.textContent = track.title || 'Unknown Track';
        trackArtist.textContent = track.artist || 'Unknown Artist';
        trackSource.textContent = track.source === 'youtube' ? '▶ YouTube' : '♪ Local';

        // Artwork
        if (track.thumbnailUri) {
            artworkImg.src = track.thumbnailUri;
            artworkImg.classList.remove('hidden');
            document.querySelector('.sf-artwork-placeholder').classList.add('hidden');
        } else {
            artworkImg.classList.add('hidden');
            document.querySelector('.sf-artwork-placeholder').classList.remove('hidden');
        }

        // Load audio
        if (streamUrl) {
            audio.src = streamUrl;
            audio.load();
            audio.play().catch(console.error);
        }

        // Reset progress
        progressFill.style.width = '0%';
        currentTimeEl.textContent = '0:00';
        totalTimeEl.textContent = formatTime(track.duration || 0);

        saveState();
    }

    function updateFromState(newState) {
        if (newState.shuffle !== undefined) {
            state.shuffle = newState.shuffle;
            btnShuffle.classList.toggle('active', state.shuffle);
        }
        if (newState.repeat !== undefined) {
            state.repeat = newState.repeat;
            updateRepeatUI();
        }
        if (newState.vibeMode !== undefined) {
            state.vibeMode = newState.vibeMode;
            btnVibe.classList.toggle('active', state.vibeMode);
        }
        if (newState.queue) {
            state.queue = newState.queue;
            state.queueIndex = newState.queueIndex || 0;
            renderQueue();
        }
    }

    // ===== Progress Drag =====
    function startProgressDrag(e) {
        state.isDraggingProgress = true;

        const onMove = (e) => {
            const rect = progressBar.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            progressFill.style.width = `${percent * 100}%`;
            currentTimeEl.textContent = formatTime(percent * (audio.duration || 0));
        };

        const onUp = (e) => {
            state.isDraggingProgress = false;
            const rect = progressBar.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            if (audio.duration) {
                audio.currentTime = percent * audio.duration;
            }
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }

    function seekFromClick(e) {
        const rect = progressBar.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        if (audio.duration) {
            audio.currentTime = percent * audio.duration;
        }
    }

    // ===== Queue =====
    function toggleQueue() {
        state.queueExpanded = !state.queueExpanded;
        queueList.classList.toggle('hidden', !state.queueExpanded);
        queueToggle.classList.toggle('expanded', state.queueExpanded);
    }

    function renderQueue() {
        queueCount.textContent = state.queue.length;
        queueList.innerHTML = '';

        state.queue.forEach((track, index) => {
            const item = document.createElement('div');
            item.className = `sf-queue-item ${index === state.queueIndex ? 'active' : ''}`;
            item.innerHTML = `
                <span class="sf-queue-item-index">${index === state.queueIndex ? '▶' : index + 1}</span>
                <div class="sf-queue-item-info">
                    <div class="sf-queue-item-title">${escapeHtml(track.title)}</div>
                    <div class="sf-queue-item-artist">${escapeHtml(track.artist)}</div>
                </div>
                <span class="sf-queue-item-duration">${formatTime(track.duration)}</span>
                <button class="sf-queue-item-remove" data-index="${index}" title="Remove">✕</button>
            `;

            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('sf-queue-item-remove')) {
                    sendMessage('playFromQueue', { index });
                }
            });

            const removeBtn = item.querySelector('.sf-queue-item-remove');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sendMessage('removeFromQueue', { index });
            });

            queueList.appendChild(item);
        });
    }

    // ===== Theme =====
    function cycleTheme() {
        state.currentThemeIndex = (state.currentThemeIndex + 1) % themes.length;
        const themeName = themes[state.currentThemeIndex];
        setTheme(themeName);
        sendMessage('changeTheme', { theme: themeName });
    }

    function setTheme(themeName) {
        themes.forEach(t => app.classList.remove(t));
        app.classList.add(themeName);
        const idx = themes.indexOf(themeName);
        if (idx >= 0) {
            state.currentThemeIndex = idx;
        }
        saveState();
    }

    // ===== UI Updates =====
    function updatePlayPauseUI() {
        if (state.isPlaying) {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
        } else {
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
        }
    }

    function updateRepeatUI() {
        btnRepeat.classList.toggle('active', state.repeat !== 'none');
        if (state.repeat === 'one') {
            repeatBadge.classList.remove('hidden');
        } else {
            repeatBadge.classList.add('hidden');
        }
    }

    function updateVolumeIcon() {
        const high = $('volumeHigh');
        const med = $('volumeMed');

        if (state.volume === 0) {
            if (high) { high.style.display = 'none'; }
            if (med) { med.style.display = 'none'; }
        } else if (state.volume < 50) {
            if (high) { high.style.display = 'none'; }
            if (med) { med.style.display = 'block'; }
        } else {
            if (high) { high.style.display = 'block'; }
            if (med) { med.style.display = 'block'; }
        }
    }

    // ===== Toast Notification =====
    function showToast(text) {
        let toast = document.querySelector('.sf-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'sf-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = text;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // ===== Utility Functions =====
    function formatTime(seconds) {
        if (!seconds || isNaN(seconds)) { return '0:00'; }
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function sendMessage(command, data = {}) {
        vscode.postMessage({ command, ...data });
    }

    function saveState() {
        vscode.setState({
            currentThemeIndex: state.currentThemeIndex,
            volume: state.volume,
            shuffle: state.shuffle,
            repeat: state.repeat,
            vibeMode: state.vibeMode
        });
    }

    function restoreState() {
        const saved = vscode.getState();
        if (saved) {
            if (saved.currentThemeIndex !== undefined) {
                state.currentThemeIndex = saved.currentThemeIndex;
                setTheme(themes[state.currentThemeIndex]);
            }
            if (saved.volume !== undefined) {
                state.volume = saved.volume;
                audio.volume = state.volume / 100;
                volumeSlider.value = state.volume;
            }
            if (saved.shuffle !== undefined) {
                state.shuffle = saved.shuffle;
                btnShuffle.classList.toggle('active', state.shuffle);
            }
            if (saved.repeat !== undefined) {
                state.repeat = saved.repeat;
                updateRepeatUI();
            }
            if (saved.vibeMode !== undefined) {
                state.vibeMode = saved.vibeMode;
                btnVibe.classList.toggle('active', state.vibeMode);
            }
        }
    }

    // ===== Initialize on DOM Ready =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();