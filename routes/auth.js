const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Daha önce oluşturduğumuz modeli çağırıyoruz

// --- KAYIT OL (REGISTER) ---
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Kullanıcı zaten var mı?
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Bu kullanıcı adı zaten alınmış!' });
        }

        // 2. Şifreyi gizle (Hash)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Yeni kullanıcıyı oluştur
        const newUser = new User({
            username,
            password: hashedPassword,
            role: 'student' // Varsayılan rol
        });

        // 4. Kaydet
        await newUser.save();
        res.status(201).json({ message: 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.' });

    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
    }
});

// --- GİRİŞ YAP (LOGIN) ---
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Kullanıcıyı bul
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Kullanıcı bulunamadı!' });
        }

        // 2. Şifreyi kontrol et
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Hatalı şifre!' });
        }

        // 3. Başarılı yanıt ver
        res.json({ 
            message: 'Giriş başarılı!', 
            username: user.username,
            role: user.role,
            highScore: user.highScore
        });

    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
    }
});

module.exports = router;