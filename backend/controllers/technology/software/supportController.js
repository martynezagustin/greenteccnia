const mongoose = require("mongoose")
const Technology = require("../../../models/technology/technologyModel")
const Enterprise = require("../../../models/enterpriseModel")
const Software = require("../../../models/technology/software/softwareModel")
const Support = require("../../../models/technology/software/supportModel")
const assignAction = require("../../handlers/members/assignAction")

const supportController = {
    addSupport: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            const { description, typeSupport, priority, date } = req.body
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
            const createdBy = await assignAction(req, res, enterprise)
            const newSupport = new Support({
                softwareId: software._id,
                description,
                typeSupport,
                priority,
                date,
                createdBy: {
                    username: createdBy.username,
                    position: createdBy.position,
                    date: new Date()
                }
            })
            software.supports.push(newSupport._id)
            await newSupport.save()
            await software.save()
            await technology.save()
            await enterprise.save()
            return res.status(200).json({ software, technology })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSupport: async function (req, res) {
        try {
            const { enterpriseId, softwareId, supportId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId) || !mongoose.Types.ObjectId.isValid(supportId)) {
                return res.status(404).json({ message: "ID de empresa, de software o de soporte inválido." })
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
            const support = await Support.findOne({
                softwareId: software._id,
                _id: supportId
            })
            if (!support) {
                return res.status(404).json({ message: "No se ha encontrado el soporte al software." })
            }
            return res.status(200).json(support)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllSupports: async function (req, res) {
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
            const supports = await Support.find({
                softwareId: software
            })
            if (supports.length === 0) {
                return res.status(404).json({ message: "No se han encontrado soportes." })
            }
            return res.status(200).json(supports)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateSupport: async function (req, res) {
        try {
            const { enterpriseId, softwareId, supportId } = req.params
            const { description, typeSupport, priority, date } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId) || !mongoose.Types.ObjectId.isValid(supportId)) {
                return res.status(404).json({ message: "ID de empresa, de software o de soporte inválido." })
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
                description, typeSupport, priority, date, updatedBy: { username: updatedBy.username, position: updatedBy.position, date: new Date() }
            }
            const updatedSupport = await Support.findOneAndUpdate(
                { _id: supportId, softwareId: softwareId },
                { $set: updateData },
                { new: true }
            )
            if (!updatedSupport) {
                return res.status(404).json({ message: "No se ha encontrado el soporte." })
            }
            return res.status(200).json(updatedSupport)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteSupport: async function (req, res) {
        try {
            const { enterpriseId, softwareId, supportId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId) || !mongoose.Types.ObjectId.isValid(supportId)) {
                return res.status(404).json({ message: "ID de empresa, de software o de soporte inválido." })
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
            const support = await Support.findOneAndDelete({
                softwareId: softwareId,
                _id: supportId
            })
            if (!support) {
                return res.status(404).json({ message: "No se ha encontrado el soporte." })
            }
            software.supports.pull(support)
            await software.save()
            await technology.save()
            await enterprise.save()
            return res.status(200).json({ message: "Eliminado exitosamente.", software })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllSuports: async function (req, res) {
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
            const deletedAllSupports = await Support.deleteMany({
                softwareId: software._id
            })
            if (deletedAllSupports.deletedCount === 0) {
                return res.status(404).json({ message: "No se han encontrado soportes del software." })
            }
            const updatedSoftware = await Software.findOneAndUpdate(
                { technologyId: technology._id, _id: softwareId },
                { $pull: { supports: { $in: software.supports } } },
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
    getSupportsByCustomDate: async function (req, res) {
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
            const filteredSupportsByCustomerDate = await Support.find(
                {
                    softwareId: softwareId,
                    date: { $gte: start, $lte: end }
                },
            )
            console.log(filteredSupportsByCustomerDate);

            if (filteredSupportsByCustomerDate.length === 0) {
                return res.status(404).json({ message: "No hay soportes en las fechas proporcionadas." })
            }
            return res.status(200).json(filteredSupportsByCustomerDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSupportsByCurrentYear: async function (req, res) {
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

            const supportsFilteredByYear = await Support.find({
                softwareId: softwareId,
                date: {
                    $gte: startCurrentYear,
                    $lte: endCurrentYear
                }
            })
            console.log(supportsFilteredByYear);

            if (supportsFilteredByYear.length === 0) {
                return res.status(404).json({ message: "No se han encontrado soportes." })
            }
            return res.status(200).json(supportsFilteredByYear)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSupportsByCurrentMonth: async function (req, res) {
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
            const supportsFilteredByMonth = await Support.find({
                softwareId: softwareId,
                date: { $gte: startDate, $lte: endDate }
            })
            if (supportsFilteredByMonth.length === 0) {
                return res.status(404).json({ message: "No se han encontrado soportes." })
            }
            return res.status(200).json(supportsFilteredByMonth)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSupportsByCurrentWeek: async function (req, res) {
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
            const supportsFilteredByWeek = await Support.find({
                softwareId: softwareId,
                date: { $gte: startDate, $lte: endDate }
            })
            if (supportsFilteredByWeek.length === 0) {
                return res.status(404).json({ message: "No se han encontrado actualizaciones de software." })
            }
            return res.status(200).json(updateManagementsFilteredByWeek)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSupportsByCurrentDate: async function (req, res) {
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
            const supportsFilteredByDate = await Support.find({
                softwareId: softwareId,
                date: { $gte: startDate, $lte: endDate }
            })
            if (supportsFilteredByDate.length === 0) {
                return res.status(404).json({ message: "No se han encontrado soportes." })
            }
            return res.status(200).json(supportsFilteredByDate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSupportsByPriority: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            const { priority } = req.query
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
            const validTypes = ["Alto", "Medio", "Bajo"]
            if (!validTypes.includes(priority)) {
                return res.status(400).json({ message: "Los datos de filtrado proporcionados no son válidos." })
            }
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            const supportsFilteredByPriority = await Support.find({
                softwareId: softwareId,
                priority: priority
            })
            if (supportsFilteredByPriority.length === 0) {
                return res.status(404).json({ message: "No se han encontrado soportes." })
            }
            return res.status(200).json(supportsFilteredByPriority)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSupportByTypeSupport: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            const { typeSupport } = req.query
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
            const validTypes = ["Correctivo", "Preventivo", "Evolutivo", "Consultoría"]
            if (!validTypes.includes(typeSupport)) {
                return res.status(400).json({ message: "Los datos de filtrado proporcionados no son válidos." })
            }
            const supportsFilteredByTypeSupport = await Support.find({
                softwareId: softwareId,
                typeSupport: typeSupport
            })
            if (supportsFilteredByTypeSupport.length === 0) {
                return res.status(404).json({ message: "No se han encontrado soportes." })
            }
            return res.status(200).json(supportsFilteredByTypeSupport)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = supportController