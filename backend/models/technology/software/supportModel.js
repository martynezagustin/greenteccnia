const mongoose = require("mongoose")

const SupportSchema = new mongoose.Schema({
    softwareId: { type: mongoose.Schema.Types.ObjectId, ref: "Software" },
    description: { type: String, required: true },
    typeSupport: {type: String, enum: ["Correctivo", "Preventivo", "Evolutivo", "Consultoría"], required: true},
    priority: {type: String, enum: ["Bajo", "Medio", "Alto"]},
    date: { type: Date, default: Date.now },
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

module.exports = mongoose.model("Support", SupportSchema)