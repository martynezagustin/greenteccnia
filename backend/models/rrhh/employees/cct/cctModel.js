const mongoose = require("mongoose")

const CCTSchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise", required: true },
    name: { type: String, required: true },
    dateOfCelebration: { type: Date, required: true },
    cctNumber: { type: String, required: true }, //ejemplo puede ser la inserción de un número como 130/75
    contractDocument: { type: String }
})

module.exports = mongoose.model("CCT", CCTSchema)