const mongoose = require("mongoose")

const WorkEnvironmentSnapshotSchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise" },
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    workEnvironmentScore: { type: Number, min: 0, max: 10, required: true },
    components: {
        satisfaction: Number,
        workEnvironments: Number,
        turnover: Number,
        absentism: Number,
        antiquity: Number
    },
    weights: {
        satisfaction: {type: Number, default: 0.4},
        workEnvironments: {type: Number, default: 0.2},
        turnover: {type: Number, default: 0.2},
        absentism: {type: Number, default: 0.1},
        antiquity: {type: Number, default: 0.1}
    }
}, { timestamps: true })

module.exports = mongoose.model('WorkEnvironmentSnapshot', WorkEnvironmentSnapshotSchema)