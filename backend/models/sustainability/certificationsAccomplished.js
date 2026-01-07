const mongoose = require("mongoose")

const CertificationAccomplishedSchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise" },
    certificationName: { type: String, required: true },
    accomplished: { type: Boolean, default: false },
    checked: { type: Boolean, default: false }
})

module.exports = mongoose.model("CertificationAccomplished", CertificationAccomplishedSchema)