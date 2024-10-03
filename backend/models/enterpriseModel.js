const mongoose = require("mongoose")

const EnterpriseSchema = new mongoose.Schema({
    userId: {type:mongoose.Schema.Types.ObjectId, ref: "User"},
    nameEnterprise: {type: String, required: true},
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
            "Tecnología de la información",
            "Transporte y logística",
            "Educación y capacitación",
            "Construcción e infraestructura",
            "Turismo y ocio",
            "Retail y comercio",
            "Salud",
            "Servicios (financieros, legales, contables, marketing)",
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
    finances: {type: mongoose.Schema.Types.ObjectId, ref: 'Finance'},
    projects: [{type: mongoose.Schema.Types.ObjectId, ref: 'Project'}],
    humanResources: [{type: mongoose.Schema.Types.ObjectId, ref: 'HumanResource'}],
    suppliers: [{type: mongoose.Schema.Types.ObjectId, ref: 'Supplier'}],
    clients: [{type: mongoose.Schema.Types.ObjectId, ref: "Client"}],
    technologies:[{type: mongoose.Schema.Types.ObjectId, ref: "Technology"}],
    inventary: [{type: mongoose.Schema.Types.ObjectId, ref: "Inventary"}],
    sustainable: [{type: mongoose.Schema.Types.ObjectId, ref: "Sustainable"}]
})

module.exports = mongoose.model("Enterprise", EnterpriseSchema) 