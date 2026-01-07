const mongoose = require("mongoose")

const ARTSchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise", required: true }, //qué empresa contrata la ART
    name: { type: String, required: true },
    CUIT: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String },
    email: { type: String, required: true, match: /.+\@.+\..+/ },
    dateOfContract: { type: Date, required: true },
    endOfContract: { type: Date, required: true }
})

module.exports = mongoose.model("ART", ARTSchema)