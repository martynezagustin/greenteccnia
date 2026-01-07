const mongoose = require("mongoose")

const FinanceSchema = new mongoose.Schema({
    //acá está el id la empresa a la que pertenece el patrimonio
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise" },
    //acá están los ingresos, pertenecientes al flujo de caja
    incomes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Income' }],
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
    //acá están los egresos, pertenecientes al flujo de caja
    expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }],
    //acá están los activos, pertenecientes al patrimonio
    actives: [{ type: mongoose.Schema.Types.ObjectId, ref: "Active" }],
    //acá están los pasivos, pertenecientes al patrimonio
    liabilities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Passive' }],
    netWorth: {
        totalActives: Number,
        totalLiabilities: Number,
        netWorth: Number,
        date: { type: Date, default: Date.now }
    },
    cashFlow: {
        totalIncomes: { type: Number, default: 0 },
        totalExpenses: { type: Number, default: 0 },
        cashFlow: { type: Number, default: 0 },
        date: { type: Date, default: Date.now }
    },
    logsData: [{
        event: String,
        date: { type: Date, default: Date.now },
        details: String
    }],

}, { timestamps: true })

module.exports = mongoose.model("Finance", FinanceSchema)