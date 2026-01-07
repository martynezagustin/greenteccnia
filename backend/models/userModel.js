const mongoose = require("mongoose")

const UserModel = new mongoose.Schema({
    name: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true },
    age: { type: Number, required: true },
    gender: {
        type: "String",
        required: true,
        enum: [
            "Masculino",
            "Femenino",
            "No binario",
            "Otro",
            "Prefiero no decir",
        ],
        default: "Prefiero no decir"
    },
    address: { type: String, required: true },
    identityCard: { type: String, required: true },
    position: {
        type: String,
        enum: [
            "Administrador",
            "CEO",
            "Director financiero",
            "Director tecnológico",
            "Director de Recursos Humanos",
            "Abogado",
            "Contador",
            "Miembro del equipo",
            "Líder departamental",
            "Empleado",
            'Auxiliar'
        ],
        required: true
    },
    phone: { type: String, required: true },
    subscriptionPlan: {
        type: String,
        enum: [
            "Gratis",
            "Básica",
            "Estándar",
            "Premium"]
    },
    username: { type: String, required: true },
    security: {
        password: {
            currentPassword: { type: String, required: true },
            pendingPassword: { type: String } //para manejar actualizaciones con 2fa 
        },
        twoFA: {
            twoFACode: { type: String },
            twoFAExpires: { type: Date },
            twoFAActived: { type: Boolean, default: true },
            pendingTwoFA: { type: Boolean }
        },
        attemptsToLogin: { type: Number, default: 0 },
        accountLockedUntil: { type: Date },
        isActive: { type: Boolean, default: false },
        recoveryKey: { type: mongoose.Schema.Types.ObjectId, ref: "RecoveryKey" },
        logsData: [{ type: mongoose.Schema.Types.ObjectId }],
        inactivityPeriod: { type: Date, default: () => { new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) } }, //periodo que establece el usuario para borrar su usuario en caso de inactividad
        lastActivity: { type: Date, default: Date.now } //ult. vez que el usuario estuvo activo
    },
    enterprise: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise" }
}, { timestamps: true })

module.exports = mongoose.model("User", UserModel)