const mongoose = require("mongoose")

const MemberRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise" },
    status: { type: String, enum: ["Pendiente", "Aprobado", "Rechazado", "Notificado"] },
    role: [
        "Administrador",
        "CEO",
        "Director financiero",
        "Director tecnológico",
        "Miembro del equipo",
        "Empleado",
        "Abogado",
        "Líder departamental",
        "Auxiliar"
    ]
}, { timestamps: true })

module.exports = mongoose.model("MemberRequest", MemberRequestSchema)