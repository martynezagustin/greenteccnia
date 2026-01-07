const mongoose = require("mongoose")

const IncomeSchema = new mongoose.Schema({
    financeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Finance' },
    concept: { type: String, required: true },
    date: { type: Date, default: Date.now, required: true },
    amount: { type: Number, required: true },
    category: { type: String, enum: ["Ingreso fijo", "Ingreso variable", "Ingreso extraordinario"], required: true },
    paymentMethod: {
        type: String,
        enum: [
            "Efectivo",
            "Transferencia bancaria",
            "Cheque",
            "Tarjeta de crédito",
            "Tarjeta de débito",
            "Criptomonedas",
            "Otros"
        ]
    },
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
    type: { type: String, enum: ["income"], required: true }
})

module.exports = mongoose.model("Income", IncomeSchema)