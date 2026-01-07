const mongoose = require("mongoose")

const SustainableEmployeeModel = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    certifications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Certification" }],
    carbonFootprint: {
        carbonFootprintG: {
            type: Number,
            default: 0
        },
        carbonFootprintLB: {
            type: Number,
            default: 0
        },
        carbonFootprintKG: {
            type: Number,
            default: 0
        },
        carbonFootprintMT: {
            type: Number,
            default: 0
        }
    },
    initiatives: [{ type: mongoose.Schema.Types.ObjectId, ref: "Initiative" }],
    sustainabilityScore: {
        value: { type: Number, default: 0, min: 0, max: 1000 },
        lastUpdated: { type: Date, default: Date.now}
    },
    sustainabilityObjectives: [{ type: mongoose.Schema.Types.ObjectId, ref: "SustainabilityObjective" }]
})

module.exports = mongoose.model("SustainableEmployee", SustainableEmployeeModel)