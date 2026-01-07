const mongoose = require("mongoose")

const EnterpriseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    nameEnterprise: { type: String, required: true },
    address: { 
        name: {type: String, required: true },
        numberAddress: {type: String, required: true},
        apartment: {type: String}
    },
    description: { type: String },
    taxIdentificationNumber: {
        number: { type: String },
        type: { type: String, enum: ["NIF", "CUIL", "CUIT"] },
    },
    dateOfStart: { type: Date, default: Date.now, required: true },
    city: { type: String, required: true },
    stateOrProvince: { type: String, required: true },
    country: { type: String, required: true },
    companySize: {
        type: String,
        enum: [
            "1-10",
            "11-50",
            "51-100",
            "Más de 100"
        ],
        required: true
    },
    businessSector: {
        type: String,
        enum: [
            "Agrícola y agroindustria",
            "Servicio de comidas",
            "Tecnología de la información",
            "Transporte y logística",
            "Educación y capacitación",
            "Construcción e infraestructura",
            "Turismo y ocio",
            "Retail y comercio",
            "Salud",
            "Servicios financieros o legales",
            "Energías renovables",
            "Cosmética y belleza",
            "Otros"
        ],
        required: true
    },
    businessType: {
        type: String,
        enum: [
            "Startup",
            "PyME",
            "Proyecto Personal",
            "Sociedad Anónima (S.A)",
            "Sociedad de Responsabilidad Limitada (S.R.L)",
            "Empresa de triple impacto",
            "Pequeño emprendimiento sustentable"
        ],
        required: true
    },
    currency: { type: String, enum: ["ARS", "JOD", "KWD", "GBP", "USD", "EUR", "CHF", "JPY", "CAD", "CNY", "AUD", "MXN", "BRL"], required: true },
    finances: { type: mongoose.Schema.Types.ObjectId, ref: 'Finance' },
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    RRHH: { type: mongoose.Schema.Types.ObjectId, ref: 'RRHH' },
    suppliers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }],
    clients: [{ type: mongoose.Schema.Types.ObjectId, ref: "Client" }],
    technology: { type: mongoose.Schema.Types.ObjectId, ref: "Technology" },
    inventary: [{ type: mongoose.Schema.Types.ObjectId, ref: "Inventary" }],
    providers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Provider" }],
    requests: [{ type: mongoose.Schema.Types.ObjectId, ref: "MemberRequest" }],
    sustainable: { type: mongoose.Schema.Types.ObjectId, ref: "Sustainable" },
    logsData: [{
        event: String,
        date: { type: Date, default: Date.now },
        details: String,
        by: { type: String }
    }],
    certificationsAccomplished: [{ type: mongoose.Schema.Types.ObjectId, ref: "CertificationAccomplished" }],
    status: { type: Boolean, default: false },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    checked: { type: Boolean, default: false }
})

module.exports = mongoose.model("Enterprise", EnterpriseSchema) 