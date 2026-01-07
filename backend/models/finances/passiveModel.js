const mongoose = require("mongoose")

const PassiveSchema = new mongoose.Schema({
    financeId: { type: mongoose.Schema.Types.ObjectId, ref: "Finance" },
    category: {
        type: String,
        enum: [
            "Pasivo corriente",
            "Pasivo no corriente",
            "Pasivo contingente"
        ],
        required: true
    },
    typeAccount: { type: String, required: true },
    date: { type: Date, default: Date.now, required: true },
    amount: { type: Number, required: true },
    details: { type: String, required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: "Provider" }, //Referencia al proveedor a que pertenece el activo
    createdBy: {
        username: { type: String },
        position: { type: String },
        date: { type: Date, default: Date.now }
    },
    updatedBy: {
        username: { type: String },
        position: { type: String },
        date: { type: Date, default: Date.now }
    },
    type: { type: String, enum: ["passive"], required: true }
})

module.exports = mongoose.model("Passive", PassiveSchema)