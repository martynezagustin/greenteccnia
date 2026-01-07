const mongoose = require("mongoose")

const ClimateConfigSchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise', required: true },
    weights: {
        satisfaction: { type: Number, default: 0.3 },
        relationshipWithTeam: { type: Number, default: 0.3 },
        absentism: { type: Number, default: 0.1 },
        workEnvironment: { type: Number, default: 0.1 },
        antiquity: { type: Number, default: 0.1 },
    }
}, { timestamps: true })

module.exports = mongoose.model('ClimateConfig', ClimateConfigSchema)