const mongoose = require("mongoose")
const SustainabilityEnterprise = require("../../models/sustainability/sustainabilityModel")
const SustainableObjective = require("../../models/sustainability/sustainableObjectiveModel")
const Enterprise = require("../../models/enterpriseModel")
const updateSustainabilityScoreEnterprise = require("../handlers/sustainable/updateSustainabilityScoreEnterprise")
const assignAction = require("../handlers/members/assignAction")

const sustainableObjectiveController = {
    addSustainableObjective: async function (req, res) {
        console.log(req.params)
        try {
            const { enterpriseId } = req.params
            const { title, description, date, status, impact, relationWithODS } = req.body
            console.log(req.body)
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
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
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSustainableObjective: async function (req, res) {
        try {
            const { enterpriseId, sustainableObjectiveId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(sustainableObjectiveId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const sustainableObjective = await SustainableObjective.findOne({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                _id: sustainableObjectiveId
            })
            if (!sustainableObjective) {
                return res.status(404).json({ message: "No se ha encontrado el objetivo sustentable." })
            }
            return res.status(200).json(sustainableObjective)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllSustainableObjectives: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const allSustainableObjectives = await SustainableObjective.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id
            })
            if (allSustainableObjectives.length === 0) {
                return res.status(404).json({ message: "No se han encontrado objetivos sustentables." })
            }
            return res.status(200).json(allSustainableObjectives)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateSustainableObjective: async function (req, res) {
        try {
            const { enterpriseId, sustainableObjectiveId } = req.params
            const { title, description, date, status, impact, relationWithODS } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(sustainableObjectiveId)) {
                return res.status(404).json({ message: "ID de empresa u objetivo sostenible inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
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
            const updatedBy = await assignAction(req, res, enterprise)
            const updatedSustainableObjective = await SustainableObjective.findOneAndUpdate({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                _id: sustainableObjectiveId
            }, {
                title, description, date, status, impact, relationWithODS, updatedBy: { username: updatedBy.username, position: updatedBy.position, date: new Date() }
            }, {
                new: true
            })
            if (!updatedSustainableObjective) {
                return res.status(404).json({ message: "No se ha encontrado el objetivo sustentable." })
            }
            await updateSustainabilityScoreEnterprise(sustainabilityEnterprise)
            enterprise.logsData.push({ event: "Actualización de objetivo sustentable", date: new Date(), details: "El objetivo sustentable fue actualizado con éxito.", by: updatedBy.username })
            await enterprise.save()
            return res.status(200).json(updatedSustainableObjective)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteSustainableObjective: async function (req, res) {
        try {
            const { enterpriseId, sustainableObjectiveId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const deletedBy = await assignAction(req, res, enterprise)
            const deletedSustainableObjective = await SustainableObjective.findOneAndDelete({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                _id: sustainableObjectiveId
            })
            if (!deletedSustainableObjective) {
                return res.status(404).json({ message: "No se ha encontrado el objetivo sustentable." })
            }
            sustainabilityEnterprise.sustainableObjectives.pull(sustainableObjectiveId)
            await updateSustainabilityScoreEnterprise(sustainabilityEnterprise)
            enterprise.logsData.push({ event: "Eliminado de objetivo sustentable", date: new Date(), details: "El objetivo sustentable fue eliminado con éxito.", by: deletedBy.username })
            await enterprise.save()
            return res.status(200).json({ message: "Eliminado con éxito", deletedSustainableObjective, sustainabilityEnterprise })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllSustainableObjectives: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const deletedBy = await assignAction(req, res, enterprise)
            const deletedAllSustainableObjectives = await SustainableObjective.deleteMany({
                sustainabilityEnterprise: sustainabilityEnterprise._id
            })
            if (deletedAllSustainableObjectives.deletedCount === 0) {
                return res.status(404).json({ message: "No se han encontrado objetivos sustentables." })
            }
            const updatedSustainabilityEnterprise = await SustainabilityEnterprise.findOneAndUpdate({
                _id: sustainabilityEnterprise._id
            },
                {
                    $pull: { sustainableObjectives: { $in: sustainabilityEnterprise.sustainableObjectives } }
                })
            if (!updatedSustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de sustentabilidad de la empresa." })
            }
            await updateSustainabilityScoreEnterprise(sustainabilityEnterprise)
            enterprise.logsData.push({ event: "Eliminado de todos los objetivos sustentables", date: new Date(), details: "Todos los objetivos sustentables fueron eliminados con éxito.", by: deletedBy.username })
            return res.status(200).json(deletedAllSustainableObjectives)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    filterSustainableObjectivesByDate: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { date } = req.query
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const filteredSustainableObjectivesByDate = await SustainableObjective.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                date: date
            })
            if (filteredSustainableObjectivesByDate.length === 0) {
                return res.status(404).json({ message: "No se han encontrado objetivos sustentables en la fecha proporcionada." })
            }
            return res.status(200).json(filteredSustainableObjectivesByDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    filterSustainableObjectivesByStatus: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { status } = req.query
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const validTypesStatus = ["Pendiente", "En progreso", "Planificado", "Completado"]
            if (!validTypesStatus.includes(status)) {
                return res.status(400).json({ message: "Tipo de estado proporcionado no válido." })
            }
            const filteredSustainableObjectivesByStatus = await SustainableObjective.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                status: status
            })
            if (filteredSustainableObjectivesByStatus.length === 0) {
                return res.status(404).json({ message: "No se han encontrado objetivos sustentables en el estado proporcionado." })
            }
            return res.status(200).json(filteredSustainableObjectivesByStatus)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    filterSustainableObjectivesByImpact: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { impact } = req.query
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const validTypesImpact = ["Bajo", "Mediano", "Alto"]
            if (!validTypesImpact.includes(impact)) {
                return res.status(400).json({ message: "Tipo de impacto proporcionado no válido." })
            }
            const filteredSustainableObjectivesByImpact = await SustainableObjective.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                impact: impact
            })
            if (filteredSustainableObjectivesByImpact.length === 0) {
                return res.status(404).json({ message: "No se han encontrado objetivos sustentables con el impacto proporcionado." })
            }
            return res.status(200).json(filteredSustainableObjectivesByImpact)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    filterSustainableObjectivesByODSrelationship: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { relationWithODS } = req.query
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const validTypesRelationWithODS = [
                "1 - Fin de la pobreza",
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
                "17 - Alianzas para lograr los objetivos"
            ]
            if (!validTypesRelationWithODS.includes(relationWithODS)) {
                return res.status(400).json({ message: "Tipo de Objetivo de Desarrollo Sostenible (ODS) proporcionado no válido." })
            }
            const filteredSustainableObjectivesByODSRelationship = await SustainableObjective.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                relationWithODS: relationWithODS
            })
            if (filteredSustainableObjectivesByODSRelationship.length === 0) {
                return res.status(404).json({ message: "No se han encontrado objetivos sustentables con el Objetivo de Desarrollo Sostenible proporcionado." })
            }
            return res.status(200).json(filteredSustainableObjectivesByODSRelationship)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = sustainableObjectiveController