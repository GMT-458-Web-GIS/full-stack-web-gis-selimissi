const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['user', 'admin'], 
        default: 'user' 
    },
    // --- YENİ EKLENEN KISIM ---
    highScore: { 
        type: Number, 
        default: 0 // Başlangıçta herkesin skoru 0
    }
    // -------------------------
});

module.exports = mongoose.model('User', UserSchema);