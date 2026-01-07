const mongoose = require("mongoose")

const LicenseManagementSchema = new mongoose.Schema({
    softwareId: {type: mongoose.Schema.Types.ObjectId, ref: "Software"},
    description: { type: String },
    date: { type: Date, default: Date.now },
    typeLicense: {type: String, enum: ["Propietaria", "Libre", "Código Abierto (Open Source)", "Dominio Público", "Software como Servicio (SaaS)"]},
    expiration: { type: Date, default: Date.now },
    createdBy: {
        username: { type: String },
        position: { type: String },
        date: { type: Date, default: Date.now }
    },
    updatedBy: {
        username: { type: String },
        position: { type: String },
        date: { type: Date, default: Date.now }
    }
})

module.exports = mongoose.model("LicenseManagement", LicenseManagementSchema)