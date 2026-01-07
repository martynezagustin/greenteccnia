const mongoose = require("mongoose")
const punctualityModel = require("./performance/punctualityModel")

const EmployeeSchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: {type: Boolean, default: true}, //se presume SIEMPRE que está activo
    personalInfo: {
        name: { type: String, required: true },
        lastname: { type: String, required: true },
        gender: {
            type: String, required: true, enum: [
                "Masculino",
                "Femenino",
                "No binario",
                "Otro",
                "Prefiero no decir"
            ], default: "Prefiero no decir"
        },
        identityCard: {
            value: { type: Number, required: true },
            type: { type: String, enum: ["DNI", "Pasaporte", "Cédula de identidad", "Otro"], default: "DNI", required: true }
        },
        address: { type: String, required: true },
        phone: { type: String },
        dateOfBirthday: { type: Date, required: true },
        email: { type: String, required: true, match: /.+\@.+\..+/ },
    },
    jobInfo: {
        contractStartDate: { type: Date, required: true },
        contractEndDate: { type: Date, default: null },
        position: { type: String, required: true },
        status: { type: String, enum: ["Presencial", "Híbrido", "Remoto"], required: true },
        expectedCheckInTime: {
            type: String, default: '09:00',
            validate: {
                validator: v => !v || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v),
                message: props => `${props.value} no es una hora válida, debe ser (HH:MM)`
            }
        },
        department: {
            id: {type: mongoose.Schema.Types.ObjectId, ref: 'Department'},
            name: {type: String}
        },
        contractType: { type: String, enum: ["Contrato de trabajo a plazo fijo", "Contrato de trabajo a tiempo parcial", "Contrato de trabajo de temporada", "Contrato de trabajo eventual", "Contrato de trabajo de grupo o por equipo"] },
        CCT: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: "CCT" },
            name: { type: String },
            cctNumber: { type: String }
        },
        ART: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: "ART" },
            name: { type: String },
        },
        syndicate: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: "Syndicate" },
            name: { type: String /*required: true*/ }
        },
        contractHistory: {type: mongoose.Schema.Types.ObjectId, ref: "ContractHistory"}
    },
    financialInformation: {
        grossSalary: { type: Number, default: 0 },
        bank: { type: String },
        cbu: { type: String, match: [/^\d{22}$/, "El CBU debe contener 22 dígitos."] },
    },
    sustainability: { type: mongoose.Schema.Types.ObjectId, ref: "SustainableEmployee" },
    rrhhEnterprise: { type: mongoose.Schema.Types.ObjectId, ref: "RRHH" },
    liquidations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Liquidation" }],
    assists: [{ type: mongoose.Schema.Types.ObjectId, ref: "Assist" }],
    punctualityHistory: { type: mongoose.Schema.Types.ObjectId, ref: "PunctualityHistory" },
    paperlessWork: Boolean,
    accidents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Accident" }],
    satisfactionIndex: { type: Number, default: 0 },
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
    verifiedData: { type: Boolean, required: true },
    privacityData: { type: Boolean, required: true }
})

module.exports = mongoose.model("Employee", EmployeeSchema)