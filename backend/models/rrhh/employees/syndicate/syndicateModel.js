const mongoose = require("mongoose")

const SyndicateSchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise", required: true },
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    type: {type: String, enum: ['Sindicato con personería gremial', 'Sindicato simplemente inscripto', 'Sindicato de empresa', 'Sindicato de actividad', 'Federación', 'Confederación']},
    jurisdiction: { type: String, enum: ["Internacional", "Nacional", "Provincial/Estatal", "Municipal", "Departamental"], required: true }
})

module.exports = mongoose.model("Syndicate", SyndicateSchema)
