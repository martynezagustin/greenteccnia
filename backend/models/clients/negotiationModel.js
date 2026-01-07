const mongoose = require("mongoose")

const NegotiationSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
    aspects: {
        strengths: [{ type: String }],
        weaknesses: [{ type: String }]
    },
    status: { type: String, enum: ["Perdida", "Ganada", "En proceso"], default: "En proceso" },
    lastComunication: { type: Date, default: Date.now },
    expectingCloseDate: { type: Date },
    notes: [{
        type: String
    }],
    createdBy: {
        username: { type: String },
        position: { type: String },
        date: { type: Date, default: Date.now }
    },
    updatedBy: {
        username: { type: String },
        position: { type: String },
        date: { type: Date, default: Date.now }
    }
})

module.exports = mongoose.model("Negotiation", NegotiationSchema)