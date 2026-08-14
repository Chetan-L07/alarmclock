/**
 * AURA Smart Alarm & Time Suite - Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // STATE & STORAGE
    // ==========================================
    let alarms = JSON.parse(localStorage.getItem('aura_alarms')) || [
        {
            id: 'alarm-default-1',
            hours: 7,
            minutes: 0,
            ampm: 'AM',
            label: 'Morning Rise & Shine ☀️',
            days: [1, 2, 3, 4, 5], // Mon-Fri
            sound: 'chime',
            volume: 0.8,
            snoozeDuration: 10,
            enabled: true
        },
        {
            id: 'alarm-default-2',
            hours: 9,
            minutes: 30,
            ampm: 'PM',
            label: 'Evening Workout & Stretch 🏋️',
            days: [1, 2, 3, 4, 5, 6, 0],
            sound: 'cyber',
            volume: 0.75,
            snoozeDuration: 5,
            enabled: false
        }
    ];

    let worldCities = JSON.parse(localStorage.getItem('aura_world_cities')) || [
        { tz: 'America/New_York', city: 'New York', country: 'USA' },
        { tz: 'Europe/London', city: 'London', country: 'UK' },
        { tz: 'Asia/Tokyo', city: 'Tokyo', country: 'Japan' },
        { tz: 'Australia/Sydney', city: 'Sydney', country: 'Australia' }
    ];

    let activeRingingAlarm = null;
    let editingAlarmId = null;
    let lastCheckedMinute = -1;

    // ==========================================
    // DOM REFERENCES
    // ==========================================
    const heroHours = document.getElementById('hero-hours');
    const heroMinutes = document.getElementById('hero-minutes');
    const heroSeconds = document.getElementById('hero-seconds');
    const heroAmpm = document.getElementById('hero-ampm');
    const heroDate = document.getElementById('hero-date');
    const heroGreeting = document.getElementById('live-greeting');
    const heroTimezone = document.getElementById('hero-timezone');
    const nextAlarmText = document.getElementById('next-alarm-text');

    const analogHour = document.getElementById('analog-hour');
    const analogMinute = document.getElementById('analog-minute');
    const analogSecond = document.getElementById('analog-second');

    // Tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const alarmCountBadge = document.getElementById('alarm-count-badge');

    // Alarms UI
    const alarmsList = document.getElementById('alarms-list');
    const alarmsEmptyState = document.getElementById('alarms-empty-state');
    const openAddAlarmBtn = document.getElementById('open-add-alarm-btn');
    const emptyAddAlarmBtn = document.getElementById('empty-add-alarm-btn');
    const quickTestBtn = document.getElementById('quick-test-btn');
    const alarmModal = document.getElementById('alarm-modal');
    const closeAlarmModalBtn = document.getElementById('close-alarm-modal-btn');
    const cancelAlarmBtn = document.getElementById('cancel-alarm-btn');
    const alarmForm = document.getElementById('alarm-form');
    const modalTitle = document.getElementById('modal-title');
    const previewSoundBtn = document.getElementById('preview-sound-btn');
    const audioEnableBtn = document.getElementById('audio-enable-btn');

    // Modal Form Inputs
    const inputHours = document.getElementById('alarm-hours');
    const inputMinutes = document.getElementById('alarm-minutes');
    const ampmAmBtn = document.getElementById('ampm-am');
    const ampmPmBtn = document.getElementById('ampm-pm');
    const inputLabel = document.getElementById('alarm-label');
    const inputSound = document.getElementById('alarm-sound');
    const inputVolume = document.getElementById('alarm-volume');
    const volLabel = document.getElementById('vol-label');
    const inputSnooze = document.getElementById('snooze-duration');
    const dayChips = document.querySelectorAll('.day-chip');
    const dayPresetBtns = document.querySelectorAll('.day-preset-btn');

    // Active Alarm Overlay
    const alarmTriggerScreen = document.getElementById('alarm-trigger-screen');
    const ringTimeDisplay = document.getElementById('ring-time-display');
    const ringLabelDisplay = document.getElementById('ring-label-display');
    const dismissAlarmBtn = document.getElementById('dismiss-alarm-btn');
    const snoozeBtns = document.querySelectorAll('.btn-snooze');

    // World Clock
    const worldClockList = document.getElementById('world-clock-list');
    const addCityBtn = document.getElementById('add-city-btn');
    const cityModal = document.getElementById('city-modal');
    const closeCityModalBtn = document.getElementById('close-city-modal-btn');
    const cancelCityBtn = document.getElementById('cancel-city-btn');
    const confirmAddCityBtn = document.getElementById('confirm-add-city-btn');
    const citySelect = document.getElementById('city-select');

    // ==========================================
    // 1. LIVE CLOCK HERO ENGINE
    // ==========================================
    function updateClock() {
        const now = new Date();
        const rawHours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const millis = now.getMilliseconds();

        // 12-hour format calculation
        const ampm = rawHours >= 12 ? 'PM' : 'AM';
        const displayHours = rawHours % 12 || 12;

        heroHours.textContent = String(displayHours).padStart(2, '0');
        heroMinutes.textContent = String(minutes).padStart(2, '0');
        heroSeconds.textContent = String(seconds).padStart(2, '0');
        heroAmpm.textContent = ampm;

        // Date readout
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        heroDate.textContent = now.toLocaleDateString(undefined, dateOptions);

        // Greeting
        if (rawHours >= 5 && rawHours < 12) {
            heroGreeting.textContent = 'Good Morning ☀️';
        } else if (rawHours >= 12 && rawHours < 17) {
            heroGreeting.textContent = 'Good Afternoon 🌤️';
        } else if (rawHours >= 17 && rawHours < 21) {
            heroGreeting.textContent = 'Good Evening 🌇';
        } else {
            heroGreeting.textContent = 'Good Night 🌙';
        }

        // Timezone
        try {
            const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const offsetHours = -now.getTimezoneOffset() / 60;
            const offsetSign = offsetHours >= 0 ? '+' : '-';
            const offsetFormatted = `UTC${offsetSign}${String(Math.abs(Math.floor(offsetHours))).padStart(2, '0')}:${String(Math.abs(now.getTimezoneOffset() % 60)).padStart(2, '0')}`;
            heroTimezone.textContent = `${tzName} (${offsetFormatted})`;
        } catch (e) {
            heroTimezone.textContent = 'Local Time';
        }

        // Analog Hands
        const secFraction = (seconds + millis / 1000) / 60;
        const minFraction = (minutes + secFraction) / 60;
        const hrFraction = ((rawHours % 12) + minFraction) / 12;

        analogSecond.style.transform = `rotate(${secFraction * 360}deg)`;
        analogMinute.style.transform = `rotate(${minFraction * 360}deg)`;
        analogHour.style.transform = `rotate(${hrFraction * 360}deg)`;

        // Alarm Ticker check every second
        checkAlarms(now);
    }

    setInterval(updateClock, 100);
    updateClock();

    // Request Web Notification permission on click
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    // ==========================================
    // 2. ALARM TRIGGER & SCHEDULER
    // ==========================================
    function checkAlarms(now) {
        const currentDay = now.getDay(); // 0 = Sun, 1 = Mon ...
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentSeconds = now.getSeconds();

        // Check only once at the beginning of each minute (second 0)
        const minuteKey = `${currentDay}-${currentHours}-${currentMinutes}`;
        if (currentSeconds === 0 && lastCheckedMinute !== minuteKey) {
            lastCheckedMinute = minuteKey;

            alarms.forEach(alarm => {
                if (!alarm.enabled) return;

                // Check day of week
                const isDayActive = alarm.days.length === 0 || alarm.days.includes(currentDay);
                if (!isDayActive) return;

                // Convert alarm hours to 24h format for comparison
                let alarm24Hours = parseInt(alarm.hours, 10);
                if (alarm.ampm === 'PM' && alarm24Hours !== 12) alarm24Hours += 12;
                if (alarm.ampm === 'AM' && alarm24Hours === 12) alarm24Hours = 0;

                if (alarm24Hours === currentHours && parseInt(alarm.minutes, 10) === currentMinutes) {
                    triggerAlarm(alarm);
                }
            });
        }
    }

    function triggerAlarm(alarm) {
        activeRingingAlarm = alarm;
        
        // Update Ring Screen
        ringTimeDisplay.textContent = `${String(alarm.hours).padStart(2, '0')}:${String(alarm.minutes).padStart(2, '0')} ${alarm.ampm}`;
        ringLabelDisplay.textContent = alarm.label || 'Alarm Notification';
        alarmTriggerScreen.classList.remove('hidden');

        // Play Synthesized Audio
        window.soundEngine.setVolume(alarm.volume || 0.8);
        window.soundEngine.startAlarm(alarm.sound || 'digital');

        // Send System Notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification(`⏰ Alarm: ${alarm.label || 'Time is up!'}`, {
                    body: `It is currently ${ringTimeDisplay.textContent}`,
                    requireInteraction: true
                });
            } catch (e) {
                console.log('Notification error:', e);
            }
        }
    }

    function dismissCurrentAlarm() {
        window.soundEngine.stopAlarm();
        alarmTriggerScreen.classList.add('hidden');

        // If alarm was set for "Once Only" (days length 0), auto disable it
        if (activeRingingAlarm && activeRingingAlarm.days.length === 0) {
            activeRingingAlarm.enabled = false;
            saveAlarms();
            renderAlarms();
        }

        activeRingingAlarm = null;
        updateNextAlarmBanner();
    }

    function snoozeCurrentAlarm(minutes) {
        window.soundEngine.stopAlarm();
        alarmTriggerScreen.classList.add('hidden');

        if (!activeRingingAlarm) return;

        const now = new Date();
        now.setMinutes(now.getMinutes() + minutes);

        const snoozeH = now.getHours() % 12 || 12;
        const snoozeM = now.getMinutes();
        const snoozeAmpm = now.getHours() >= 12 ? 'PM' : 'AM';

        const snoozedAlarm = {
            id: 'snooze-' + Date.now(),
            hours: snoozeH,
            minutes: snoozeM,
            ampm: snoozeAmpm,
            label: `[Snoozed +${minutes}m] ${activeRingingAlarm.label}`,
            days: [now.getDay()],
            sound: activeRingingAlarm.sound,
            volume: activeRingingAlarm.volume,
            snoozeDuration: activeRingingAlarm.snoozeDuration,
            enabled: true,
            isTemporarySnooze: true
        };

        alarms.push(snoozedAlarm);
        saveAlarms();
        renderAlarms();
        activeRingingAlarm = null;
        updateNextAlarmBanner();
    }

    dismissAlarmBtn.addEventListener('click', dismissCurrentAlarm);

    snoozeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mins = parseInt(btn.dataset.minutes, 10) || 5;
            snoozeCurrentAlarm(mins);
        });
    });

    // Quick 5-Second Test Trigger
    quickTestBtn.addEventListener('click', () => {
        window.soundEngine.init();
        const testAlarm = {
            id: 'test-alarm',
            hours: new Date().getHours() % 12 || 12,
            minutes: new Date().getMinutes(),
            ampm: new Date().getHours() >= 12 ? 'PM' : 'AM',
            label: '🔔 Quick 5-Second Test Alert',
            sound: 'chime',
            volume: 0.85,
            days: []
        };
        triggerAlarm(testAlarm);
    });

    // Audio status button
    audioEnableBtn.addEventListener('click', () => {
        window.soundEngine.init();
        window.soundEngine.preview('chime');
    });

    // ==========================================
    // 3. ALARM MANAGEMENT & RENDERING
    // ==========================================
    function saveAlarms() {
        localStorage.setItem('aura_alarms', JSON.stringify(alarms));
        updateNextAlarmBanner();
    }

    function renderAlarms() {
        alarmsList.innerHTML = '';
        const enabledCount = alarms.filter(a => a.enabled).length;
        alarmCountBadge.textContent = enabledCount;

        if (alarms.length === 0) {
            alarmsEmptyState.classList.remove('hidden');
            return;
        }

        alarmsEmptyState.classList.add('hidden');

        alarms.forEach(alarm => {
            const card = document.createElement('div');
            card.className = `alarm-card ${alarm.enabled ? 'active' : 'inactive'}`;
            card.id = `card-${alarm.id}`;

            const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
            let daysHtml = '';
            
            if (alarm.days.length === 0) {
                daysHtml = '<span class="tone-badge">Once Only</span>';
            } else if (alarm.days.length === 7) {
                daysHtml = '<span class="tone-badge" style="color: var(--accent-emerald); background: rgba(16,185,129,0.12)">Every day</span>';
            } else {
                daysHtml = '<div class="repeat-days-chips">' +
                    [1, 2, 3, 4, 5, 6, 0].map(d => {
                        const active = alarm.days.includes(d) ? 'on' : '';
                        return `<span class="day-dot ${active}">${dayNames[d]}</span>`;
                    }).join('') + '</div>';
            }

            const soundLabelMap = {
                digital: 'Digital Beep',
                chime: 'Melodic Chime',
                cyber: 'Cyber Pulse',
                bell: 'Radiant Bell',
                siren: 'Emergency Siren'
            };

            card.innerHTML = `
                <div class="alarm-card-header">
                    <div class="alarm-time-wrap">
                        <span class="alarm-time-main">${String(alarm.hours).padStart(2, '0')}:${String(alarm.minutes).padStart(2, '0')}</span>
                        <span class="alarm-ampm">${alarm.ampm}</span>
                    </div>
                    <label class="switch">
                        <input type="checkbox" class="alarm-toggle-checkbox" data-id="${alarm.id}" ${alarm.enabled ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="alarm-info">
                    <div class="alarm-label-text">${escapeHtml(alarm.label || 'Alarm')}</div>
                    <div class="alarm-meta-row">
                        ${daysHtml}
                        <span class="tone-badge">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                            ${soundLabelMap[alarm.sound] || 'Chime'}
                        </span>
                    </div>
                </div>
                <div class="alarm-card-actions">
                    <button class="btn-card-action test-alarm-btn" data-id="${alarm.id}" title="Test Ring">
                        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        <span>Test</span>
                    </button>
                    <button class="btn-card-action edit-alarm-btn" data-id="${alarm.id}" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        <span>Edit</span>
                    </button>
                    <button class="btn-card-action delete delete-alarm-btn" data-id="${alarm.id}" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        <span>Delete</span>
                    </button>
                </div>
            `;

            alarmsList.appendChild(card);
        });

        // Attach listeners
        document.querySelectorAll('.alarm-toggle-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const alarm = alarms.find(a => a.id === id);
                if (alarm) {
                    alarm.enabled = e.target.checked;
                    saveAlarms();
                    renderAlarms();
                }
            });
        });

        document.querySelectorAll('.delete-alarm-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.dataset.id;
                alarms = alarms.filter(a => a.id !== id);
                saveAlarms();
                renderAlarms();
            });
        });

        document.querySelectorAll('.edit-alarm-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                openEditModal(btn.dataset.id);
            });
        });

        document.querySelectorAll('.test-alarm-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const alarm = alarms.find(a => a.id === btn.dataset.id);
                if (alarm) triggerAlarm(alarm);
            });
        });

        updateNextAlarmBanner();
    }

    function updateNextAlarmBanner() {
        const enabledAlarms = alarms.filter(a => a.enabled);
        if (enabledAlarms.length === 0) {
            nextAlarmText.textContent = 'No active alarms';
            return;
        }

        const now = new Date();
        const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();
        const currentDay = now.getDay();

        let shortestDiff = Infinity;
        let nextAlarm = null;

        enabledAlarms.forEach(alarm => {
            let alarm24H = parseInt(alarm.hours, 10);
            if (alarm.ampm === 'PM' && alarm24H !== 12) alarm24H += 12;
            if (alarm.ampm === 'AM' && alarm24H === 12) alarm24H = 0;
            const alarmMinutesFromMidnight = alarm24H * 60 + parseInt(alarm.minutes, 10);

            // Determine day offset
            if (alarm.days.length === 0) {
                let diff = alarmMinutesFromMidnight - currentMinutesFromMidnight;
                if (diff <= 0) diff += 24 * 60; // next day
                if (diff < shortestDiff) {
                    shortestDiff = diff;
                    nextAlarm = alarm;
                }
            } else {
                for (let d = 0; d < 7; d++) {
                    const checkDay = (currentDay + d) % 7;
                    if (alarm.days.includes(checkDay)) {
                        let diff = (d * 24 * 60) + (alarmMinutesFromMidnight - currentMinutesFromMidnight);
                        if (d === 0 && diff <= 0) continue; // Passed today
                        if (diff < shortestDiff) {
                            shortestDiff = diff;
                            nextAlarm = alarm;
                        }
                        break;
                    }
                }
            }
        });

        if (nextAlarm && shortestDiff !== Infinity) {
            const hrs = Math.floor(shortestDiff / 60);
            const mins = shortestDiff % 60;
            let timeStr = '';
            if (hrs > 0) timeStr += `${hrs} hr${hrs > 1 ? 's' : ''} `;
            timeStr += `${mins} min${mins > 1 ? 's' : ''}`;
            nextAlarmText.textContent = `Next alarm in ${timeStr} (${nextAlarm.label || 'Alarm'})`;
        } else {
            nextAlarmText.textContent = 'No upcoming alarms';
        }
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ==========================================
    // 4. ADD / EDIT ALARM MODAL
    // ==========================================
    function openAddModal() {
        editingAlarmId = null;
        modalTitle.textContent = 'Set New Alarm';
        inputHours.value = '07';
        inputMinutes.value = '00';
        setAmpm('AM');
        inputLabel.value = '';
        inputSound.value = 'chime';
        inputVolume.value = 80;
        volLabel.textContent = '80%';
        inputSnooze.value = '10';

        // Default weekdays active
        setRepeatPreset('weekdays');
        alarmModal.classList.remove('hidden');
    }

    function openEditModal(id) {
        const alarm = alarms.find(a => a.id === id);
        if (!alarm) return;

        editingAlarmId = id;
        modalTitle.textContent = 'Edit Alarm';
        inputHours.value = String(alarm.hours).padStart(2, '0');
        inputMinutes.value = String(alarm.minutes).padStart(2, '0');
        setAmpm(alarm.ampm);
        inputLabel.value = alarm.label || '';
        inputSound.value = alarm.sound || 'chime';
        inputVolume.value = Math.round((alarm.volume || 0.8) * 100);
        volLabel.textContent = `${inputVolume.value}%`;
        inputSnooze.value = String(alarm.snoozeDuration || 10);

        // Populate days
        dayChips.forEach(chip => {
            const dayVal = parseInt(chip.querySelector('input').value, 10);
            const isChecked = alarm.days.includes(dayVal);
            chip.querySelector('input').checked = isChecked;
            chip.classList.toggle('active', isChecked);
        });

        alarmModal.classList.remove('hidden');
    }

    function setAmpm(val) {
        if (val === 'AM') {
            ampmAmBtn.classList.add('active');
            ampmPmBtn.classList.remove('active');
        } else {
            ampmPmBtn.classList.add('active');
            ampmAmBtn.classList.remove('active');
        }
    }

    ampmAmBtn.addEventListener('click', () => setAmpm('AM'));
    ampmPmBtn.addEventListener('click', () => setAmpm('PM'));

    // Volume slider label update
    inputVolume.addEventListener('input', (e) => {
        volLabel.textContent = `${e.target.value}%`;
        window.soundEngine.setVolume(e.target.value / 100);
    });

    // Sound preview
    previewSoundBtn.addEventListener('click', () => {
        window.soundEngine.setVolume(inputVolume.value / 100);
        window.soundEngine.preview(inputSound.value);
    });

    // Day chips toggle
    dayChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
                const input = chip.querySelector('input');
                input.checked = !input.checked;
            }
            chip.classList.toggle('active', chip.querySelector('input').checked);
            dayPresetBtns.forEach(b => b.classList.remove('active'));
        });
    });

    // Day presets
    function setRepeatPreset(preset) {
        dayPresetBtns.forEach(b => b.classList.toggle('active', b.dataset.preset === preset));

        dayChips.forEach(chip => {
            const dayVal = parseInt(chip.querySelector('input').value, 10);
            let shouldCheck = false;
            if (preset === 'everyday') shouldCheck = true;
            else if (preset === 'weekdays') shouldCheck = [1, 2, 3, 4, 5].includes(dayVal);
            else if (preset === 'weekends') shouldCheck = [6, 0].includes(dayVal);
            else if (preset === 'once') shouldCheck = false;

            chip.querySelector('input').checked = shouldCheck;
            chip.classList.toggle('active', shouldCheck);
        });
    }

    dayPresetBtns.forEach(btn => {
        btn.addEventListener('click', () => setRepeatPreset(btn.dataset.preset));
    });

    // Save Form
    alarmForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const selectedDays = [];
        dayChips.forEach(chip => {
            const input = chip.querySelector('input');
            if (input.checked) selectedDays.push(parseInt(input.value, 10));
        });

        const ampm = ampmAmBtn.classList.contains('active') ? 'AM' : 'PM';
        let hrs = parseInt(inputHours.value, 10) || 7;
        let mins = parseInt(inputMinutes.value, 10) || 0;

        hrs = Math.max(1, Math.min(12, hrs));
        mins = Math.max(0, Math.min(59, mins));

        if (editingAlarmId) {
            const alarm = alarms.find(a => a.id === editingAlarmId);
            if (alarm) {
                alarm.hours = hrs;
                alarm.minutes = mins;
                alarm.ampm = ampm;
                alarm.label = inputLabel.value.trim() || 'Alarm';
                alarm.days = selectedDays;
                alarm.sound = inputSound.value;
                alarm.volume = inputVolume.value / 100;
                alarm.snoozeDuration = parseInt(inputSnooze.value, 10);
                alarm.enabled = true;
            }
        } else {
            const newAlarm = {
                id: 'alarm-' + Date.now(),
                hours: hrs,
                minutes: mins,
                ampm: ampm,
                label: inputLabel.value.trim() || 'Alarm',
                days: selectedDays,
                sound: inputSound.value,
                volume: inputVolume.value / 100,
                snoozeDuration: parseInt(inputSnooze.value, 10),
                enabled: true
            };
            alarms.push(newAlarm);
        }

        saveAlarms();
        renderAlarms();
        alarmModal.classList.add('hidden');
        window.soundEngine.stopAlarm();
    });

    openAddAlarmBtn.addEventListener('click', openAddModal);
    emptyAddAlarmBtn.addEventListener('click', openAddModal);
    closeAlarmModalBtn.addEventListener('click', () => {
        alarmModal.classList.add('hidden');
        window.soundEngine.stopAlarm();
    });
    cancelAlarmBtn.addEventListener('click', () => {
        alarmModal.classList.add('hidden');
        window.soundEngine.stopAlarm();
    });

    // ==========================================
    // 5. WORLD CLOCK MODULE
    // ==========================================
    function renderWorldClock() {
        worldClockList.innerHTML = '';
        const now = new Date();

        worldCities.forEach((cityObj, index) => {
            const card = document.createElement('div');
            card.className = 'city-card';

            let timeString = '--:--';
            let dateDiffString = 'Same Day';
            let isDaytime = true;

            try {
                const options = { timeZone: cityObj.tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
                const formatter = new Intl.DateTimeFormat([], options);
                timeString = formatter.format(now);

                // Hour check for Day/Night icon
                const hrOptions = { timeZone: cityObj.tz, hour: 'numeric', hour12: false };
                const localHr = parseInt(new Intl.DateTimeFormat([], hrOptions).format(now), 10);
                isDaytime = (localHr >= 6 && localHr < 18);
            } catch (e) {
                timeString = 'Unavailable';
            }

            card.innerHTML = `
                <div class="city-header">
                    <div>
                        <div class="city-name">${cityObj.city}</div>
                        <div class="city-country">${cityObj.country}</div>
                    </div>
                    <span class="day-night-chip ${isDaytime ? 'day' : 'night'}">
                        ${isDaytime ? '☀️ DAY' : '🌙 NIGHT'}
                    </span>
                </div>
                <div class="city-time">${timeString}</div>
                <div class="city-meta">
                    <span>${cityObj.tz.split('/')[1].replace('_', ' ')}</span>
                    <button class="btn-card-action delete remove-city-btn" data-index="${index}" style="padding:2px 6px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            `;
            worldClockList.appendChild(card);
        });

        document.querySelectorAll('.remove-city-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index, 10);
                worldCities.splice(idx, 1);
                localStorage.setItem('aura_world_cities', JSON.stringify(worldCities));
                renderWorldClock();
            });
        });
    }

    setInterval(renderWorldClock, 1000);
    renderWorldClock();

    addCityBtn.addEventListener('click', () => cityModal.classList.remove('hidden'));
    closeCityModalBtn.addEventListener('click', () => cityModal.classList.add('hidden'));
    cancelCityBtn.addEventListener('click', () => cityModal.classList.add('hidden'));

    confirmAddCityBtn.addEventListener('click', () => {
        const val = citySelect.value.split('|');
        const tz = val[0];
        const city = val[1];
        const country = val[2];

        if (!worldCities.some(c => c.tz === tz)) {
            worldCities.push({ tz, city, country });
            localStorage.setItem('aura_world_cities', JSON.stringify(worldCities));
            renderWorldClock();
        }
        cityModal.classList.add('hidden');
    });

    // ==========================================
    // 6. STOPWATCH MODULE
    // ==========================================
    let swStartTime = 0;
    let swElapsedTime = 0;
    let swInterval = null;
    let swIsRunning = false;
    let swLaps = [];

    const swDisplayMin = document.getElementById('sw-min');
    const swDisplaySec = document.getElementById('sw-sec');
    const swDisplayMs = document.getElementById('sw-ms');
    const swToggleBtn = document.getElementById('sw-toggle-btn');
    const swToggleText = document.getElementById('sw-toggle-text');
    const swLapBtn = document.getElementById('sw-lap-btn');
    const swResetBtn = document.getElementById('sw-reset-btn');
    const lapsList = document.getElementById('laps-list');

    function updateStopwatchDisplay() {
        const totalMs = swElapsedTime + (swIsRunning ? (performance.now() - swStartTime) : 0);
        const mins = Math.floor(totalMs / 60000);
        const secs = Math.floor((totalMs % 60000) / 1000);
        const ms = Math.floor((totalMs % 1000) / 10);

        swDisplayMin.textContent = String(mins).padStart(2, '0');
        swDisplaySec.textContent = String(secs).padStart(2, '0');
        swDisplayMs.textContent = String(ms).padStart(2, '0');
    }

    function formatSwTime(totalMs) {
        const mins = Math.floor(totalMs / 60000);
        const secs = Math.floor((totalMs % 60000) / 1000);
        const ms = Math.floor((totalMs % 1000) / 10);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    }

    swToggleBtn.addEventListener('click', () => {
        if (!swIsRunning) {
            // Start
            swStartTime = performance.now();
            swInterval = setInterval(updateStopwatchDisplay, 10);
            swIsRunning = true;
            swToggleBtn.classList.add('running');
            swToggleText.textContent = 'Pause';
            swLapBtn.disabled = false;
            swResetBtn.disabled = false;
        } else {
            // Pause
            clearInterval(swInterval);
            swElapsedTime += performance.now() - swStartTime;
            swIsRunning = false;
            swToggleBtn.classList.remove('running');
            swToggleText.textContent = 'Resume';
        }
    });

    swLapBtn.addEventListener('click', () => {
        if (!swIsRunning && swElapsedTime === 0) return;

        const currentTotal = swElapsedTime + (swIsRunning ? (performance.now() - swStartTime) : 0);
        const previousTotal = swLaps.length > 0 ? swLaps[swLaps.length - 1].totalMs : 0;
        const splitMs = currentTotal - previousTotal;

        swLaps.push({
            lapNum: swLaps.length + 1,
            splitMs,
            totalMs: currentTotal
        });

        renderLaps();
    });

    function renderLaps() {
        lapsList.innerHTML = '';
        if (swLaps.length === 0) return;

        // Find fastest and slowest
        let minSplit = Infinity;
        let maxSplit = -Infinity;

        if (swLaps.length >= 2) {
            swLaps.forEach(lap => {
                if (lap.splitMs < minSplit) minSplit = lap.splitMs;
                if (lap.splitMs > maxSplit) maxSplit = lap.splitMs;
            });
        }

        // Render in reverse order (newest on top)
        [...swLaps].reverse().forEach(lap => {
            const item = document.createElement('div');
            let highlightClass = '';
            if (swLaps.length >= 2) {
                if (lap.splitMs === minSplit) highlightClass = 'fastest';
                if (lap.splitMs === maxSplit) highlightClass = 'slowest';
            }

            item.className = `lap-item ${highlightClass}`;
            item.innerHTML = `
                <span>Lap ${lap.lapNum}</span>
                <span>+${formatSwTime(lap.splitMs)}</span>
                <span>${formatSwTime(lap.totalMs)}</span>
            `;
            lapsList.appendChild(item);
        });
    }

    swResetBtn.addEventListener('click', () => {
        clearInterval(swInterval);
        swIsRunning = false;
        swStartTime = 0;
        swElapsedTime = 0;
        swLaps = [];
        swToggleBtn.classList.remove('running');
        swToggleText.textContent = 'Start';
        swLapBtn.disabled = true;
        swResetBtn.disabled = true;
        updateStopwatchDisplay();
        renderLaps();
    });

    // ==========================================
    // 7. COUNTDOWN TIMER MODULE
    // ==========================================
    let timerTotalSeconds = 300; // 5 mins default
    let timerRemainingSeconds = 300;
    let timerInterval = null;
    let timerIsRunning = false;

    const timerProgressRing = document.getElementById('timer-progress-ring');
    const timerDigitsDisplay = document.getElementById('timer-digits-display');
    const timerStatusText = document.getElementById('timer-status-text');
    const timerToggleBtn = document.getElementById('timer-toggle-btn');
    const timerToggleText = document.getElementById('timer-toggle-text');
    const timerResetBtn = document.getElementById('timer-reset-btn');
    const presetChips = document.querySelectorAll('.preset-chip');
    const inputTimerH = document.getElementById('timer-input-h');
    const inputTimerM = document.getElementById('timer-input-m');
    const inputTimerS = document.getElementById('timer-input-s');
    const timerInputsPanel = document.getElementById('timer-inputs-panel');

    const ringCircumference = 2 * Math.PI * 115; // r=115 -> 722.56
    timerProgressRing.style.strokeDasharray = ringCircumference;

    function updateTimerUI() {
        const hrs = Math.floor(timerRemainingSeconds / 3600);
        const mins = Math.floor((timerRemainingSeconds % 3600) / 60);
        const secs = timerRemainingSeconds % 60;

        if (hrs > 0) {
            timerDigitsDisplay.textContent = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        } else {
            timerDigitsDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }

        // Circular progress
        const fraction = timerTotalSeconds > 0 ? (timerRemainingSeconds / timerTotalSeconds) : 0;
        const offset = ringCircumference * (1 - fraction);
        timerProgressRing.style.strokeDashoffset = offset;
    }

    presetChips.forEach(chip => {
        chip.addEventListener('click', () => {
            if (timerIsRunning) return;
            presetChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            const secs = parseInt(chip.dataset.seconds, 10);
            timerTotalSeconds = secs;
            timerRemainingSeconds = secs;

            inputTimerH.value = Math.floor(secs / 3600);
            inputTimerM.value = Math.floor((secs % 3600) / 60);
            inputTimerS.value = secs % 60;

            timerStatusText.textContent = 'Ready';
            updateTimerUI();
        });
    });

    [inputTimerH, inputTimerM, inputTimerS].forEach(input => {
        input.addEventListener('change', () => {
            if (timerIsRunning) return;
            presetChips.forEach(c => c.classList.remove('active'));

            const h = parseInt(inputTimerH.value, 10) || 0;
            const m = parseInt(inputTimerM.value, 10) || 0;
            const s = parseInt(inputTimerS.value, 10) || 0;

            const total = (h * 3600) + (m * 60) + s;
            timerTotalSeconds = Math.max(1, total);
            timerRemainingSeconds = timerTotalSeconds;

            timerStatusText.textContent = 'Ready';
            updateTimerUI();
        });
    });

    timerToggleBtn.addEventListener('click', () => {
        if (!timerIsRunning) {
            // Start
            if (timerRemainingSeconds <= 0) {
                timerRemainingSeconds = timerTotalSeconds;
            }
            window.soundEngine.init();
            timerInterval = setInterval(() => {
                timerRemainingSeconds--;
                updateTimerUI();

                if (timerRemainingSeconds <= 0) {
                    clearInterval(timerInterval);
                    timerIsRunning = false;
                    timerToggleBtn.classList.remove('running');
                    timerToggleText.textContent = 'Start Timer';
                    timerStatusText.textContent = 'Completed!';
                    
                    // Trigger timer alarm
                    const timerAlarm = {
                        id: 'timer-complete',
                        hours: new Date().getHours() % 12 || 12,
                        minutes: new Date().getMinutes(),
                        ampm: new Date().getHours() >= 12 ? 'PM' : 'AM',
                        label: '⏳ Timer Countdown Finished!',
                        sound: 'cyber',
                        volume: 0.9,
                        days: []
                    };
                    triggerAlarm(timerAlarm);
                }
            }, 1000);

            timerIsRunning = true;
            timerToggleBtn.classList.add('running');
            timerToggleText.textContent = 'Pause Timer';
            timerStatusText.textContent = 'Counting Down...';
        } else {
            // Pause
            clearInterval(timerInterval);
            timerIsRunning = false;
            timerToggleBtn.classList.remove('running');
            timerToggleText.textContent = 'Resume Timer';
            timerStatusText.textContent = 'Paused';
        }
    });

    timerResetBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerIsRunning = false;
        timerRemainingSeconds = timerTotalSeconds;
        timerToggleBtn.classList.remove('running');
        timerToggleText.textContent = 'Start Timer';
        timerStatusText.textContent = 'Ready';
        updateTimerUI();
    });

    updateTimerUI();

    // ==========================================
    // 8. TABS SWITCHER
    // ==========================================
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            tabButtons.forEach(b => {
                b.classList.toggle('active', b.dataset.tab === targetTab);
                b.setAttribute('aria-selected', b.dataset.tab === targetTab);
            });

            tabPanes.forEach(pane => {
                pane.classList.toggle('active', pane.id === `pane-${targetTab}`);
            });
        });
    });

    // Initial render of alarms
    renderAlarms();
});
