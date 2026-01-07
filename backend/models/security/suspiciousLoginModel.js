const mongoose = require("mongoose")

const SuspiciousLoginModel = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    date: { type: Date, default: Date.now },
    ip: { type: String, required: true },
    browser: { type: String, required: true },
    device: { type: String, required: true },
    os: { type: String, required: true },
    actionByUser: { type: String, enum: ["Confirmado", "Notificado", "Sospechoso"], default: "Notificado" },
    pendingActionByUser: { type: String, enum: ["Confirmado", "Notificado", "Sospechoso"], default: "Notificado" }
})

module.exports = mongoose.model("SuspiciousLogin", SuspiciousLoginModel)