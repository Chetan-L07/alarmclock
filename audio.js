/**
 * Web Audio API Sound Synthesizer for Alarm App
 * Generates custom alarm ringtones programmatically with zero external dependencies.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.currentRingtone = null;
        this.isPlaying = false;
        this.loopTimer = null;
        this.volume = 0.8;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }

    /**
     * Play a single pattern based on ringtone type
     */
    playTonePattern(type, duration = 2.5) {
        this.init();
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(this.volume, now);
        masterGain.connect(ctx.destination);

        switch (type) {
            case 'digital':
                this._playDigitalBeep(ctx, masterGain, now);
                break;
            case 'chime':
                this._playMelodicChime(ctx, masterGain, now);
                break;
            case 'cyber':
                this._playCyberPulse(ctx, masterGain, now);
                break;
            case 'bell':
                this._playRadiantBell(ctx, masterGain, now);
                break;
            case 'siren':
                this._playUrgentSiren(ctx, masterGain, now);
                break;
            default:
                this._playDigitalBeep(ctx, masterGain, now);
                break;
        }
    }

    _playDigitalBeep(ctx, masterGain, now) {
        // Classic high-pitch dual beep pattern: beep-beep, beep-beep
        const beeps = [
            { start: 0.0, end: 0.12, freq: 880 },
            { start: 0.18, end: 0.30, freq: 880 },
            { start: 0.45, end: 0.57, freq: 1046.5 },
            { start: 0.63, end: 0.75, freq: 1046.5 },
            { start: 1.0, end: 1.12, freq: 880 },
            { start: 1.18, end: 1.30, freq: 880 },
            { start: 1.45, end: 1.57, freq: 1046.5 },
            { start: 1.63, end: 1.75, freq: 1046.5 }
        ];

        beeps.forEach(b => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(b.freq, now + b.start);

            gain.gain.setValueAtTime(0.35, now + b.start);
            gain.gain.exponentialRampToValueAtTime(0.001, now + b.end);

            osc.connect(gain);
            gain.connect(masterGain);

            osc.start(now + b.start);
            osc.stop(now + b.end + 0.02);
        });
    }

    _playMelodicChime(ctx, masterGain, now) {
        // Pleasant pentatonic rising & falling marimba/chime sequence (C5, E5, G5, A5, C6)
        const notes = [
            { time: 0.0, freq: 523.25, dur: 0.6 },
            { time: 0.25, freq: 659.25, dur: 0.6 },
            { time: 0.50, freq: 783.99, dur: 0.7 },
            { time: 0.75, freq: 880.00, dur: 0.7 },
            { time: 1.00, freq: 1046.50, dur: 1.2 },
            { time: 1.40, freq: 783.99, dur: 0.9 },
            { time: 1.70, freq: 1046.50, dur: 1.4 }
        ];

        notes.forEach(n => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(n.freq, now + n.time);

            // Add overtone for richness
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(n.freq * 2, now + n.time);

            gain.gain.setValueAtTime(0.5, now + n.time);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + n.time + n.dur);

            gain2.gain.setValueAtTime(0.2, now + n.time);
            gain2.gain.exponentialRampToValueAtTime(0.0001, now + n.time + (n.dur * 0.7));

            osc.connect(gain);
            osc2.connect(gain2);
            gain.connect(masterGain);
            gain2.connect(masterGain);

            osc.start(now + n.time);
            osc.stop(now + n.time + n.dur + 0.05);
            osc2.start(now + n.time);
            osc2.stop(now + n.time + n.dur + 0.05);
        });
    }

    _playCyberPulse(ctx, masterGain, now) {
        // Futuristic pulsating arpeggio with resonance
        const steps = [
            { time: 0.0, freq: 440 },
            { time: 0.15, freq: 554.37 },
            { time: 0.30, freq: 659.25 },
            { time: 0.45, freq: 880 },
            { time: 0.60, freq: 1108.73 },
            { time: 0.75, freq: 1318.51 },
            { time: 0.90, freq: 880 },
            { time: 1.05, freq: 1318.51 },
            { time: 1.20, freq: 1760 }
        ];

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.exponentialRampToValueAtTime(4500, now + 1.5);
        filter.Q.setValueAtTime(6, now);
        filter.connect(masterGain);

        steps.forEach(s => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(s.freq, now + s.time);

            gain.gain.setValueAtTime(0.3, now + s.time);
            gain.gain.exponentialRampToValueAtTime(0.001, now + s.time + 0.22);

            osc.connect(gain);
            gain.connect(filter);

            osc.start(now + s.time);
            osc.stop(now + s.time + 0.25);
        });
    }

    _playRadiantBell(ctx, masterGain, now) {
        // Deep acoustic bell with natural harmonic overtones
        const baseFreq = 587.33; // D5
        const partials = [1, 2.01, 3.02, 4.18, 5.43];
        const partialGains = [0.6, 0.35, 0.2, 0.1, 0.05];

        [0.0, 0.9, 1.8].forEach(strikeTime => {
            partials.forEach((partial, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(baseFreq * partial, now + strikeTime);

                const dur = 1.6 / (i + 1);
                gain.gain.setValueAtTime(partialGains[i] * 0.6, now + strikeTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + strikeTime + dur);

                osc.connect(gain);
                gain.connect(masterGain);

                osc.start(now + strikeTime);
                osc.stop(now + strikeTime + dur + 0.05);
            });
        });
    }

    _playUrgentSiren(ctx, masterGain, now) {
        // Fast alternating two-tone alarm for high urgency
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';

        for (let i = 0; i < 6; i++) {
            const t = now + (i * 0.35);
            const freq = (i % 2 === 0) ? 960 : 720;
            osc.frequency.setValueAtTime(freq, t);
        }

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.setValueAtTime(0.5, now + 2.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 2.25);
    }

    /**
     * Start repeating alarm sound continuously
     */
    startAlarm(type = 'digital') {
        this.stopAlarm();
        this.isPlaying = true;
        this.currentRingtone = type;
        
        const loopInterval = 2800; // ms between loops
        this.playTonePattern(type);

        this.loopTimer = setInterval(() => {
            if (this.isPlaying) {
                this.playTonePattern(this.currentRingtone);
            }
        }, loopInterval);
    }

    /**
     * Stop repeating alarm
     */
    stopAlarm() {
        this.isPlaying = false;
        if (this.loopTimer) {
            clearInterval(this.loopTimer);
            this.loopTimer = null;
        }
    }

    /**
     * Preview sound for 2.5 seconds
     */
    preview(type) {
        this.stopAlarm();
        this.playTonePattern(type);
    }
}

// Global sound engine instance
window.soundEngine = new SoundEngine();
