const mongoose = require("mongoose")

const UserModel = new mongoose.Schema({
    name: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true },
    age: { type: Number, required: true },
    position: {
        type: String,
        enum: [
            "Administrador",
            "CEO",
            "Director financiero",
            "Director tecnológico",
            "Miembro del equipo",
            "Líder departamental"
        ],
        required: true
    },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    subscriptionPlan: {
        type: String,
        enum: [
            "Gratis",
            "Básica",
            "Estándar",
            "Premium"]
    },
    username: {type: String, required: true},
    twoFACode: {type: String},
    twoFAExpires: {type: Date},
    attemptsToLogin: {type: Number, default: 0},
    accountLockedUntil: {type: Date},
    isActive: {type: Boolean, default: false},
    createdAt: {type: Date, default: Date.now},
    logsData: [{
        event: String,
        date: {type: Date, default: Date.now},
        details: String
    }],
    enterprise: {type: mongoose.Schema.Types.ObjectId, ref: "Enterprise"}
})

module.exports = mongoose.model("User", UserModel)