const mongoose = require("mongoose")

const LogUserSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    event: { type: String, required: true },
    details: { type: String, required: true },
    date: { type: Date, default: Date.now },
    clasificationSecurity: {type: String, enum: ["Normal", "Advertencia", "Error", "Crítico"], default: "Normal"},
    createdAt: {type: Date, default: Date.now, expires: '180d'}
})

module.exports = mongoose.model("LogUser", LogUserSchema)