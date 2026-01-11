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
        enum: ['user', 'admin'], // Sadece bu ikisi var artık. Misafir zaten veritabanına girmiyor.
        default: 'user' 
    }
});

module.exports = mongoose.model('User', UserSchema);