const mongoose = require("mongoose")

const SoftwareModel = new mongoose.Schema({
    technologyId: { type: mongoose.Schema.Types.ObjectId, ref: "Technology" },
    nameSoftware: { type: String, required: true },
    updateManagements: [{ type: mongoose.Schema.Types.ObjectId, ref: "UpdateManagement" }],
    status: { type: String, enum: ["Activo", "Inactivo", "En mantenimiento"], default: "En mantenimiento" },
    supports: [{ type: mongoose.Schema.Types.ObjectId, ref: "Support" }],
    value: { type: Number, default: 0 },
    licenseManagements: [{ type: mongoose.Schema.Types.ObjectId, ref: "LicenseManagement" }],
    securityUpdates: [{ type: mongoose.Schema.Types.ObjectId, ref: "SecurityUpdate" }],
    version: { type: String, required: true },
    vendor: { type: String, required: true },
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


module.exports = mongoose.model("Software", SoftwareModel)