require('dotenv').config(); // Gizli .env dosyasındaki şifreyi okur
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const path = require('path');

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware (Araçlar)
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);

// --- MONGODB BAĞLANTISI ---
console.log('Veritabanına bağlanılıyor...');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Bağlantısı BAŞARILI!'))
    .catch((err) => console.error('❌ MongoDB Bağlantı Hatası:', err));

// Ana Sayfa Rotası
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sunucuyu Başlat
app.listen(PORT, () => {
    console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
});