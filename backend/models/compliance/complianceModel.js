const mongoose = require("mongoose")

const ComplianceSchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise" },
    genderParity: {
        key: 'gender_parity',
        details: {
            male: {type: Number, required: true},
            female: {type: Number, required: true},
            nonBinary: {type: Number, required: true},
            other: {type: Number, required: true},
            iPreferNotToSay: {type: Number, required: true},
            risk: {type: String, enum: ['ok', 'warning', 'critical']}
        },
        score: {type: Number}
    }
})
module.exports = mongoose.model('Compliance', ComplianceSchema)