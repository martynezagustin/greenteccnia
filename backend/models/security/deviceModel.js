const mongoose = require("mongoose")

const DeviceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deviceType: { type: String, enum: ["Escritorio", "Tablet", "Móvil"] }, //puede ser el tipo de dispositivo, movil? compu?
    os: { type: String }, //el nombre del dispositivo,
    browser: { type: String },
    ip: { type: String },
    lastLogin: { type: Date, default: Date.now },
    isTrusted: { type: Boolean, default: false }
})

module.exports = mongoose.model("Device", DeviceSchema)