const mongoose = require("mongoose")
const Enterprise = require("../../../models/enterpriseModel")
const Technology = require("../../../models/technology/technologyModel")
const LicenseManagement = require("../../../models/technology/software/licenseManagementModel")
const Software = require("../../../models/technology/software/softwareModel")
const assignAction = require("../../handlers/members/assignAction")

const licenseManagementController = {
    addLicenseManagement: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            const { description, typeLicense, date, expiration } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId)) {
                return res.status(404).json({ message: "ID de empresa o de software inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            const validTypesTypeLicense = ["Propietaria", "Libre", "Código Abierto (Open Source)", "Dominio Público", "Software como Servicio (SaaS)"]
            if (!validTypesTypeLicense.includes(typeLicense)) {
                return res.status(400).json({ message: "El tipo de licencia proporcionado no es válido." })
            }
            const createdBy = await assignAction(req, res, enterprise)
            const newLicenseManagement = new LicenseManagement({
                softwareId: software._id,
                description,
                typeLicense,
                date,
                expiration,
                createdBy: {
                    username: createdBy.username,
                    position: createdBy.position,
                    date: new Date()
                }
            })
            software.licenseManagements.push(newLicenseManagement._id)
            await newLicenseManagement.save()
            await software.save()
            await technology.save()
            await enterprise.save()
            return res.status(200).json({ software, technology, newLicenseManagement })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getLicenseManagement: async function (req, res) {
        try {
            const { enterpriseId, softwareId, licenseManagementId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId) || !mongoose.Types.ObjectId.isValid(licenseManagementId)) {
                return res.status(404).json({ message: "ID de empresa, de software o de licencia inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            const licenseManagement = await LicenseManagement.findOne({
                softwareId: software._id,
                _id: licenseManagementId
            })
            if (!licenseManagement) {
                return res.status(404).json({ message: "No se ha encontrado la licencia de software." })
            }
            return res.status(200).json(licenseManagement)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllLicenseManagements: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId)) {
                return res.status(404).json({ message: "ID de empresa o de software inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            const licenseManagements = await LicenseManagement.find({
                softwareId: software._id
            })
            if (licenseManagements.length === 0) {
                return res.status(404).json({ message: "No se han encontrado licencias de software." })
            }
            return res.status(200).json(licenseManagements)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateLicenseManagement: async function (req, res) {
        try {
            const { enterpriseId, softwareId, licenseManagementId } = req.params
            const { description, typeLicense, date, expiration } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId) || !mongoose.Types.ObjectId.isValid(licenseManagementId)) {
                return res.status(404).json({ message: "ID de empresa, de software o de licencia inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            const updatedBy = await assignAction(req, res, enterprise)
            const updateData = {
                description, typeLicense, date, expiration, updatedBy: { username: updatedBy.username, position: updatedBy.position, date: new Date() }
            }
            const updatedLicenseManagement = await LicenseManagement.findOneAndUpdate(
                { _id: licenseManagementId, softwareId: softwareId },
                { $set: updateData },
                { new: true }
            )
            if (!updatedLicenseManagement) {
                return res.status(404).json({ message: "No se ha encontrado la licencia de software." })
            }
            return res.status(200).json(updatedLicenseManagement)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteLicenseManagement: async function (req, res) {
        try {
            const { enterpriseId, softwareId, licenseManagementId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId) || !mongoose.Types.ObjectId.isValid(licenseManagementId)) {
                return res.status(404).json({ message: "ID de empresa, de software o de licencia inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            const licenseManagement = await LicenseManagement.findOneAndDelete({
                softwareId: softwareId,
                _id: licenseManagementId
            })
            if (!licenseManagement) {
                return res.status(404).json({ message: "No se ha encontrado la licencia de software." })
            }
            software.licenseManagements.pull(licenseManagementId)
            await software.save()
            await technology.save()
            await enterprise.save()
            return res.status(200).json({ message: "Eliminado exitosamente.", software })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllLicenseManagements: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId)) {
                return res.status(404).json({ message: "ID de empresa o de software inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha localizado el software." })
            }
            const deletedAllLicenseManagements = await LicenseManagement.deleteMany({
                softwareId: software._id
            })
            if (deletedAllLicenseManagements.deletedCount === 0) {
                return res.status(404).json({ message: "No se han encontrado licencias de software." })
            }
            const updatedSoftware = await Software.findOneAndUpdate(
                { technologyId: technology._id, _id: softwareId },
                { $pull: { licenseManagements: { $in: software.licenseManagements } } },
                { new: true }
            )
            if (!updatedSoftware) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            await technology.save()
            await enterprise.save()
            return res.status(200).json({ message: "Eliminado exitoso", updatedSoftware })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getLicenseManagementsByCustomDate: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            const { startDate, endDate } = req.query
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId)) {
                return res.status(404).json({ message: "ID de empresa o de software inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software" })
            }
            if (!startDate || !endDate) {
                return res.status(400).json({ message: "Debes proporcionar fechas válidas para la consulta." })
            }
            const start = new Date(startDate)
            start.setUTCHours(0, 0, 0, 0)
            const end = new Date(endDate)
            end.setUTCHours(23, 59, 59, 999)
            console.log(start, end);
            const filteredLicenseManagementsByCustomDate = await LicenseManagement.find(
                {
                    softwareId: softwareId,
                    date: { $gte: start, $lte: end }
                },
            )
            console.log(filteredLicenseManagementsByCustomDate);

            if (filteredLicenseManagementsByCustomDate.length === 0) {
                return res.status(404).json({ message: "No hay licencias de software en las fechas proporcionadas." })
            }
            return res.status(200).json(filteredLicenseManagementsByCustomDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getLicenseManagementsByCurrentYear: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId)) {
                return res.status(404).json({ message: "ID de empresa o de software inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            console.log(software)
            //inicializar fechas
            const actualDate = new Date()
            const startCurrentYear = new Date(actualDate.getFullYear(), 0, 1)
            startCurrentYear.setUTCHours(0, 0, 0, 0)
            const endCurrentYear = new Date(actualDate.getFullYear(), 11, 31)
            endCurrentYear.setUTCHours(23, 59, 59, 999)

            const licenseManagementsFilteredByYear = await LicenseManagement.find({
                softwareId: softwareId,
                date: {
                    $gte: startCurrentYear,
                    $lte: endCurrentYear
                }
            })
            console.log(licenseManagementsFilteredByYear);

            if (licenseManagementsFilteredByYear.length === 0) {
                return res.status(404).json({ message: "No se han encontrado licencias del software." })
            }
            return res.status(200).json(licenseManagementsFilteredByYear)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getLicenseManagementsByCurrentMonth: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId)) {
                return res.status(404).json({ message: "ID de empresa o de software inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            //inicializar fechas
            const actualDate = new Date()
            const currentMonth = actualDate.getMonth()
            const currentYear = actualDate.getFullYear()
            const startDate = new Date(currentYear, currentMonth, 1)
            startDate.setUTCHours(0, 0, 0, 0)
            const endDate = new Date(currentYear, currentMonth, 31)
            endDate.setUTCHours(23, 59, 59, 999)
            const licenseManagementsFilteredByMonth = await LicenseManagement.find({
                softwareId: softwareId,
                date: { $gte: startDate, $lte: endDate }
            })
            if (licenseManagementsFilteredByMonth.length === 0) {
                return res.status(404).json({ message: "No se han encontrado licencias del software." })
            }
            return res.status(200).json(licenseManagementsFilteredByMonth)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getLicenseManagementsByCurrentWeek: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId)) {
                return res.status(404).json({ message: "ID de empresa o de software inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            //inicializar fechas
            const actualDate = new Date()
            const startDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate() - 7)
            startDate.setUTCHours(0, 0, 0, 0)
            const endDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate())
            endDate.setUTCHours(23, 59, 59, 999)
            console.log(startDate, endDate);
            const licenseManagementsFilteredByWeek = await LicenseManagement.find({
                softwareId: softwareId,
                date: { $gte: startDate, $lte: endDate }
            })
            if (licenseManagementsFilteredByWeek.length === 0) {
                return res.status(404).json({ message: "No se han encontrado licencias del software." })
            }
            return res.status(200).json(licenseManagementsFilteredByWeek)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getLicenseManagementsByCurrentDate: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId)) {
                return res.status(404).json({ message: "ID de empresa o de software inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            //inicializar fechas
            const actualDate = new Date()
            const startDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate())
            startDate.setUTCHours(0, 0, 0, 0)
            const endDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate())
            endDate.setUTCHours(23, 59, 59, 999)
            console.log(startDate, endDate);
            const licenseManagementsFilteredByDate = await LicenseManagement.find({
                softwareId: softwareId,
                date: { $gte: startDate, $lte: endDate }
            })
            if (licenseManagementsFilteredByDate.length === 0) {
                return res.status(404).json({ message: "No se han encontrado licencias del software." })
            }
            return res.status(200).json(licenseManagementsFilteredByDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getLicenseManagementsByExpirationDate: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            const { startDate, endDate } = req.query
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId)) {
                return res.status(404).json({ message: "ID de empresa o de software inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software" })
            }
            if (!startDate || !endDate) {
                return res.status(400).json({ message: "Debes proporcionar fechas válidas para la consulta." })
            }
            const start = new Date(startDate)
            start.setUTCHours(0, 0, 0, 0)
            const end = new Date(endDate)
            end.setUTCHours(23, 59, 59, 999)
            console.log(start, end);
            const filteredLicenseManagementsByExpirationDate = await LicenseManagement.find({
                softwareId: software._id,
                expiration: { $gte: start, $lte: end }
            })
            if (filteredLicenseManagementsByExpirationDate.length === 0) {
                return res.status(404).json({ message: "No se han encontrado licencias de software por fecha de expiración" })
            }
            return res.status(200).json(filteredLicenseManagementsByExpirationDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getLicenseManagementsByTypeLicense: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            const { typeLicense } = req.query
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId)) {
                return res.status(404).json({ message: "ID de empresa o de software inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!typeLicense) {
                return res.status(400).json({ message: "No se ha ingresado un tipo de licencia." })
            }
            const validTypes = ["Propietaria", "Libre", "Código Abierto (Open Source)", "Dominio Público", "Software como Servicio (SaaS)"]
            if (!validTypes.includes(typeLicense)) {
                return res.status(400).json({ message: "Los datos de filtrado proporcionados no son válidos." })
            }
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            const filteredLicenseManagementsByTypeLicense = await LicenseManagement.find({
                softwareId: software._id,
                typeLicense: typeLicense
            })
            if (filteredLicenseManagementsByTypeLicense.length === 0) {
                return res.status(404).json({ message: "No se han encontrado licencias de software." })
            }
            return res.status(200).json(filteredLicenseManagementsByTypeLicense)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = licenseManagementController