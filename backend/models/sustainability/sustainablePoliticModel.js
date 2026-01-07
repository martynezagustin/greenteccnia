const mongoose = require("mongoose")

const SustainablePoliticsSchema = new mongoose.Schema({
    sustainabilityEnterprise: { type: mongoose.Schema.Types.ObjectId, ref: "Sustainability" },
    name: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, default: Date.now, required: true },
    lastRevision: { type: Date, default: Date.now },
    objectives: [{
        sustainableObjectiveId: { type: mongoose.Schema.Types.ObjectId, ref: "SustainableObjective" },
        title: { type: String }
    }],
    scope: { type: String },
    relatedRegulations: [String],
    environmentalGoals: [{
        description: { type: String },
        indicator: { type: String },
        term: { type: Date }
    }],
    ambientalImpacts: [{
        aspect: { type: String },
        impact: { type: String, enum: ["Bajo", "Medio", "Alto"] }
    }],
    actions: [{
        description: { type: String },
        responsable: { type: String },
        state: { type: String, enum: ["Planeado", "En progreso", "Completado"] },
        dateOfEnd: { type: Date, default: Date.now }
    }],
    documents: [String],
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
}, { timestamps: true })

module.exports = mongoose.model("SustainablePolitic", SustainablePoliticsSchema)

