const mongoose = require("mongoose")

const SustainableTaskSchema = new mongoose.Schema({
    sustainabilityEnterprise: { type: mongoose.Schema.Types.ObjectId, ref: "Sustainability" },
    name: { type: String, required: true },
    description: { type: String, required: true },
    dateStart: { type: Date, default: Date.now, required: true },
    dateEnd: { type: Date, default: Date.now, required: true },
    impact: { type: String, enum: ["Bajo", "Mediano", "Alto"] },
    phasePDAC: {
        type: String,
        enum: ["Planificar", "Hacer", "Verificar", "Actuar"],
        required: true
    },
    auditId: { type: mongoose.Schema.Types.ObjectId, ref: "Audit" },
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
}, { timestamps: true })

SustainableTaskSchema.pre("save", function (next) {
    const oneWeekBefore = new Date(this.dateEnd)
    oneWeekBefore.setDate(this.dateEnd.getDate() - 7)

    const oneMonthBefore = new Date(this.dateEnd)
    oneMonthBefore.setDate(this.dateEnd.getMonth() - 1)

    this.notificationDate = this.dateEnd > oneMonthBefore ? oneMonthBefore : oneWeekBefore

    next()
})

module.exports = mongoose.model("SustainableTask", SustainableTaskSchema)