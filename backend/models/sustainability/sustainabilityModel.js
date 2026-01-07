const mongoose = require("mongoose")

const SustainabilitySchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise" },
    dataSustainability: {
        consumptionKwh: {
            value: { type: Number, default: 0 },
            unit: { type: String, enum: ["kWh"] },
        },
        waterConsumption: {
            value: { type: Number, default: 0 },
            unit: { type: String, enum: ["litros", "galones", "onzas", "m³"] },
        },
        waste: {
            value: { type: Number, default: 0 },
            unit: { type: String, enum: ["kg", "lbs", "t"] },
        },
        CO2emissions: {
            value: { type: Number, default: 0 },
            unit: { type: String, enum: ["kg"], default: "kg" },
        }
    },
    carbonFootprint: {
        carbonFootprintG: { type: Number, default: 0 },
        carbonFootprintLB: { type: Number, default: 0 },
        carbonFootprintKG: { type: Number, default: 0 },
        carbonFootprintMT: { type: Number, default: 0 }
    },
    sustainablePolitics: [{ type: mongoose.Schema.Types.ObjectId, ref: "SustainablePolitic" }],
    sustainableTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "SustainableTask" }],
    sustainableObjectives: [{ type: mongoose.Schema.Types.ObjectId, ref: "SustainableObjective" }],
    audits: [{ type: mongoose.Schema.Types.ObjectId, ref: "Audit" }],
    legalRequirements: [{ type: mongoose.Schema.Types.ObjectId, ref: "LegalRequirement" }],
    treesToReplace: { type: Number },
    sustainabilityScore: {
        value: {
            type: Number, min: 0, max: 1000, default: 0
        },
        lastUpdated: { type: Date, default: Date.now }
    },
    estimatedSavings: {
        consumptionKwh: {
            value: { type: Number, default: 0 },
            unit: { type: String, enum: ["kWh"] },
            frecuency: { type: String, enum: ["día"], default: "día" },
        },
        water: {
            value: { type: Number, default: 0 },
            unit: { type: String, enum: ["litros", "galones", "onzas", "m³"] },
            frecuency: { type: String, enum: ["día"], default: "día" },
        },
        waste: {
            value: { type: Number, default: 0 },
            unit: { type: String, enum: ["kg", "lbs", "t"] },
            frecuency: { type: String, enum: ["día"], default: "día" }
        },
        CO2: {
            value: { type: Number, default: 0 },
            unit: { type: String, enum: ["kg"], default: "kg" },
            frecuency: { type: String, enum: ["día"], default: "día" }
        }
    }
}, { timestamps: true })

module.exports = mongoose.model("Sustainability", SustainabilitySchema)