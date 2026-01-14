// ==========================================
// 1. KİMLİK DOĞRULAMA (AUTH) SİSTEMİ
// ==========================================
const API_URL = 'http://56.228.7.59:3000/api/auth';
window.currentUserRole = 'guest'; 

// --- HARİTA BAŞLATMA ---
function initializeMap() {
    if (map) { map.remove(); map = null; }
    console.log("Harita oluşturuluyor...");
    
    map = L.map('map', { zoomControl: false, attributionControl: false }).setView([20, 0], 2);
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18, attribution: 'Tiles &copy; Esri'
    }).addTo(map);
    
    setTimeout(() => { map.invalidateSize(); }, 200);
}

// --- KAYIT & GİRİŞ ---
async function register() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    const msg = document.getElementById('auth-message');
    if (!u || !p) { msg.innerText = "Alanları doldurun!"; return; }

    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: u, password: p })
        });
        const d = await res.json();
        msg.style.color = res.ok ? 'green' : 'red';
        msg.innerText = d.message;
    } catch (e) { msg.innerText = "Bağlantı hatası!"; }
}

async function login() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    const msg = document.getElementById('auth-message');

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: u, password: p })
        });
        const d = await res.json();

        if (res.ok) {
            document.getElementById('auth-panel').style.display = 'none';
            window.currentUserRole = d.role;
            let roleTxt = (d.role === 'admin') ? " (Admin 🔧)" : "";
            document.getElementById('player-name').innerText = d.username + roleTxt;
            
            initializeMap(); // Haritayı başlat
            setTimeout(() => { document.getElementById('tutorial-modal').style.display = 'flex'; }, 500);
        } else {
            msg.style.color = 'red';
            msg.innerText = d.message;
        }
    } catch (e) { msg.innerText = "Sunucuya bağlanılamadı!"; }
}

window.playAsGuest = function() {
    document.getElementById('auth-panel').style.display = 'none';
    window.currentUserRole = 'guest';
    document.getElementById('player-name').innerText = "Misafir Oyuncu 👻";
    initializeMap();
    setTimeout(() => { document.getElementById('tutorial-modal').style.display = 'flex'; }, 500);
};

// ==========================================
// 2. OYUN DEĞİŞKENLERİ
// ==========================================
let map = null;
const GAME_DURATION = 90; 
const SCORE_CORRECT = 10;
const SCORE_WRONG = 5;
const FEEDBACK_DELAY = 1000; // 1 Saniye bekleme

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
// 3. VERİ SETLERİ
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
    { name: "Tokyo", coords: [35.549, 139.779] }, { name: "Beijing", coords: [40.079, 116.603] },
    { name: "Mumbai", coords: [19.089, 72.865] }, { name: "Bangkok", coords: [13.690, 100.750] },
    { name: "Seoul", coords: [37.460, 126.440] }, { name: "Jakarta", coords: [-6.127, 106.655] },
    { name: "London", coords: [51.470, -0.454] }, { name: "Paris", coords: [49.009, 2.556] }, 
    { name: "Berlin", coords: [52.366, 13.503] }, { name: "Madrid", coords: [40.483, -3.567] }, 
    { name: "Rome", coords: [41.799, 12.246] }, { name: "Moscow", coords: [55.972, 37.414] }, 
    { name: "İstanbul", coords: [41.275, 28.742] }, { name: "Ankara", coords: [40.128, 32.995] }, 
    { name: "New York", coords: [40.641, -73.778] }, { name: "Los Angeles", coords: [33.941, -118.408] }, 
    { name: "Chicago", coords: [41.974, -87.907] }, { name: "Rio de Janeiro", coords: [-22.813, -43.249] }, 
    { name: "São Paulo", coords: [-23.432, -46.469] }, { name: "Buenos Aires", coords: [-34.815, -58.534] }, 
    { name: "Cairo", coords: [30.111, 31.406] }, { name: "Cape Town", coords: [-33.971, 18.602] }, 
    { name: "Sydney", coords: [-33.939, 151.175] }, { name: "Dubai", coords: [25.253, 55.365] }, 
];

// ==========================================
// 4. OYUN FONKSİYONLARI
// ==========================================
function getRandomInt(max) { return Math.floor(Math.random() * max); }
function getAngleDifference(a, b) { let d = Math.abs(a - b); return Math.min(d, 360 - d); }

function calculateCorrectBearing(start, end) {
    // Turf.js yüklenemezse oyunu çökertme, 0 döndür
    if (typeof turf === 'undefined') { console.error("Turf.js yüklenemedi!"); return 0; }
    try {
        const s = turf.point([start[1], start[0]]);
        const e = turf.point([end[1], end[0]]);
        let b = turf.bearing(s, e);
        return (b < 0) ? b + 360 : b;
    } catch(err) { console.error("Bearing hatası:", err); return 0; }
}

window.startGame = function() {
    console.log("Oyun başladı!");
    gameActive = true;
    score = 0;
    
    // Süre Belirle
    if (window.currentUserRole === 'admin') timeLeft = 999;
    else if (window.currentUserRole === 'user') timeLeft = 90;
    else timeLeft = 60;

    document.getElementById('score').innerText = score;
    startNewRound();
    startTimer();
};

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        const td = document.getElementById('time');
        if(td) {
            td.innerText = timeLeft;
            if(timeLeft <= 10) td.classList.add('urgent');
            else td.classList.remove('urgent');
        }
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    document.getElementById('final-score-display').innerText = score;
    
    if (window.currentUserRole !== 'guest') saveScoreToDB(score);
    document.getElementById('guest-warning').style.display = (window.currentUserRole === 'guest') ? 'block' : 'none';
    document.getElementById('game-over-modal').style.display = 'flex';
}

function checkAnswer(selectedHeading, el) {
    console.log("Cevap kontrol ediliyor...", selectedHeading);
    
    // Tıklama koruması
    if (!gameActive || isProcessingAnswer) return;
    isProcessingAnswer = true;
    
    try {
        // En doğru pisti bul
        let bestHeading = -1, minDiff = 360;
        currentDeparture.runways.forEach(r => {
            let d = getAngleDifference(r.heading, correctBearing);
            if (d < minDiff) { minDiff = d; bestHeading = r.heading; }
        });

        const isCorrect = getAngleDifference(selectedHeading, correctBearing) <= minDiff + 0.1;

        if (isCorrect) {
            console.log("Doğru!");
            score += SCORE_CORRECT;
            if(el) el.querySelector('.runway-arrow').classList.add('correct');
        } else {
            console.log("Yanlış!");
            score -= SCORE_WRONG;
            if(el) el.querySelector('.runway-arrow').classList.add('wrong');
            // Doğru olanı da göster
            arrowMarkers.forEach(m => {
                if(m.headingData === bestHeading) {
                    let elem = m.getElement();
                    if(elem) elem.querySelector('.runway-arrow').classList.add('correct');
                }
            });
        }
        document.getElementById('score').innerText = score;

    } catch(err) {
        console.error("Cevap kontrolünde hata:", err);
    }
    
    // Her halükarda yeni tura geç
    setTimeout(() => { 
        isProcessingAnswer = false; 
        startNewRound(); 
    }, FEEDBACK_DELAY);
}

function startNewRound() {
    console.log("Yeni tur hazırlanıyor...");
    if (!gameActive) return;

    try {
        // Temizlik
        arrowMarkers.forEach(m => map.removeLayer(m));
        arrowMarkers = [];
        if (targetMarker) { map.removeLayer(targetMarker); targetMarker = null; }

        // Yeni Rota
        currentDeparture = airports[getRandomInt(airports.length)];
        do { currentTarget = targets[getRandomInt(targets.length)]; } 
        while (currentDeparture === currentTarget);

        document.getElementById('departure-display').innerText = `Kalkış: ${currentDeparture.name}`;
        document.getElementById('target-display').innerText = `Hedef: ${currentTarget.name}`;
        
        map.flyTo(currentDeparture.coords, currentDeparture.zoom, { animate: true, duration: 1.5 });
        
        targetMarker = L.marker(currentTarget.coords).addTo(map).bindPopup(currentTarget.name);
        correctBearing = calculateCorrectBearing(currentDeparture.coords, currentTarget.coords);

        // Markerları ekle
        currentDeparture.runways.forEach(r => {
            const icon = L.divIcon({
                className: 'runway-marker-container',
                html: `<div class="runway-arrow"><i class="fa-solid fa-arrow-up arrow-icon" style="transform: rotate(${r.heading}deg);"></i></div>`,
                iconSize: [60, 60], iconAnchor: [30, 30]
            });
            const m = L.marker(r.coords, { icon: icon }).addTo(map);
            m.headingData = r.heading;
            
            // Tıklama Olayı
            m.on('click', (e) => {
                // Elementi güvenli şekilde al
                let element = e.target.getElement(); 
                checkAnswer(r.heading, element);
            });
            
            arrowMarkers.push(m);
        });
    } catch(err) {
        console.error("Yeni tur hatası:", err);
    }
}

// ==========================================
// 5. MODAL İŞLEMLERİ
// ==========================================
window.closeTutorialAndStart = function() {
    document.getElementById('tutorial-modal').style.display = 'none';
    window.startGame();
};

window.closeLeaderboard = function() {
    document.getElementById('leaderboard-modal').style.display = 'none';
    document.getElementById('game-over-modal').style.display = 'flex';
};

// ... Diğer veritabanı fonksiyonları (saveScore, showLeaderboard vs.) ...


async function saveScoreToDB(finalScore) {
    if (window.currentUserRole === 'guest') return;
    const rawName = document.getElementById('player-name').innerText;
    const username = rawName.split(' (')[0]; 
    try {
        await fetch(`${API_URL}/score`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, score: finalScore })
        });
    } catch (e) { console.error(e); }
}

async function showLeaderboard() {
    const listBody = document.getElementById('leaderboard-list');
    listBody.innerHTML = '<tr><td colspan="3">Yükleniyor...</td></tr>';
    document.getElementById('game-over-modal').style.display = 'none';
    document.getElementById('leaderboard-modal').style.display = 'flex';

    try {
        const res = await fetch(`${API_URL}/leaderboard`);
        const players = await res.json();
        listBody.innerHTML = ''; 
        players.forEach((p, i) => {
            let medal = (i===0)?'🥇':(i===1)?'🥈':(i===2)?'🥉':'';
            // SİLME BUTONU: Sadece Adminse göster
            let deleteBtn = '';
            if (window.currentUserRole === 'admin') {
                deleteBtn = `<button onclick="deleteUser('${p.username}')" style="margin-left:10px; color:red; cursor:pointer;">Sil</button>`;
            }
            listBody.innerHTML += `<tr><td>${medal} ${i + 1}</td><td>${p.username}</td><td><b>${p.highScore}</b> ${deleteBtn}</td></tr>`;
        });
    } catch (e) { listBody.innerHTML = '<tr><td colspan="3">Hata!</td></tr>'; }
}

window.showLeaderboardFromLogin = async function() {
    document.getElementById('auth-panel').style.display = 'none';
    await showLeaderboard(); 
    const backBtn = document.querySelector('#leaderboard-modal button');
    backBtn.onclick = function() {
        document.getElementById('leaderboard-modal').style.display = 'none';
        document.getElementById('auth-panel').style.display = 'flex';
        backBtn.onclick = window.closeLeaderboard; 
    };
};

window.deleteUser = async function(target) {
    if(!confirm('Silinsin mi?')) return;
    const admin = document.getElementById('player-name').innerText.split(' (')[0];
    try {
        const res = await fetch(`${API_URL}/delete/${target}`, {
            method: 'DELETE', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ adminUsername: admin })
        });
        if(res.ok) showLeaderboard();
        else alert('Hata');
    } catch(e) { alert('Hata'); }
};