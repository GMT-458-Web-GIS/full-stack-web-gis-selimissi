const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User'); 

// ==========================================
// 1. KAYIT OL (REGISTER)
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Kullanıcı zaten var mı?
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Bu kullanıcı adı zaten alınmış!' });
        }

        // Şifreyi gizle (Hash)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Yeni kullanıcıyı oluştur 
        const newUser = new User({
            username,
            password: hashedPassword,
            role: 'user' 
        });

        await newUser.save();
        res.status(201).json({ message: 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.' });

    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
    }
});

// ==========================================
// 2. GİRİŞ YAP (LOGIN)
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Kullanıcıyı bul
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Kullanıcı bulunamadı!' });
        }

        // Şifreyi kontrol et
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Hatalı şifre!' });
        }

        // Başarılı yanıt ver
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

// ==========================================
// 3. SKOR KAYDETME (SAVE SCORE)
// ==========================================
router.post('/score', async (req, res) => {
    try {
        const { username, score } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

        // Sadece yeni skor daha yüksekse güncelle!
        if (score > user.highScore) {
            user.highScore = score;
            await user.save();
            res.json({ message: 'Yeni rekor kaydedildi! 🏆', newHighScore: true });
        } else {
            res.json({ message: 'Skor kaydedilmedi (Daha yükseği var).', newHighScore: false });
        }
    } catch (error) {
        res.status(500).json({ message: 'Skor hatası: ' + error.message });
    }
});

// ==========================================
// 4. LİDERLİK TABLOSU (GET LEADERBOARD)
// ==========================================
router.get('/leaderboard', async (req, res) => {
    try {
        // En yüksek puana göre sırala (descending -1), ilk 5'i al
        const topUsers = await User.find()
            .sort({ highScore: -1 }) 
            .limit(5)
            .select('username highScore role'); // Sadece gerekli bilgileri çek

        res.json(topUsers);
    } catch (error) {
        res.status(500).json({ message: 'Liste alınamadı' });
    }
});

// ==========================================
// 5. KULLANICI SİLME (SADECE ADMİN)
// ==========================================
router.delete('/delete/:username', async (req, res) => {
    try {
        const targetUsername = req.params.username; // Silinecek kişi
        const { adminUsername } = req.body; // Emri veren kişi

        const requester = await User.findOne({ username: adminUsername });
        if (!requester || requester.role !== 'admin') {
            return res.status(403).json({ message: 'Buna yetkiniz yok!' });
        }

        // Admin kendini silemez
        if (targetUsername === adminUsername) {
            return res.status(400).json({ message: 'Kendinizi silemezsiniz!' });
        }

        // Kullanıcıyı sil
        const deletedUser = await User.findOneAndDelete({ username: targetUsername });
        
        if (deletedUser) {
            res.json({ message: `${targetUsername} başarıyla silindi. 👋` });
        } else {
            res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Silme hatası: ' + error.message });
    }
});

module.exports = router;