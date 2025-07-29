// eTabla Application
// This script provides functionality for Taal selection, BPM adjustment, and audio playback.

// Normalize TAAL_MATRAS_COUNT keys to lowercase for case-insensitive access
const TAAL_MATRAS_COUNT = {
    'ektaal': 12,
    'teentaal': 16,
    'jhaptaal': 10
};


class ETabla {
    // --- Tanpura logic (HTML5 audio version) ---
    setupTanpura() {
        this.tanpuraAudio = null;
        const tanpuraToggle = document.getElementById('tanpuraToggle');
        const tanpuraSwitchLabel = document.getElementById('tanpuraSwitchLabel');
        const tanpuraVolume = document.getElementById('tanpuraVolume');
        if (!tanpuraToggle) return;

        // Set default volume to 25%
        if (tanpuraVolume) {
            tanpuraVolume.value = 0.25;
        }

        tanpuraToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.playTanpura();
                if (tanpuraSwitchLabel) tanpuraSwitchLabel.textContent = 'On';
            } else {
                this.stopTanpura();
                if (tanpuraSwitchLabel) tanpuraSwitchLabel.textContent = 'Off';
            }
        });

        // Volume slider event
        if (tanpuraVolume) {
            tanpuraVolume.addEventListener('input', (e) => {
                if (this.tanpuraAudio) {
                    this.tanpuraAudio.volume = parseFloat(e.target.value);
                }
            });
        }

        // Also update tanpura if key changes while toggle is on
        document.getElementById('keySelect').addEventListener('change', (e) => {
            if (tanpuraToggle.checked) {
                this.playTanpura();
            }
        });
    }

    playTanpura() {
        this.stopTanpura();
        const key = this.currentKey;
        const fileKey = key.replace(/#/g, 's');
        const url = `sounds/tanpura/${fileKey}.mp3`;
        this.tanpuraAudio = new Audio(url);
        const tanpuraVolume = document.getElementById('tanpuraVolume');
        this.tanpuraAudio.volume = tanpuraVolume ? parseFloat(tanpuraVolume.value) : 0.25;
        this.tanpuraAudio.loop = true;
        this.tanpuraAudio.play();
    }

    stopTanpura() {
        if (this.tanpuraAudio) {
            this.tanpuraAudio.pause();
            this.tanpuraAudio.currentTime = 0;
            this.tanpuraAudio = null;
        }
    }

    // --- Tabla logic (HTML5 audio version) ---
    playTaal() {
        this.stopTaal();
        const taalKey = this.currentTaal.toLowerCase();
        const audioPath = this.audioFiles[taalKey]?.[this.currentKey]?.[this.currentBpm];
        if (!audioPath) {
            console.error('Audio file not found for the selected BPM and key', {
                currentTaal: taalKey,
                currentKey: this.currentKey,
                currentBpm: this.currentBpm,
                audioFiles: this.audioFiles
            });
            return;
        }
        this.tablaAudio = new Audio(audioPath);
        this.tablaAudio.loop = true;
        // On iOS, .play() must be called in direct response to user gesture
        // So ensure this is only called from Play button event
        this.tablaAudio.play().catch((e) => {
            // iOS may block autoplay, so show a message if needed
            console.warn('Tabla audio play() was blocked:', e);
        });
        // Show the matra index
        const matraText = document.getElementById('matraText');
        matraText.style.display = 'block';
        this.startMatraCounter();
    }

    stopTaal() {
        if (this.tablaAudio) {
            this.tablaAudio.pause();
            this.tablaAudio.currentTime = 0;
            this.tablaAudio = null;
        }
        this.stopMatraCounter();
        this.matrasIndex = 0;
        this.updateMatraDisplay();
        const matraText = document.getElementById('matraText');
        matraText.style.display = 'none';
    }

    // --- Web Audio API version (commented for easy revert) ---
    /*
    setupTanpura() { ... }
    async playTanpura() { ... }
    stopTanpura() { ... }
    playTaal() { ... }
    stopTaal() { ... }
    */
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioBuffer = null;
        this.currentTaal = 'teentaal'; // Always lowercase
        this.currentBpm = 150;
        this.currentKey = 'Gs';
        this.matrasCount = 16; // Default for Teentaal
        this.matrasIndex = 0;
        this.intervalId = null;

        this.audioFiles = {}; // Initialize audioFiles
    }

    async loadAudio() {
        this.tanpuraAudio = null;
        const tanpuraToggle = document.getElementById('tanpuraToggle');
        const tanpuraSwitchLabel = document.getElementById('tanpuraSwitchLabel');
        const tanpuraVolume = document.getElementById('tanpuraVolume');
        if (!tanpuraToggle) return;

        // Set default volume to 25%
        if (tanpuraVolume) {
            tanpuraVolume.value = 0.25;
        }

        tanpuraToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Only start tanpura, do not affect tabla
                this.playTanpura();
                if (tanpuraSwitchLabel) tanpuraSwitchLabel.textContent = 'On';
            } else {
                // Only stop tanpura, do not affect tabla
                this.stopTanpura();
                if (tanpuraSwitchLabel) tanpuraSwitchLabel.textContent = 'Off';
            }
        });

        // Volume slider event
        if (tanpuraVolume) {
            tanpuraVolume.addEventListener('input', (e) => {
                if (this.tanpuraAudio) {
                    this.tanpuraAudio.volume = parseFloat(e.target.value);
                }
            });
        }

        // Also update tanpura if key changes while toggle is on
        document.getElementById('keySelect').addEventListener('change', (e) => {
            if (tanpuraToggle.checked) {
                this.playTanpura();
            }
        });

        // Always use lowercase for currentTaal as key
        const taalKey = this.currentTaal;
        if (this.audioFiles && this.audioFiles[taalKey]) {
            const availableKeys = Object.keys(this.audioFiles[taalKey]);
            if (availableKeys.length > 0) {
                // Only set currentKey to the first available key if the current value is not present
                if (!availableKeys.includes(this.currentKey)) {
                    this.currentKey = availableKeys[0];
                }
                this.updateKeyDisplay();
                // console.log('Default currentKey set to:', this.currentKey); // Debugging log
            } else {
                console.error('No available keys for current Taal:', taalKey);
            }
        } else {
            console.error('Audio files or current Taal not properly set during init');
        }

        // // Add debugging logs to trace audioFiles and currentTaal during initialization
        // console.log('Audio files:', this.audioFiles);
        // console.log('Current Taal:', this.currentTaal);
        // console.log('Available keys for current Taal:', Object.keys(this.audioFiles[taalKey] || {}));
    }

    setupEventListeners() {
        // Taal selection
        document.getElementById('taalSelect').addEventListener('change', (e) => {
            this.currentTaal = e.target.value.toLowerCase();
            this.matrasCount = TAAL_MATRAS_COUNT[this.currentTaal] || 0; // Use lowercase key for lookup

            // Update key dropdown for new taal
            this.updateKeyDisplay();

            // If currently playing, stop and start new taal
            if (this.audioBuffer && this.intervalId) {
                this.stopTaal();
                this.playTaal();
            }

            // Add debugging logs to trace matrasCount and currentTaal
            // console.log('Taal selected:', this.currentTaal);
            // console.log('Matras count set to:', this.matrasCount);
        });

        // Key selection
        document.getElementById('keySelect').addEventListener('change', async (e) => {
            this.currentKey = e.target.value;
            // If tanpura is on, stop and restart it with new key
            const tanpuraToggle = document.getElementById('tanpuraToggle');
            if (tanpuraToggle && tanpuraToggle.checked) {
                this.stopTanpura();
                await this.playTanpura();
            }
            // If tabla is playing, stop and restart with new key
            if (this.audioBuffer && this.intervalId) {
                this.stopTaal();
                this.playTaal();
            }
        });

        // Increase BPM
        document.getElementById('increaseBpmButton').addEventListener('click', () => {
            const availableSpeeds = Object.keys(this.audioFiles[this.currentTaal]?.[this.currentKey] || {}).map(Number).sort((a, b) => a - b);
            const currentIndex = availableSpeeds.indexOf(this.currentBpm);
            if (currentIndex < availableSpeeds.length - 1) {
                this.currentBpm = availableSpeeds[currentIndex + 1];
                this.updateBpmDisplay();
                // If already playing, restart with new BPM
                if (this.audioBuffer && this.intervalId) {
                    this.stopTaal();
                    this.playTaal();
                }
            }
        });

        // Decrease BPM
        document.getElementById('decreaseBpmButton').addEventListener('click', () => {
            const availableSpeeds = Object.keys(this.audioFiles[this.currentTaal]?.[this.currentKey] || {}).map(Number).sort((a, b) => a - b);
            const currentIndex = availableSpeeds.indexOf(this.currentBpm);
            if (currentIndex > 0) {
                this.currentBpm = availableSpeeds[currentIndex - 1];
                this.updateBpmDisplay();
                // If already playing, restart with new BPM
                if (this.audioBuffer && this.intervalId) {
                    this.stopTaal();
                    this.playTaal();
                }
            }
        });

        // Play button
        document.getElementById('playTaalButton').addEventListener('click', () => {
            this.playTaal();
        });

        // Stop button
        document.getElementById('stopTaalButton').addEventListener('click', () => {
            this.stopTaal();
        });
    }

    populateTaalOptions() {
        const taalSelect = document.getElementById('taalSelect');
        const taals = Object.keys(this.audioFiles); // Get keys from audioFiles dictionary
        taalSelect.innerHTML = taals.map(taal => {
            // Use TAAL_MATRAS_COUNT for display, fallback to empty if not found
            const matraCount = TAAL_MATRAS_COUNT[taal] || '';
            return `<option value="${taal}">${taal} ${matraCount}</option>`;
        }).join('');

        // Set default selection to currentTaal
        taalSelect.value = this.currentTaal;
    }

    updateBpmDisplay() {
        const bpmDisplay = document.getElementById('bpmValue');
        bpmDisplay.textContent = this.currentBpm;
    }

    updateKeyDisplay() {
        const keySelect = document.getElementById('keySelect');

        // Always use lowercase for currentTaal as key
        const taalKey = this.currentTaal;
        if (!this.audioFiles || !this.audioFiles[taalKey]) {
            console.error('Audio files or current Taal not properly set');
            keySelect.innerHTML = ''; // Clear options
            return;
        }

        const availableKeys = Object.keys(this.audioFiles[taalKey]);

        // Set currentKey to the first available key if not already set
        if (!availableKeys.includes(this.currentKey)) {
            this.currentKey = availableKeys[0] || this.currentKey;
        }

        keySelect.innerHTML = availableKeys.map(key => {
            // Replace 's' with '#' for display only
            const displayKey = key.replace(/s/g, '#');
            return `<option value="${key}">${displayKey}</option>`;
        }).join('');
        keySelect.value = this.currentKey;

        // console.log('Updated key dropdown with keys:', availableKeys);
        // console.log('Current key set to:', this.currentKey);
    }

    // Ensure speed change is effective by reloading audio buffer
    async playTaal() {
        // Stop any currently playing audio
        this.stopTaal();

        await this.loadAudio(); // Reload audio buffer to apply speed change

        if (!this.audioBuffer) {
            console.error('Audio buffer not loaded');
            return;
        }

        // Store the source node for later stop
        this.taalSource = this.audioContext.createBufferSource();
        this.taalSource.buffer = this.audioBuffer;
        this.taalSource.connect(this.audioContext.destination);
        this.taalSource.loop = true; // Use native sample-accurate looping

        // Schedule the first play
        const startTime = this.audioContext.currentTime;
        this.taalSource.start(startTime);

        // Show the matra index
        const matraText = document.getElementById('matraText');
        matraText.style.display = 'block';

        // Start the matra counter in sync with audio
        this.startMatraCounter();
        // No onended handler needed; native looping is gapless
    }

    // Reset matras index when stopping
    stopTaal() {
        // Stop the tabla source node if exists
        if (this.taalSource) {
            try {
                this.taalSource.onended = null;
                this.taalSource.stop();
            } catch (e) {}
            this.taalSource = null;
        }
        this.audioContext.close();
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.stopMatraCounter();
        this.matrasIndex = 0; // Reset matras index
        this.updateMatraDisplay();

        // Hide the matra index
        const matraText = document.getElementById('matraText');
        matraText.style.display = 'none';
        // Do NOT stop tanpura here; tanpura is independent
    }

    startMatraCounter() {
        if (!this.currentBpm || isNaN(this.currentBpm)) {
            console.error('Invalid BPM value:', this.currentBpm);
            this.currentBpm = 120; // Set a default BPM value
        }

        this.matrasIndex = 1;
        this.updateMatraDisplay();

        const intervalDuration = (60 / this.currentBpm) * 1000;
        this.intervalId = setInterval(() => {
            this.matrasIndex = (this.matrasIndex % this.matrasCount) + 1; // Increment by 1
            this.updateMatraDisplay();
        }, intervalDuration);
    }

    stopMatraCounter() {
        clearInterval(this.intervalId);
        this.intervalId = null;
    }

    updateMatraDisplay() {
        const matraText = document.getElementById('matraText');
        matraText.textContent = this.matrasIndex;
    }
}

async function generateAudioFiles() {
    const audioFiles = {};

    // Fetch the JSON file from the local folder
    const response = await fetch('sounds/taals/taals.json');
    const fileList = await response.json();


    fileList.forEach((fileName) => {
        const match = fileName.match(/^(.+?)_(\d+?)_(.+?)\.flac$/); // Match the naming convention
        if (match) {
            const [_, taalName, tempo, key] = match;
            // Normalize audioFiles keys to lowercase during generation
            if (!audioFiles[taalName.toLowerCase()]) {
                audioFiles[taalName.toLowerCase()] = {};
            }
            if (!audioFiles[taalName.toLowerCase()][key]) {
                audioFiles[taalName.toLowerCase()][key] = {};
            }
            audioFiles[taalName.toLowerCase()][key][tempo] = `sounds/taals/${fileName}`;
        } else {
            console.warn('File name does not match expected pattern:', fileName);
        }
    });



    return audioFiles;
}


// Initialization is now handled in etabla.html via module script
