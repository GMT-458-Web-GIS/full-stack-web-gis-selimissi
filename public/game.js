// ==========================================
// 1. KİMLİK DOĞRULAMA (AUTH) SİSTEMİ
// ==========================================
const API_URL = 'http://localhost:3000/api/auth';

async function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const msg = document.getElementById('auth-message');

    if (!username || !password) {
        msg.innerText = "Lütfen tüm alanları doldurun!";
        return;
    }

    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            msg.style.color = 'green';
            msg.innerText = "Kayıt Başarılı! Şimdi giriş yapın.";
        } else {
            msg.style.color = 'red';
            msg.innerText = data.message;
        }
    } catch (err) {
        msg.innerText = "Bağlantı hatası!";
    }
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const msg = document.getElementById('auth-message');

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (res.ok) {
            // Giriş Başarılı!
            document.getElementById('auth-panel').style.display = 'none'; 
            document.getElementById('game-container').style.display = 'block'; 
            document.getElementById('player-name').innerText = data.username;
            
            // Haritayı güncelle ve oyunu başlat
            setTimeout(() => { 
                map.invalidateSize(); 
                window.startGame(); 
            }, 100);
            
        } else {
            msg.style.color = 'red';
            msg.innerText = data.message;
        }
    } catch (err) {
        console.error(err);
        msg.innerText = "Sunucuya bağlanılamadı!";
    }
}

// ==========================================
// 2. OYUN AYARLARI VE GLOBAL DEĞİŞKENLER
// ==========================================

// Haritayı en başta oluşturuyoruz
let map = L.map('map', { zoomControl: false, attributionControl: false }).setView([20, 0], 2);
L.control.zoom({ position: 'topright' }).addTo(map);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri'
}).addTo(map);

const GAME_DURATION = 90; 
const SCORE_CORRECT = 10;
const SCORE_WRONG = 5;
const FEEDBACK_DELAY = 1000; 

let currentDeparture = null;
let currentTarget = null;
let correctBearing = null;
let score = 0;
let arrowMarkers = [];
let targetMarker = null;
let gameActive = false;
let timeLeft = GAME_DURATION;
let timerInterval = null;
let isProcessingAnswer = false;

// ==========================================
// 3. VERİ SETLERİ (TAM LİSTE GERİ GELDİ ✅)
// ==========================================

const airports = [
    { code: "KORD", name: "Chicago", coords: [41.974, -87.907], zoom: 12, runways: [{ coords: [42.0079, -87.8835], heading: 40 }, { coords: [41.9550, -87.9420], heading: 220 }, { coords: [41.9820, -87.8720], heading: 90 }, { coords: [41.9820, -87.9460], heading: 270 }] },
    { code: "EHAM", name: "Amsterdam", coords: [52.308, 4.768], zoom: 12, runways: [{ coords: [52.3263, 4.7812], heading: 3 }, { coords: [52.2904, 4.7774], heading: 183 }, { coords: [52.3186, 4.7999], heading: 86 }, { coords: [52.3163, 4.7401], heading: 266 }, { coords: [52.3054, 4.7794], heading: 59 }, { coords: [52.2862, 4.7295], heading: 239 }] },
    { code: "EGLL", name: "Londra", coords: [51.470, -0.454], zoom: 12, runways: [{ coords: [51.4710, -0.4958], heading: 269}, { coords: [51.4720, -0.4279], heading: 89}] },
    { code: "EDDF", name: "Frankfurt", coords: [50.037, 8.562], zoom: 12, runways: [{ coords: [50.0419, 8.5950], heading: 70}, { coords: [50.0219, 8.5100], heading: 250}, { coords: [50.0375, 8.5262], heading: 1}, { coords: [49.9940, 8.5268], heading: 181}] },
    { code: "LTFM", name: "İstanbul", coords: [41.275, 28.742], zoom: 12, runways: [{ coords: [41.2584, 28.7280], heading: 179}, { coords: [41.3038, 28.7270], heading: 359}] },
    { code: "LTAI", name: "Antalya", coords: [36.908, 30.794], zoom: 13, runways: [{coords: [36.9220, 30.7957], heading: 6}, {coords: [36.8798, 30.7899], heading: 187}] },    
    { code: "LTAC", name: "Ankara", coords: [40.128, 32.995], zoom: 13, runways: [{ coords: [40.1460, 33.0131], heading: 35 }, { coords: [40.1097, 32.9790], heading: 215 }] },
    { code: "OMDB", name: "Dubai", coords: [25.253, 55.365], zoom: 12, runways: [{ coords: [25.2710, 55.3375], heading: 299 }, { coords: [25.2330, 55.4017], heading: 119 }] },
    { code: "RJTT", name: "Tokyo", coords: [35.549, 139.779], zoom: 13, runways: [{ coords: [35.5305, 139.7894], heading: 156 }, { coords: [35.5665, 139.7645], heading: 335 }, { coords: [35.5725, 139.7815], heading: 35 }, { coords: [35.5438, 139.7575], heading: 214 }] },
    { code: "KJFK", name: "New York", coords: [40.641, -73.778], zoom: 13, runways: [{ coords: [40.6545, -73.7609], heading: 31 }, { coords: [40.6187, -73.7888], heading: 211 }, { coords: [40.6255, -73.7660], heading: 120 }, { coords: [40.6520, -73.8246], heading: 300 }] },
    { code: "SBGR", name: "Sao Paulo", coords: [-23.432, -46.469], zoom: 13, runways: [{ coords: [-23.4235, -46.4430], heading: 73 }, { coords: [-23.4358, -46.4910], heading: 254 }] },
];

const targets = [
    // Asya
    { name: "Tokyo", coords: [35.549, 139.779] }, 
    { name: "Beijing", coords: [40.079, 116.603] },
    { name: "Mumbai", coords: [19.089, 72.865] }, 
    { name: "Bangkok", coords: [13.690, 100.750] },
    { name: "Seoul", coords: [37.460, 126.440] },
    { name: "Jakarta", coords: [-6.127, 106.655] },

    // Avrupa
    { name: "London", coords: [51.470, -0.454] },
    { name: "Paris", coords: [49.009, 2.556] }, 
    { name: "Berlin", coords: [52.366, 13.503] }, 
    { name: "Madrid", coords: [40.483, -3.567] }, 
    { name: "Rome", coords: [41.799, 12.246] }, 
    { name: "Moscow", coords: [55.972, 37.414] }, 
    { name: "İstanbul", coords: [41.275, 28.742] }, 
    { name: "Ankara", coords: [40.128, 32.995] }, 
    { name: "Zagreb", coords: [45.740, 16.068] }, 

    // Kuzey Amerika
    { name: "New York", coords: [40.641, -73.778] }, 
    { name: "Los Angeles", coords: [33.941, -118.408] }, 
    { name: "Chicago", coords: [41.974, -87.907] }, 
    { name: "Toronto", coords: [43.677, -79.624] }, 
    { name: "Mexico City", coords: [19.436, -99.072] }, 
    { name: "Vancouver", coords: [49.194, -123.177] }, 

    // Güney Amerika
    { name: "Rio de Janeiro", coords: [-22.813, -43.249] }, 
    { name: "São Paulo", coords: [-23.432, -46.469] }, 
    { name: "Buenos Aires", coords: [-34.815, -58.534] }, 
    { name: "Medellin", coords: [6.164, -75.423] }, 
    { name: "Bogotá", coords: [4.701, -74.146] }, 

    // Afrika
    { name: "Cairo", coords: [30.111, 31.406] }, 
    { name: "Cape Town", coords: [-33.971, 18.602] }, 
    { name: "Nairobi", coords: [-1.319, 36.927] }, 
    { name: "Casablanca", coords: [33.367, -7.589] }, 

    // Okyanusya
    { name: "Sydney", coords: [-33.939, 151.175] }, 
    { name: "Melbourne", coords: [-37.663, 144.844] }, 
    { name: "Auckland", coords: [-37.008, 174.791] }, 
    
    // Orta Doğu
    { name: "Dubai", coords: [25.253, 55.365] }, 
    { name: "Riyadh", coords: [24.957, 46.698] }, 
    { name: "Tehran", coords: [35.416, 51.159] }, 
];

// ==========================================
// 4. OYUN MANTIĞI VE FONKSİYONLAR
// ==========================================

function getRandomInt(max) { return Math.floor(Math.random() * max); }

function getAngleDifference(angle1, angle2) {
    let diff = Math.abs(angle1 - angle2);
    return Math.min(diff, 360 - diff);
}

function calculateCorrectBearing(startCoords, endCoords) {
    const startPoint = turf.point([startCoords[1], startCoords[0]]);
    const endPoint = turf.point([endCoords[1], endCoords[0]]);
    let bearing = turf.bearing(startPoint, endPoint);
    if (bearing < 0) bearing += 360;
    return bearing;
}

// --- BU FONKSİYON `login` TARAFINDAN ÇAĞRILACAK ---
window.startGame = function() {
    console.log("Oyun Başlatılıyor...");
    gameActive = true;
    score = 0;
    timeLeft = GAME_DURATION;

    // Skor ve süreyi sıfırla
    document.getElementById('score').innerText = score;
    const timeDisplay = document.getElementById('time');
    if(timeDisplay) {
        timeDisplay.innerText = timeLeft;
        timeDisplay.classList.remove('urgent');
    }

    startNewRound();
    startTimer();
};

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        const timeDisplay = document.getElementById('time');
        if(timeDisplay) {
            timeDisplay.innerText = timeLeft;
            if (timeLeft <= 10) timeDisplay.classList.add('urgent');
        }
        
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    // document.getElementById('game-container').style.display = 'none'; // İstersen kapatabilirsin
    alert("Süre Doldu! Skorun: " + score + "\nYeniden başlamak için sayfayı yenileyin.");
}

function checkAnswer(selectedHeading, selectedMarkerElement) {
    if (!gameActive || isProcessingAnswer) return;
    isProcessingAnswer = true;
    
    // Doğru açıyı bul
    let minDifference = 360;
    let bestHeading = -1;
    currentDeparture.runways.forEach(runway => {
        const diff = getAngleDifference(runway.heading, correctBearing);
        if (diff < minDifference) {
            minDifference = diff;
            bestHeading = runway.heading;
        }
    });

    const selectedDifference = getAngleDifference(selectedHeading, correctBearing);
    const isCorrect = selectedDifference <= minDifference + 0.1;

    if (isCorrect) {
        score += SCORE_CORRECT;
        if (selectedMarkerElement) selectedMarkerElement.querySelector('.runway-arrow').classList.add('correct');
    } else {
        score -= SCORE_WRONG;
        if (selectedMarkerElement) selectedMarkerElement.querySelector('.runway-arrow').classList.add('wrong');
        
        // Doğru olanı göster
        arrowMarkers.forEach(marker => {
            if (marker.headingData === bestHeading) {
                const el = marker.getElement();
                if (el) el.querySelector('.runway-arrow').classList.add('correct');
            }
        });
    }

    document.getElementById('score').innerText = score;
    
    setTimeout(() => {
        isProcessingAnswer = false;
        startNewRound();
    }, FEEDBACK_DELAY);
}

function startNewRound() {
    if (!gameActive) return;

    // Temizlik
    arrowMarkers.forEach(marker => map.removeLayer(marker));
    arrowMarkers = [];
    if (targetMarker) {
        map.removeLayer(targetMarker);
        targetMarker = null;
    }

    // Yeni Rota Seçimi
    currentDeparture = airports[getRandomInt(airports.length)];
    do {
        currentTarget = targets[getRandomInt(targets.length)];
    } while (
        currentDeparture.coords[0] === currentTarget.coords[0] && 
        currentDeparture.coords[1] === currentTarget.coords[1]
    );

    // Ekrana Yaz
    const depDisplay = document.getElementById('departure-display');
    const tarDisplay = document.getElementById('target-display');
    
    if(depDisplay) depDisplay.innerText = `Kalkış: ${currentDeparture.name}`;
    if(tarDisplay) tarDisplay.innerText = `Hedef: ${currentTarget.name}`;
    
    // Haritayı Odakla
    map.flyTo(currentDeparture.coords, currentDeparture.zoom, { animate: true, duration: 1.5 });
    
    // Hedef Pinini Koy
    targetMarker = L.marker(currentTarget.coords).addTo(map)
        .bindPopup(`<b>Hedef:</b> ${currentTarget.name}`);

    // Doğru Açıyı Hesapla
    correctBearing = calculateCorrectBearing(currentDeparture.coords, currentTarget.coords);

    // Pist Oklarını Çiz
    currentDeparture.runways.forEach(runway => {
        const arrowHtml = `<i class="fa-solid fa-arrow-up arrow-icon" style="transform: rotate(${runway.heading}deg);"></i>`;
        const icon = L.divIcon({
            className: 'runway-marker-container',
            html: `<div class="runway-arrow">${arrowHtml}</div>`,
            iconSize: [60, 60],
            iconAnchor: [30, 30]
        });

        const marker = L.marker(runway.coords, { icon: icon }).addTo(map);
        marker.headingData = runway.heading;
        marker.on('click', (e) => checkAnswer(runway.heading, e.target.getElement()));
        arrowMarkers.push(marker);
    });
}