const mongoose = require("mongoose")

const ExpenseSchema = new mongoose.Schema({
    financeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Finance' },
    concept: String,
    date: { type: Date, default: Date.now, required: true },
    amount: Number,
    category: { type: String, enum: ["Egreso fijo", "Egreso variable", "Egreso discrecional", "Egreso de capital", "Egreso operativo"] },
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
    salary: {
        grossAmount: { type: Number },
        netAmount: { type: Number },
        liquidationId: { type: mongoose.Schema.Types.ObjectId, ref: "Liquidation" }
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
    type: { type: String, enum: ["expense"], required: true }
})

module.exports = mongoose.model("Expense", ExpenseSchema)