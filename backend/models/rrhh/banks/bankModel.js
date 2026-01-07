const mongoose = require("mongoose")

const BankSchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise", required: true },
    name: { type: String, required: true },
    shortName: { type: String, required: true },
    CUIT: { type: String, required: true },
    bicSwift: { type: String, required: true },
    supportPhone: { type: String },
    supportEmail: { type: String, match: /.+\@.+\..+/ },
    city: { type: String, required: true },
    provinceOrEstate: { type: String, required: true }
})

module.exports = mongoose.model('Bank', BankSchema)