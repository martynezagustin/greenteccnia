const mongoose = require("mongoose")
const LegalRequirement = require("../../models/sustainability/legalRequirementModel")
const SustainabilityEnterprise = require("../../models/sustainability/sustainabilityModel")
const Enterprise = require("../../models/enterpriseModel")
const updateSustainabilityScoreEnterprise = require("../handlers/sustainable/updateSustainabilityScoreEnterprise")
const assignAction = require("../handlers/members/assignAction")

const legalRequirementController = {
    addLegalRequirement: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { regulation, complianceStatus, regulatoryAuthority } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID inválido de empresa." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa" })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const legalRequirementExists = await LegalRequirement.findOne({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                regulation,
                regulatoryAuthority
            })
            if (legalRequirementExists) {
                return res.status(400).json({ message: "Ya existe un requisito legal con similares características." })
            }
            const createdBy = await assignAction(req, res, enterprise)
            const newLegalRequirement = new LegalRequirement({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                regulation,
                complianceStatus,
                regulatoryAuthority,
                createdBy: {
                    username: createdBy.username,
                    position: createdBy.position,
                    date: new Date()
                }
            })
            sustainabilityEnterprise.legalRequirements.push(newLegalRequirement._id)
            await newLegalRequirement.save()
            await sustainabilityEnterprise.save()
            await updateSustainabilityScoreEnterprise(sustainabilityEnterprise)
            enterprise.logsData.push({ event: "Añadido de requisito legal", date: new Date(), details: "El requisito legal se añadió exitosamente.", by: createdBy.username })
            await enterprise.save()
            return res.status(200).json({ newLegalRequirement, sustainabilityEnterprise })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getLegalRequirement: async function (req, res) {
        try {
            const { enterpriseId, legalRequirementId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID inválido de empresa o de requisito legal." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa" })
            }
            const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({ enterpriseId: enterprise._id })
            if (!sustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo sustentable para la empresa." })
            }
            const legalRequirement = await LegalRequirement.findOne({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                _id: legalRequirementId
            })
            if (!legalRequirement) {
                return res.status(404).json({ message: "No se ha encontrado el requisito legal." })
            }
            return res.status(200).json(legalRequirement)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllLegalRequirements: async function (req, res) {
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
            const allLegalRequirements = await LegalRequirement.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id
            })
            if (allLegalRequirements.length === 0) {
                return res.status(404).json({ message: "No se han encontrado requisitos legales." })
            }
            return res.status(200).json(allLegalRequirements)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateLegalRequirement: async function (req, res) {
        try {
            const { enterpriseId, legalRequirementId } = req.params
            const { regulation, complianceStatus, regulatoryAuthority } = req.body
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
            const updatedBy = await assignAction(req, res, enterprise)
            const updatedLegalRequirement = await LegalRequirement.findOneAndUpdate({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                _id: legalRequirementId
            }, {
                regulation, complianceStatus, regulatoryAuthority, updatedBy: { username: updatedBy.username, position: updatedBy.position, date: new Date() }
            }, {
                new: true
            })
            if (!updatedLegalRequirement) {
                return res.status(404).json({ message: "No se ha encontrado el requerimiento legal" })
            }
            await updateSustainabilityScoreEnterprise(sustainabilityEnterprise)
            enterprise.logsData.push({ event: "Actualización de requisito legal", date: new Date(), details: "El requisito legal fue actualizado con éxito.", by: updatedBy.username })
            await enterprise.save()
            return res.status(200).json(updatedLegalRequirement)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteLegalRequirement: async function (req, res) {
        try {
            const { enterpriseId, legalRequirementId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(legalRequirementId)) {
                return res.status(404).json({ message: "ID de empresa o de requisito legal inválido." })
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
            const deletedLegalRequirement = await LegalRequirement.findOneAndDelete({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                _id: legalRequirementId
            })
            if (!deletedLegalRequirement) {
                return res.status(404).json({ message: "No se ha encontrado el requerimiento legal" })
            }
            sustainabilityEnterprise.legalRequirements.pull(legalRequirementId)
            await sustainabilityEnterprise.save()
            await updateSustainabilityScoreEnterprise(sustainabilityEnterprise)
            enterprise.logsData.push({ event: "Borrado de requisito legal", date: new Date(), details: "El requisito legal fue eliminado con éxito.", by: deletedBy.username })
            await enterprise.save()
            return res.status(200).json(deletedLegalRequirement)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllLegalRequirements: async function (req, res) {
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
            const deletedAllLegalRequirements = await LegalRequirement.deleteMany({
                sustainabilityEnterprise: sustainabilityEnterprise._id
            })
            if (deletedAllLegalRequirements.deletedCount === 0) {
                return res.status(404).json({ message: "No se han encontrado requisitos legales." })
            }
            const updatedSustainabilityEnterprise = await SustainabilityEnterprise.findOneAndUpdate({
                _id: sustainabilityEnterprise._id
            }, {
                $pull: { legalRequirements: { $in: sustainabilityEnterprise.legalRequirements } }
            }, {
                new: true
            })
            if (!updatedSustainabilityEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de sustentabilidad de la empresa." })
            }
            await updateSustainabilityScoreEnterprise(sustainabilityEnterprise)
            enterprise.logsData.push({ event: "Borrado de todos los requisitos legales", date: new Date(), details: "Todos los requisitos fueron eliminados con éxito.", by: deletedBy.username })
            await enterprise.save()
            return res.status(200).json({ deletedAllLegalRequirements, updatedSustainabilityEnterprise })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    filterLegalRequirementsByComplianceStatus: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { complianceStatus } = req.query
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
            const filteredLegalRequirementsByComplianceStatus = await LegalRequirement.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                complianceStatus: complianceStatus
            })
            if (filteredLegalRequirementsByComplianceStatus.length === 0) {
                return res.status(404).json({ message: "No se han encontrado requisitos legales en el estado de cumplimiento proporcionado." })
            }
            return res.status(200).json(filteredLegalRequirementsByComplianceStatus)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error " })
        }
    },
    filterLegalRequirementsByRegulatoryAuthority: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { regulatoryAuthority } = req.query
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
            const filteredLegalRequirementsByRegulatoryAuthority = await LegalRequirement.find({
                sustainabilityEnterprise: sustainabilityEnterprise._id,
                regulatoryAuthority: regulatoryAuthority
            })
            if (filteredLegalRequirementsByRegulatoryAuthority.length === 0) {
                return res.status(404).json({ message: "No se han encontrado requisitos legales por la autoridad de regulación proporcionada." })
            }
            return res.status(200).json(filteredLegalRequirementsByRegulatoryAuthority)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error " })
        }
    }
}

module.exports = legalRequirementController