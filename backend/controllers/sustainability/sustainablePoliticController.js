const mongoose = require("mongoose")
const Enterprise = require("../../models/enterpriseModel")
const SustainablePolitic = require("../../models/sustainability/sustainablePoliticModel")
const SustainabilityEnterprise = require("../../models/sustainability/sustainabilityModel")
const SustainableObjective = require("../../models/sustainability/sustainableObjectiveModel")
const assignAction = require("../handlers/members/assignAction")

const sustainablePoliticController = {
    addSustainablePolitic: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { name, description, date, lastRevision, objectives, scope, relatedRegulations, environmentalGoals, ambientalImpacts, actions } = req.body
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
            //comenzar a filtrar objetivos
            let sustainableObjectivesFound = []
            if (objectives) {
                for (const objective of objectives) {
                    const objectivesTitle = Array.isArray(objective.title) ? objective.title : [objective.title]
                    const sustainableObjectives = await SustainableObjective.find({
                        sustainabilityEnterprise: sustainabilityEnterprise._id,
                        title: { $in: objectivesTitle }
                    })
                    sustainableObjectivesFound.push(...sustainableObjectives)
                }
            }
            const createdBy = await assignAction(req, res, enterprise)
            const newSustainablePolitic = new SustainablePolitic({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                name,
                description,
                date,
                lastRevision,
                scope,
                relatedRegulations,
                environmentalGoals,
                ambientalImpacts,
                actions,
                createdBy: {
                    username: createdBy.username,
                    position: createdBy.position,
                    date: new Date()
                }
            })
            //filtrado de objetivos sustentables
            let filteredSustainableObjectives = []
            if (objectives) {
                for (const objective of sustainableObjectivesFound) {
                    filteredSustainableObjectives.push({
                        sustainableObjectiveId: objective._id,
                        title: objective.title
                    })
                }
            }
            newSustainablePolitic.objectives = filteredSustainableObjectives
            sustainabilityEnterprise.sustainablePolitics.push(newSustainablePolitic._id)
            await newSustainablePolitic.save()
            await sustainabilityEnterprise.save()
            enterprise.logsData.push({ event: "Añadido de política sustentable", date: new Date(), details: "La política sustentable fue añadida con éxito.", by: createdBy.username })
            await enterprise.save()
            return res.status(200).json({ newSustainablePolitic, sustainabilityEnterprise, enterprise })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSustainablePolitic: async function (req, res) {
        try {
            const { enterpriseId, sustainablePoliticId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(sustainablePoliticId)) {
                return res.status(404).json({ message: "ID de empresa o de política sustentable inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para la empresa." })
            }
            const sustainablePolitic = await SustainablePolitic.findOne({ _id: sustainablePoliticId, sustainabilityEnterprise: sustainabilityEnterprise._id })
            if (!sustainablePolitic) {
                return res.status(404).json({ message: "No se ha encontrado la política sustentable." })
            }
            return res.status(200).json(sustainablePolitic)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllSustainablePolitics: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({
                enterpriseId: enterprise._id
            })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad de la empresa." })
            }
            const allSustainablePolitics = await SustainablePolitic.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id
            })
            if (allSustainablePolitics.length === 0) {
                return res.status(404).json({ message: "No se han encontrado políticas sustentables." })
            }
            return res.status(200).json(allSustainablePolitics)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateSustainablePolitic: async function (req, res) {
        try {
            const { enterpriseId, sustainablePoliticId } = req.params
            const { name, description, date, lastRevision, objective, scope, relatedRegulations, environmentalGoals, ambientalImpacts, actions } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(sustainablePoliticId)) {
                return res.status(404).json({ message: "ID de empresa o de política sustentable inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para la empresa." })
            }
            const updatedBy = await assignAction(req, res, enterprise)
            const updatedSustainablePolitic = await SustainablePolitic.findOneAndUpdate({ _id: sustainablePoliticId, sustainabilityEnterprise: sustainabilityEnterprise._id }, { name, description, date, lastRevision, objective, scope, relatedRegulations, environmentalGoals, ambientalImpacts, actions, updatedBy: { username: updatedBy.username, position: updatedBy.position, date: new Date() } }, { new: true })
            if (!updatedSustainablePolitic) {
                return res.status(404).json({ message: "No se ha encontrado la política sustentable." })
            }
            enterprise.logsData.push({ event: "Actualización de política sustentable", date: new Date(), details: "La política sustentable se ha actualizado con éxito.", by: updatedBy.username })
            return res.status(200).json(updatedSustainablePolitic)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteSustainablePolitic: async function (req, res) {
        try {
            const { enterpriseId, sustainablePoliticId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(sustainablePoliticId)) {
                return res.status(404).json({ error: "ID de empresa o de política sustentable inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para la empresa." })
            }
            const deletedBy = await assignAction(req, res)
            const deletedSustainablePolitic = await SustainablePolitic.findOneAndDelete({
                _id: sustainablePoliticId,
                sustainabilityEnterprise: sustainabilityEnterprise._id
            })
            if (!deletedSustainablePolitic) {
                return res.status(404).json({ message: "No se ha encontrado la política sustentable." })
            }
            sustainabilityEnterprise.sustainablePolitics.pull(deletedSustainablePolitic._id)
            await sustainabilityEnterprise.save()
            enterprise.logsData.push({ event: "Eliminado de política sustentable", date: new Date(), details: "La política sustentable se ha eliminado con éxito.", by: deletedBy.username })
            await enterprise.save()
            return res.status(200).json(deletedSustainablePolitic)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllSustainablePolitics: async function (req, res) {
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
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para la empresa." })
            }
            const deletedBy = await assignAction(req, res, enterprise)
            const deletedAllSustainablePolitics = await SustainablePolitic.deleteMany({
                sustainabilityEnterprise: sustainabilityEnterprise._id
            })
            if (deletedAllSustainablePolitics.deletedCount === 0) {
                return res.status(404).json({ message: "No se han encontrado políticas sustentables." })
            }
            const updatedSustainabilityEnterprise = await SustainabilityEnterprise.findOneAndUpdate(
                { _id: sustainabilityEnterprise._id },
                { $pull: { sustainablePolitics: { $in: sustainabilityEnterprise.sustainablePolitics } } },
                { new: true }
            )
            enterprise.logsData.push({ event: "Eliminado de todas las políticas sustentables", date: new Date(), details: "Todas las políticas sustentables se han eliminado con éxito.", by: deletedBy.username })
            await enterprise.save()
            return res.status(200).json({ deletedAllSustainablePolitics, updatedSustainabilityEnterprise })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    filterSustainablePoliticsByDate: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { date } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para la empresa." })
            }
            const filteredSustainablePoliticsByDate = await SustainablePolitic.find({
                date: date
            })
            if (filteredSustainablePoliticsByDate.length === 0) {
                return res.status(404).json({ message: "No se han encontrado políticas sustentables en la fecha proporcionada." })
            }
            return res.status(200).json(filteredSustainablePoliticsByDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    filterSustainablePoliticsByLastRevisionDate: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { lastRevision } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de sustentabilidad para la empresa." })
            }
            const filteredSustainablePoliticsByLastRevisionDate = await SustainablePolitic.find({
                lastRevision: lastRevision
            })
            if (filteredSustainablePoliticsByLastRevisionDate.length === 0) {
                return res.status(404).json("No se han encontrado políticas sustentable en la fecha de revisión proporcionada.")
            }
            return res.status(200).json(filteredSustainablePoliticsByLastRevisionDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = sustainablePoliticController