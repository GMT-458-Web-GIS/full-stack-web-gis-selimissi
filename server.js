const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware (Araçlar)
app.use(cors()); // Farklı kaynaklardan erişime izin ver
app.use(express.json()); // JSON verilerini okuyabilmemizi sağlar
app.use(express.static(path.join(__dirname, 'public'))); // 'public' klasöründeki dosyaları sun

// Ana Sayfa Rotası
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sunucuyu Başlat
app.listen(PORT, () => {
    console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
});