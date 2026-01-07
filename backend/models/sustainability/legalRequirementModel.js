const mongoose = require("mongoose")

const LegalRequirementSchema = new mongoose.Schema({
    sustainabilityEnterprise: { type: mongoose.Schema.Types.ObjectId, ref: "Sustainability" },
    regulation: { type: String, required: true },
    complianceStatus: { type: Boolean, required: true, default: true },
    regulatoryAuthority: { type: String, required: true },
})

module.exports = mongoose.model("LegalRequirement", LegalRequirementSchema)