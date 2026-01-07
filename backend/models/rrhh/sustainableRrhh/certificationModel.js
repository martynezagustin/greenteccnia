const mongoose = require("mongoose")

const CertificationSchema = new mongoose.Schema({
    sustainableEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: "SustainableEmployee" },
    name: { type: String },
    institution: { type: String },
    date: { type: Date, default: Date.now },
    details: { type: String },
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

module.exports = mongoose.model("Certification", CertificationSchema)