const mongoose = require("mongoose")

const FinanceSchema = new mongoose.Schema({
    //acá está el id la empresa a la que pertenece el patrimonio
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise" },
    //acá están los ingresos, pertenecientes al flujo de caja
    incomes: [{
        concept: {type: String, required: true},
        date: { type: Date, default: Date.now, required: true },
        amount: {type: Number, required: true}
    }],
    //acá están los egresos, pertenecientes al flujo de caja
    expenses: [{
        concept: String,
        date: { type: Date, default: Date.now, required: true },
        amount: Number
    }],
    //acá están los activos, pertenecientes al patrimonio
    actives: [{
        typeAccount: {
            type: String,
            enum: [
                "Activo corriente",
                "Activo no corriente",
                "Activo intangible",
                "Otro activo no corriente"
            ],
            required: true
        },
        date: { type: Date, default: Date.now },
        amount: {type: Number, required: true, required:true},
        details: {type: String, required: true},
        provider: { type: mongoose.Schema.Types.ObjectId, ref: "Provider" }
    }],
    //acá están los pasivos, pertenecientes al patrimonio
    liabilities: [{
        typeAccount: {
            type: String,
            enum: [
                "Pasivo corriente",
                "Pasivo no corriente",
                "Pasivo contingente"
            ],
            required: true
        },
        date: { type: Date, default: Date.now, required: true },
        amount: {type: Number, required: true},
        details: {type: String, required: true},
        provider: { type: mongoose.Schema.Types.ObjectId, ref: "Provider" } //Referencia al proveedor a que pertenece el activo
    }],
    netWorth: {
        totalActives: Number,
        totalLiabilities: Number,
        netWorth: Number,
        date: { type: Date, default: Date.now }
    },
    cashFlow: {
        totalIncomes: {type: Number, default: 0},
        totalExpenses: {type: Number, default: 0},
        cashFlow: {type: Number, default: 0},
        date: { type: Date, default: Date.now }
    },
    logsData: [{
        event: String,
        date: {type: Date, default: Date.now},
        details: String
    }],

}, { timestamps: true })

module.exports = mongoose.model("Finance", FinanceSchema)