const mongoose = require("mongoose")

const LiquidationSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    grossSalary: { type: Number, required: true },
    additionalPayments: [
        {
            detail: { type: String, enum: ["Antigüedad", "Presentismo", "Horas extras", "Títulos o capacitación", "Zona desfavorable", "Turnos rotativos"] },
            amount: { type: Number }
        }
    ],
    deductions: [
        {
            concept: { type: String, enum: ["Jubilación", "Obra Social", "PAMI (Ley 19.032)", "Ganancias"] },
            amount: { type: Number }
        }
    ],
    bank: { type: String, required: true, minlength: 3 },
    employerContributions: [{
        concept: { type: String, required: true },
        employeeNum: { type: Number },
        enterpriseNum: { type: Number }
    }],
    netSalary: { type: Number, required: true },
    dateOfRemuneration: { type: Date, default: Date.now, required: true },
    createdBy: {
        username: { type: String },
        position: { type: String },
        date: {type: Date, default: Date.now}
    },
    updatedBy: {
        username: { type: String },
        position: { type: String },
        date: { type: Date, default: Date.now }
    }
})

module.exports = mongoose.model("Liquidation", LiquidationSchema)