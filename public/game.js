/* --- game.js (GÖRSEL GERİ BİLDİRİMLİ EN İYİ SEÇENEK MODU) --- */

console.log("game.js (Görsel Geri Bildirimli Mod) yüklendi.");

// --- AYARLAR ---
const GAME_DURATION = 90; // Test için uzun süre
const SCORE_CORRECT = 10;
const SCORE_WRONG = 5;
const FEEDBACK_DELAY = 700; // Cevap sonrası bekleme süresi (ms)

// --- 1. OYUN VERİSİ (SİZİN GİRDİĞİNİZ VERİLER - DOKUNULMADI) ---
const airports = [
    
    {
        code: "KORD", name: "Chicago", coords: [41.974, -87.907], zoom: 12,
        runways: [
            { coords: [42.0079, -87.8835], heading: 40 },
            { coords: [41.9550, -87.9420], heading: 220 },
            { coords: [41.9820, -87.8720], heading: 90 },
            { coords: [41.9820, -87.9460], heading: 270 }
        ]
    },
    {
        code: "EHAM", name: "Amsterdam", coords: [52.308, 4.768], zoom: 12,
        runways: [
            { coords: [52.3263, 4.7812], heading: 3 },
            { coords: [52.2904, 4.7774], heading: 183 },
            { coords: [52.3186, 4.7999], heading: 86 },
            { coords: [52.3163, 4.7401], heading: 266 },
            { coords: [52.3054, 4.7794], heading: 59 },
            { coords: [52.2862, 4.7295], heading: 239 },
        ]
    },
    { 
        code: "EGLL", name: "Londra", coords: [51.470, -0.454], zoom: 12,
        runways: [
            { coords: [51.4710, -0.4958], heading: 269}, 
            { coords: [51.4720, -0.4279], heading: 89}, 
        ] 
    },
    { 
        code: "EDDF", name: "Frankfurt", coords: [50.037, 8.562], zoom: 12,
        runways: [
            { coords: [50.0419, 8.5950], heading: 70}, 
            { coords: [50.0219, 8.5100], heading: 250}, 
            { coords: [50.0375, 8.5262], heading: 1}, 
            { coords: [49.9940, 8.5268], heading: 181}, 
         ] 
    },
    { code: "LTFM", name: "İstanbul", coords: [41.275, 28.742], zoom: 12,
         runways: [
            { coords: [41.2584, 28.7280], heading: 179},
            { coords: [41.3038, 28.7270], heading: 359},
         ] 
    },
    { code: "LTAI", name: "Antalya", coords: [36.908, 30.794], zoom: 13, 
        runways: [
            {coords: [36.9220, 30.7957], heading: 6},
            {coords: [36.8798, 30.7899], heading: 187}
        ] 
    },    
    {
    code: "LTAC", name: "Ankara", coords: [40.128, 32.995], zoom: 13,
    runways: [
        { coords: [40.1460, 33.0131], heading: 35 },
        { coords: [40.1097, 32.9790], heading: 215 },    
    ]
    },
    {
        code: "OMDB", name: "Dubai", coords: [25.253, 55.365], zoom: 12,
        runways: [
            { coords: [25.2710, 55.3375], heading: 299 },
            { coords: [25.2330, 55.4017], heading: 119 },   
        ]
    },
    {
        code: "RJTT", name: "Tokyo Haneda", coords: [35.549, 139.779], zoom: 13,
        runways: [
            { coords: [35.5305, 139.7894], heading: 156 }, 
            { coords: [35.5665, 139.7645], heading: 335 }, 
            { coords: [35.5725, 139.7815], heading: 35 }, 
            { coords: [35.5438, 139.7575], heading: 214 }, 
        ]
    },
    {
        code: "KJFK", name: "New York JFK", coords: [40.641, -73.778], zoom: 13,
        runways: [
            { coords: [40.6545, -73.7609], heading: 31 }, 
            { coords: [40.6187, -73.7888], heading: 211 }, 
            { coords: [40.6255, -73.7660], heading: 120 }, 
            { coords: [40.6520, -73.8246], heading: 300 }, 
        ]
    },
    {
        code: "SBGR", name: "Sao Paulo", coords: [-23.432, -46.469], zoom: 13,
        runways: [
            { coords: [-23.4235, -46.4430], heading: 73 },
            { coords: [-23.4358, -46.4910], heading: 254 },
        ]
    },
];

const targets = [
    // Asya (Şehir Adı - Havalimanı Koordinatı)
    { name: "Tokyo", coords: [35.549, 139.779] }, // Haneda (RJTT)
    { name: "Beijing", coords: [40.079, 116.603] }, // Capital (ZBAA)
    { name: "Mumbai", coords: [19.089, 72.865] }, // Chhatrapati Shivaji (VABB)
    { name: "Bangkok", coords: [13.690, 100.750] }, // Suvarnabhumi (VTBS)
    { name: "Seoul", coords: [37.460, 126.440] }, // Incheon (RKSI)
    { name: "Jakarta", coords: [-6.127, 106.655] }, // Soekarno-Hatta (WIII)

    // Avrupa (Şehir Adı - Havalimanı Koordinatı)
    { name: "London", coords: [51.470, -0.454] }, // Heathrow (EGLL)
    { name: "Paris", coords: [49.009, 2.556] }, // CDG (LFPG)
    { name: "Berlin", coords: [52.366, 13.503] }, // Brandenburg (EDDB)
    { name: "Madrid", coords: [40.483, -3.567] }, // Barajas (LEMD)
    { name: "Rome", coords: [41.799, 12.246] }, // Fiumicino (LIRF)
    { name: "Moscow", coords: [55.972, 37.414] }, // Sheremetyevo (UUEE)
    { name: "İstanbul", coords: [41.275, 28.742] }, // İGA (LTFM)
    { name: "Ankara", coords: [40.128, 32.995] }, // Esenboğa (LTAC)
    { name: "Zagreb", coords: [45.740, 16.068] }, // Franjo Tuđman (LDZA)

    // Kuzey Amerika (Şehir Adı - Havalimanı Koordinatı)
    { name: "New York", coords: [40.641, -73.778] }, // JFK (KJFK)
    { name: "Los Angeles", coords: [33.941, -118.408] }, // LAX (KLAX)
    { name: "Chicago", coords: [41.974, -87.907] }, // O'Hare (KORD)
    { name: "Toronto", coords: [43.677, -79.624] }, // Pearson (CYYZ)
    { name: "Mexico City", coords: [19.436, -99.072] }, // Benito Juárez (MMMX)
    { name: "Vancouver", coords: [49.194, -123.177] }, // Intl (CYVR)

    // Güney Amerika (Şehir Adı - Havalimanı Koordinatı)
    { name: "Rio de Janeiro", coords: [-22.813, -43.249] }, // Galeão (SBGL)
    { name: "São Paulo", coords: [-23.432, -46.469] }, // Guarulhos (SBGR)
    { name: "Buenos Aires", coords: [-34.815, -58.534] }, // Ezeiza (SAEZ)
    { name: "Medellin", coords: [6.164, -75.423] }, // J.M. Córdova (SKRG)
    { name: "Bogotá", coords: [4.701, -74.146] }, // El Dorado (SKBO)

    // Afrika (Şehir Adı - Havalimanı Koordinatı)
    { name: "Cairo", coords: [30.111, 31.406] }, // Intl (HECA)
    { name: "Cape Town", coords: [-33.971, 18.602] }, // Intl (FACT)
    { name: "Nairobi", coords: [-1.319, 36.927] }, // Jomo Kenyatta (HKJK)
    { name: "Casablanca", coords: [33.367, -7.589] }, // Mohammed V (GMMN)

    // Okyanusya (Şehir Adı - Havalimanı Koordinatı)
    { name: "Sydney", coords: [-33.939, 151.175] }, // Kingsford Smith (YSSY)
    { name: "Melbourne", coords: [-37.663, 144.844] }, // Tullamarine (YMML)
    { name: "Auckland", coords: [-37.008, 174.791] }, // Intl (NZAA)
    
    // Orta Doğu (Şehir Adı - Havalimanı Koordinatı)
    { name: "Dubai", coords: [25.253, 55.365] }, // Intl (OMDB)
    { name: "Riyadh", coords: [24.957, 46.698] }, // King Khalid (OERK)
    { name: "Tehran", coords: [35.416, 51.159] }, // Imam Khomeini (OIIE)
];

// --- GLOBAL DEĞİŞKENLER ---
let map = L.map('map', { zoomControl: false, attributionControl: false }).setView([0, 0], 2);
L.control.zoom({ position: 'topright' }).addTo(map);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri'
}).addTo(map);

let currentDeparture = null;
let currentTarget = null;
let correctBearing = null;
let score = 0;
let arrowMarkers = [];
let targetMarker = null; // YENİ: Hedef işaretçisi için
let gameActive = false;
let timeLeft = GAME_DURATION;
let timerInterval = null;
let isProcessingAnswer = false; // YENİ: Arka arkaya tıklamayı önlemek için

// --- YARDIMCI FONKSİYONLAR ---
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

// --- OYUN AKIŞI ---
function startGame() {
    gameActive = true;
    score = 0;
    timeLeft = GAME_DURATION;

    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    
    map.invalidateSize();

    document.getElementById('score').innerText = score;
    document.getElementById('time').innerText = timeLeft;
    document.getElementById('time').classList.remove('urgent');

    startNewRound();
    startTimer();
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        const timeDisplay = document.getElementById('time');
        timeDisplay.innerText = timeLeft;
        if (timeLeft <= 10) timeDisplay.classList.add('urgent');
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'flex';
    document.getElementById('final-score').innerText = score;
}

// --- GÜNCELLENMİŞ CEVAP KONTROLÜ (Görsel Geri Bildirimli) ---
function checkAnswer(selectedHeading, selectedMarkerElement) {
    // Eğer oyun aktif değilse veya zaten bir cevap işleniyorsa (renkler gösteriliyorsa) çık.
    if (!gameActive || isProcessingAnswer) return;

    isProcessingAnswer = true; // Cevap işleniyor bayrağını kaldır
    
    // 1. Seçilen pistin hedeften farkını bul
    const selectedDifference = getAngleDifference(selectedHeading, correctBearing);
    console.log(`Seçilen Açı: ${selectedHeading}°, Hedef Açı: ${Math.round(correctBearing)}°, Fark: ${Math.round(selectedDifference)}°`);

    // 2. En iyi (en küçük) farkı ve o farka sahip açıyı bul
    let minDifference = 360;
    let bestHeading = -1;
    currentDeparture.runways.forEach(runway => {
        const diff = getAngleDifference(runway.heading, correctBearing);
        if (diff < minDifference) {
            minDifference = diff;
            bestHeading = runway.heading;
        }
    });

    console.log(`Bu havalimanı için mümkün olan en iyi fark: ${Math.round(minDifference)}° (Açı: ${bestHeading}°)`);

    // 3. KARŞILAŞTIRMA ve GÖRSELLEŞTİRME
    const isCorrect = selectedDifference <= minDifference + 0.1;

    if (isCorrect) {
        score += SCORE_CORRECT;
        console.log(`✅ DOĞRU! (En iyi seçenek seçildi)`);
        // Seçilen doğru oku yeşil yap
        if (selectedMarkerElement) {
            selectedMarkerElement.querySelector('.runway-arrow').classList.add('correct');
        }
    } else {
        score -= SCORE_WRONG;
        console.log(`❌ YANLIŞ! (Daha iyi bir seçenek mevcuttu)`);
        // Seçilen yanlış oku kırmızı yap
        if (selectedMarkerElement) {
            selectedMarkerElement.querySelector('.runway-arrow').classList.add('wrong');
        }
        // HANGİSİNİN DOĞRU OLDUĞUNU GÖSTER:
        // Tüm okları tara, açısı 'bestHeading' ile eşleşeni bulup yeşil yap.
        arrowMarkers.forEach(marker => {
            if (marker.headingData === bestHeading) {
                const element = marker.getElement();
                if (element) {
                    element.querySelector('.runway-arrow').classList.add('correct');
                }
            }
        });
    }

    document.getElementById('score').innerText = score;
    
    // FEEDBACK_DELAY kadar bekle, sonra yeni tura geç
    setTimeout(() => {
        isProcessingAnswer = false; // Bayrağı indir, yeni tıklamalara izin ver
        startNewRound();
    }, FEEDBACK_DELAY);
}

// --- GÜNCELLENMİŞ startNewRound (Hedef Pini ve Veri Ekleme) ---
function startNewRound() {
    if (!gameActive) return;

    // Eski okları temizle
    arrowMarkers.forEach(marker => map.removeLayer(marker));
    arrowMarkers = [];

    // YENİ: Eski hedef işaretçisini temizle (varsa)
    if (targetMarker) {
        map.removeLayer(targetMarker);
        targetMarker = null;
    }

    const validAirports = airports.filter(a => a.runways && a.runways.length > 0);
    if (validAirports.length === 0) {
        alert("Hata: Henüz hiçbir havalimanı için pist verisi girilmemiş.");
        return;
    }

    currentDeparture = validAirports[getRandomInt(validAirports.length)];

    do {
        currentTarget = targets[getRandomInt(targets.length)];
    } while (
        currentDeparture.coords[0] === currentTarget.coords[0] &&
        currentDeparture.coords[1] === currentTarget.coords[1]
    );

    document.getElementById('departure-display').innerText = `KALKIŞ: ${currentDeparture.name}`;
    document.getElementById('target-display').innerText = `HEDEF: ${currentTarget.name}`;
    
    map.flyTo(currentDeparture.coords, currentDeparture.zoom, { animate: true, duration: 1.5 });
    
    // YENİ: Hedef şehre bir işaretçi (Pin) koy
    targetMarker = L.marker(currentTarget.coords).addTo(map);
    targetMarker.bindPopup(`<b>Hedef:</b> ${currentTarget.name}`);

    correctBearing = calculateCorrectBearing(currentDeparture.coords, currentTarget.coords);
    console.log(`\n--- YENİ TUR ---`);
    console.log(`${currentDeparture.name} -> ${currentTarget.name}`);
    console.log(`Gerçek Hedef Açısı: ${Math.round(correctBearing)}°`);

    // --- PİST OKLARINI YERLEŞTİR ---
    currentDeparture.runways.forEach(runway => {
        const rotatedIconHtml = `<i class="fa-solid fa-arrow-up arrow-icon" style="transform: rotate(${runway.heading}deg);"></i>`;

        const arrowIcon = L.divIcon({
            className: 'runway-marker-container',
            html: `<div class="runway-arrow">${rotatedIconHtml}</div>`,
            iconSize: [60, 60],
            iconAnchor: [30, 30]
        });

        const marker = L.marker(runway.coords, { icon: arrowIcon, interactive: true }).addTo(map);
        
        // ÖNEMLİ: Bu markerın hangi açıya ait olduğunu kendisine bir özellik olarak ekliyoruz.
        // Bunu checkAnswer fonksiyonunda doğruyu bulmak için kullanacağız.
        marker.headingData = runway.heading;

        // Tıklama olayını güncelle: Hem açıyı hem de tıklanan HTML elementini gönder
        marker.on('click', function(e) {
            // e.target tıklanan Leaflet marker objesidir. 
            // e.target.getElement() ise onun haritadaki HTML kutusudur (div).
            checkAnswer(runway.heading, e.target.getElement());
        });

        arrowMarkers.push(marker);
    });
}

window.onload = function() {
    if (typeof turf === 'undefined') {
        alert("HATA: Gerekli kütüphaneler yüklenemedi.");
        return;
    }
    const startBtn = document.getElementById('start-button');
    if(startBtn) startBtn.addEventListener('click', startGame);
    const restartBtn = document.getElementById('restart-button');
    if(restartBtn) restartBtn.addEventListener('click', () => location.reload());
};