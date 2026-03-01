const mongoose = require("mongoose")
const Enterprise = require("../../models/enterpriseModel")
const SustainabilityEnterprise = require("../../models/sustainability/sustainabilityModel")
const CertificationAccomplished = require("../../models/sustainability/certificationsAccomplished")
const updateSustainabilityScoreEnterprise = require("../../controllers/handlers/sustainable/updateSustainabilityScoreEnterprise")
const SustainableObjective = require("../../models/sustainability/sustainableObjectiveModel")
const Technology = require("../../models/technology/technologyModel")
const RRHH = require("../../models/rrhh/rrhhModel")
const Finance = require("../../models/finances/financeModel")
const Income = require("../../models/finances/incomeModel")
const Expense = require("../../models/finances/expenseModel")
const User = require("../../models/userModel")
const getMonths = require("../helpers/getDates")
const validateCuitOrCuil = require("../handlers/global/validateCuitOrCuil")

//acá hay algunos módulos que se usan al crear la empresa.
const enterpriseController = {
    addEnterprise: async function (req, res) {
        try {
            const { nameEnterprise, address, description, taxIdentificationNumber, city, stateOrProvince, country, companySize, businessSector, businessType, currency } = req.body
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(404).json({ message: "ID de usuario inválido." })
            }
            const user = await User.findById(req.user.id)
            if (!user) {
                return res.status(404).json({ message: "No se ha encontrado tu usuario." })
            }
            if (user.enterprise) {
                return res.status(400).json({ message: "No puedes crear tu empresa si estás asociado a una o has creado una." })
            }
            if (!nameEnterprise || !address || !description || !taxIdentificationNumber || !city || !stateOrProvince || !country || !companySize || !businessSector || !businessType || !currency) return res.status(400).json({ message: "Hay campos vacíos. Vuelve a intentarlo." })
            const validTypesBusinessType = ["Startup",
                "PyME",
                "Proyecto Personal",
                "Sociedad Anónima (S.A)",
                "Sociedad de Responsabilidad Limitada (S.R.L)",
                "Empresa de triple impacto",
                "Pequeño emprendimiento sustentable"]
            if (!validTypesBusinessType.includes(businessType)) {
                return res.status(400).json({ message: "El tipo de negocio no es válido." })
            }
            console.log(taxIdentificationNumber.number)
            if (!validateCuitOrCuil(taxIdentificationNumber.number)) return res.status(400).json({ message: "El formato de CUIT/CUIL es inválido. Vuelve a intentarlo." })
            const newEnterprise = new Enterprise({ userId: user._id, nameEnterprise: businessType === "Sociedad de Responsabilidad Limitada (S.R.L)" ? nameEnterprise + " " + "S.R.L" : nameEnterprise, address, description, taxIdentificationNumber, city, stateOrProvince, country, companySize, businessSector, businessType, currency })
            user.enterprise = newEnterprise._id
            const newTechnologyEnterprise = new Technology({ enterpriseId: newEnterprise._id })
            const newRRHHEnterprise = new RRHH({ enterpriseId: newEnterprise._id })
            const newFinanceEnterprise = new Finance({ enterpriseId: newEnterprise._id })
            newEnterprise.technology = newTechnologyEnterprise
            newEnterprise.RRHH = newRRHHEnterprise
            newEnterprise.finances = newFinanceEnterprise
            await newTechnologyEnterprise.save()
            await newRRHHEnterprise.save()
            await newFinanceEnterprise.save()
            await newEnterprise.save()
            await user.save()
            res.cookie("enterpriseId", JSON.stringify({ _id: newEnterprise._id }), { httpOnly: false, secure: false, sameSite: "Lax", maxAge: 1000 * 60 * 60 })
            return res.status(200).json({ message: "Tu empresa se creó con éxito.", _id: newEnterprise._id })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    addSustainabilityOptionsToEnterprise: async function (req, res) {
        try {
            const { dataSustainability, estimatedSavings } = req.body
            if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
                return res.status(404).json({ message: "ID de usuario inválido." })
            }
            const user = await User.findById(req.user.id)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            const enterpriseIdStringify = req.cookies.enterpriseId
            const enterpriseParse = JSON.parse(enterpriseIdStringify)
            const enterprise = await Enterprise.findOne({ _id: enterpriseParse._id, userId: user._id })
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const newSustainabilityEnterprise = new SustainabilityEnterprise({
                enterpriseId: enterprise._id,
                dataSustainability,
                estimatedSavings
            })
            await newSustainabilityEnterprise.save()
            enterprise.sustainable = newSustainabilityEnterprise
            await enterprise.save()
            return res.status(200).json({ message: "Se ha actualizado la sostenibilidad." })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    addCertificationsAccomplished: async function (req, res, next) {
        try {
            const { certificationsAccomplished } = req.body
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(404).json({ message: "ID de usuario inválido." })
            }
            const user = await User.findById(req.user.id)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            const enterpriseIdStringify = req.cookies.enterpriseId
            const enterpriseParse = JSON.parse(enterpriseIdStringify)
            const enterprise = await Enterprise.findOne({ _id: enterpriseParse._id, userId: user._id })
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            console.log(req.body)
            for (const c in certificationsAccomplished) {
                if (certificationsAccomplished[c] === true) {
                    const existsCertification = await CertificationAccomplished.findOne({ enterpriseId: enterpriseParse._id, certificationName: c.trim() })
                    console.log(existsCertification);

                    if (existsCertification) return res.status(400).json({ message: "Ya existe este certificado en la empresa." })
                    const newCertificationAccomplished = new CertificationAccomplished({
                        enterpriseId: enterpriseParse._id,
                        certificationName: c,
                        accomplished: certificationsAccomplished[c],
                        checked: false
                    })
                    await newCertificationAccomplished.save()
                    enterprise.certificationsAccomplished.push(newCertificationAccomplished._id)
                }
            }
            await enterprise.save()
            return res.status(200).json({ message: "Se han completado los certificados con su estado." })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    addInitialsSustainableObjective: async function (req, res) {
        try {
            const { title, description, date, status, impact, relationWithODS } = req.body
            console.log(req.body)
            if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
                return res.status(404).json({ message: "ID de usuario inválido." })
            }
            const user = await User.findById(req.user.id)
            if (!user) return res.status(404).json({ message: "El usuario no existe." })
            const enterpriseIdStringify = req.cookies.enterpriseId
            console.log("Id de empresa?", enterpriseIdStringify)
            const enterpriseParse = JSON.parse(enterpriseIdStringify)
            const enterprise = await Enterprise.findOne({ _id: enterpriseParse._id, userId: user._id })
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const validTypesStatus = ["Pendiente", "En progreso", "Planificado", "Completado"]
            const validTypesImpact = ["Bajo", "Mediano", "Alto"]
            const validTypesRelationWithODS = ["1 - Fin de la pobreza",
                "2 - Hambre cero",
                "3 - Salud y bienestar",
                "4 - Educación de calidad",
                "5 - Igualdad de género",
                "6 - Agua limpia y saneamiento",
                "7 - Energía asequible y no contaminante",
                "8 - Trabajo decente y crecimiento económico",
                "9 - Industria, innovación e infraestructura",
                "10 - Reducción de las desigualdades",
                "11 - Ciudades y comunidades sostenibles",
                "12 - Producción y consumo responsables",
                "13 - Acción por el clima",
                "14 - Vida submarina",
                "15 - Vida de ecosistemas terrestres",
                "16 - Paz, justicia e instituciones sólidas",
                "17 - Alianzas para lograr los objetivos"]
            if (!validTypesStatus.includes(status)) {
                return res.status(400).json({ message: "El tipo de estado proporcionado no es válido." })
            }
            if (!validTypesImpact.includes(impact)) {
                return res.status(404).json({ message: "El tipo de impacto proporcionado no es válido." })
            }
            if (!validTypesRelationWithODS.includes(relationWithODS)) {
                return res.status(400).json({ message: "El Objetivo de Desarrollo Sostenible (ODS) proporcionado no es válido." })
            }
            //const createdBy = await assignAction(req, res, enterprise)
            const newSustainableObjective = new SustainableObjective({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                title,
                description,
                date,
                status,
                impact,
                relationWithODS
            })
            sustainabilityEnterprise.sustainableObjectives.push(newSustainableObjective._id)
            await newSustainableObjective.save()
            await sustainabilityEnterprise.save()
            await updateSustainabilityScoreEnterprise(sustainabilityEnterprise)
            enterprise.logsData.push({ event: "Añadido de objetivo sustentable", date: new Date(), details: "El objetivo sustentable fue añadido con éxito." /*by: createdBy.username*/ })
            await enterprise.save()
            return res.status(200).json({ message: `Has añadido el objetivo: ${newSustainableObjective.title}.` })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getEnterprise: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || enterpriseId == null || enterpriseId == undefined) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            return res.status(200).json(enterprise)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getEnterpriseId: async function (req, res) {
        try {
            const { userId } = req.params
            if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(404).json({ message: "ID de usuario inválido" })
            const enterprise = await Enterprise.findOne({ userId })
            if (!enterprise) return res.status(404).json({ message: "No hemos encontrado tu empresa." })
            return res.status(200).json(enterprise._id)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteEnterprise: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const deletedEnterprise = await Enterprise.findByIdAndDelete({
                _id: enterpriseId
            })
            if (!deletedEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            return res.status(200).json({ message: "Eliminado exitoso.", deletedEnterprise })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateEnterprise: async function (req, res) {
        try {
            const { nameEnterprise, address, description, taxIdentificationNumber, city, stateOrProvince, country, companySize, businessSector, businessType, currency } = req.body
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const updatedEnterprise = await Enterprise.findByIdAndUpdate(enterprise._id, { nameEnterprise, address, description, taxIdentificationNumber, city, stateOrProvince, country, companySize, businessSector, businessType, currency }, { new: true })
            if (!updatedEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            return res.status(200).json(updatedEnterprise)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getDashboard: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado un esquema de finanzas de la empresa." })
            //buscando el cashflow total
            const incomes = await Income.find({ financeId: financeEnterprise._id })
            const expenses = await Expense.find({ financeId: financeEnterprise._id })

            const totalValueIncomes = incomes.reduce((acc, value) => acc + value.amount, 0)
            const totalValueExpenses = expenses.reduce((acc, value) => acc + value.amount, 0)

            const getMonthDates = getMonths()
            return res.json(getMonthDates)
            // buscando el cashFlow por día
        } catch (error) {

        }
    }
}

module.exports = enterpriseController