const mongoose = require("mongoose")

const InitiativeSchema = new mongoose.Schema({
    sustainableEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: "SustainableEmployee" },
    description: { type: String },
    impact: { type: String, enum: ["Muy bajo", "Bajo", "Mediano", "Alto", "Muy alto"] },
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

module.exports = mongoose.model("Initiative", InitiativeSchema)