// eTabla Application
// This script provides functionality for Taal selection, BPM adjustment, and audio playback.

// Normalize TAAL_MATRAS_COUNT keys to lowercase for case-insensitive access
const TAAL_MATRAS_COUNT = {
    'ektaal': 12,
    'teentaal': 16,
    'jhaptaal': 10
};

class ETabla {
    // --- Tanpura logic ---
    setupTanpura() {
        this.tanpuraAudioContext = null;
        this.tanpuraSource = null;
        this.tanpuraGain = null;
        this.tanpuraBuffer = null;
        this.tanpuraBufferUrl = null;
        this.tanpuraKey = this.currentKey;
        const tanpuraToggle = document.getElementById('tanpuraToggle');
        const tanpuraSwitchLabel = document.getElementById('tanpuraSwitchLabel');
        const tanpuraVolume = document.getElementById('tanpuraVolume');
        if (!tanpuraToggle) return;

        // Set default volume to 25%
        if (tanpuraVolume) {
            tanpuraVolume.value = 0.25;
        }

        tanpuraToggle.addEventListener('change', async (e) => {
            if (e.target.checked) {
                await this.playTanpura();
                if (tanpuraSwitchLabel) tanpuraSwitchLabel.textContent = 'On';
            } else {
                this.stopTanpura();
                if (tanpuraSwitchLabel) tanpuraSwitchLabel.textContent = 'Off';
            }
        });

        // Volume slider event
        if (tanpuraVolume) {
            tanpuraVolume.addEventListener('input', (e) => {
                if (this.tanpuraGain) {
                    this.tanpuraGain.gain.value = parseFloat(e.target.value);
                }
            });
        }

        // Also update tanpura if key changes while toggle is on
        document.getElementById('keySelect').addEventListener('change', async (e) => {
            if (tanpuraToggle.checked) {
                await this.playTanpura();
            }
        });
    }

    async playTanpura() {
        // Stop any currently playing tanpura source immediately
        if (this.tanpuraSource) {
            try {
                this.tanpuraSource.onended = null;
                this.tanpuraSource.stop();
            } catch (e) {}
            this.tanpuraSource = null;
        }
        // Use a separate AudioContext for tanpura
        if (!this.tanpuraAudioContext || this.tanpuraAudioContext.state === 'closed') {
            this.tanpuraAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        const key = this.currentKey;
        // Replace # with s for file lookup
        const fileKey = key.replace(/#/g, 's');
        const url = `sounds/tanpura/${fileKey}.mp3`;

        // Load and decode the tanpura audio buffer
        try {
            if (!this.tanpuraBufferUrl || this.tanpuraBufferUrl !== url) {
                // Only fetch and decode if URL changed
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                this.tanpuraBuffer = await this.tanpuraAudioContext.decodeAudioData(arrayBuffer);
                this.tanpuraBufferUrl = url;
            }
        } catch (e) {
            console.error('Failed to load tanpura buffer:', e);
            return;
        }

        // Create a gain node for volume control
        this.tanpuraGain = this.tanpuraAudioContext.createGain();
        const tanpuraVolume = document.getElementById('tanpuraVolume');
        if (tanpuraVolume) {
            this.tanpuraGain.gain.value = parseFloat(tanpuraVolume.value) || 0.25;
        } else {
            this.tanpuraGain.gain.value = 0.25;
        }

        // Create and start the buffer source
        this.tanpuraSource = this.tanpuraAudioContext.createBufferSource();
        this.tanpuraSource.buffer = this.tanpuraBuffer;
        this.tanpuraSource.connect(this.tanpuraGain).connect(this.tanpuraAudioContext.destination);
        this.tanpuraSource.loop = false; // We'll handle looping manually
        const startTime = this.tanpuraAudioContext.currentTime;
        this.tanpuraSource.start(startTime);

        // Schedule next loop exactly at the end, but only if toggle is still ON
        this.tanpuraSource.onended = () => {
            const tanpuraToggle = document.getElementById('tanpuraToggle');
            if (tanpuraToggle && tanpuraToggle.checked) {
                this.playTanpura();
            }
        };
    }

    stopTanpura() {
        if (this.tanpuraSource) {
            try {
                this.tanpuraSource.onended = null;
                this.tanpuraSource.stop();
            } catch (e) {}
            this.tanpuraSource = null;
        }
        if (this.tanpuraGain) {
            try {
                this.tanpuraGain.disconnect();
            } catch (e) {}
            this.tanpuraGain = null;
        }
        if (this.tanpuraAudioContext) {
            try {
                this.tanpuraAudioContext.close();
            } catch (e) {}
            this.tanpuraAudioContext = null;
        }
        // Don't clear buffer or bufferUrl so we can reuse if key doesn't change
    }
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
        // Always use lowercase for currentTaal as key
        const taalKey = this.currentTaal.toLowerCase();
        if (!this.audioFiles || !this.audioFiles[taalKey]) {
            console.error('Audio files or current Taal not properly set during loadAudio', {
                currentTaal: taalKey,
                audioFiles: this.audioFiles
            });
            return;
        }

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

        try {
            const response = await fetch(audioPath);
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error('Failed to load audio file:', error);
        }
    }

    init() {
        this.currentTaal = this.currentTaal.toLowerCase();
        this.setupEventListeners();
        this.populateTaalOptions();
        this.updateBpmDisplay();
        this.setupTanpura();

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
        document.getElementById('keySelect').addEventListener('change', (e) => {
            this.currentKey = e.target.value;
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
        this.taalSource.loop = false; // We'll handle looping manually for perfect timing

        // Calculate duration in seconds
        const duration = this.audioBuffer.duration;

        // Schedule the first play
        const startTime = this.audioContext.currentTime;
        this.taalSource.start(startTime);

        // Show the matra index
        const matraText = document.getElementById('matraText');
        matraText.style.display = 'block';

        // Start the matra counter in sync with audio
        this.startMatraCounter();

        // Schedule next loop exactly at the end
        this.taalSource.onended = () => {
            // Only loop if not stopped
            if (this.taalSource) {
                this.playTaal();
            }
        };
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

    // // Debugging log to verify audioFiles structure
    // console.log('Generated audioFiles:', audioFiles);

    return audioFiles;
}

window.addEventListener('load', async () => {
    const app = new ETabla();
    app.audioFiles = await generateAudioFiles(); // Dynamically populate audioFiles

    // console.log('Audio files loaded:', app.audioFiles); // Debugging log

    // Set default currentTaal if not already set
    //app.currentTaal = Object.keys(app.audioFiles)[0] || app.currentTaal;

    // console.log('Default currentTaal set to:', app.currentTaal); // Debugging log
    app.currentTaal = 'Teentaal'; // Set default Taal to Teentaal
    app.init(); // Reinitialize the app with the dynamically generated audioFiles

    // Call updateKeyDisplay only if audioFiles and currentTaal are properly set
    if (app.audioFiles && app.audioFiles[app.currentTaal]) {
        app.updateKeyDisplay();
    } else {
        console.error('Audio files or current Taal not properly set');
    }

    window.eTablaApp = app;
});
