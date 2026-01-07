const mongoose = require("mongoose")

const SustainabilityObjectivesSchema = new mongoose.Schema({
    sustainableEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: "SustainableEmployee" },
    description: { type: String },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["Pendiente", "En progreso", "Completado"], default: "Pendiente" },
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

module.exports = mongoose.model("SustainabilityObjective", SustainabilityObjectivesSchema)