const mongoose = require("mongoose")
const Technology = require("../../../models/technology/technologyModel")
const Enterprise = require("../../../models/enterpriseModel")
const Software = require("../../../models/technology/software/softwareModel")
const Finance = require("../../../models/finances/financeModel")
const { calculateNetWorth, saveData } = require("../../handlers/handlersToFinance")
const assignAction = require("../../handlers/members/assignAction")

const softwareController = {
    addSoftware: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { nameSoftware, status, value, version, vendor } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            let technology = await Technology.findOne({ enterpriseId: enterpriseId })
            if (!technology) {
                technology = new Technology({
                    enterpriseId: enterprise._id
                })
                enterprise.technology = technology._id
            }
            let financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                financeEnterprise = new Finance({ enterpriseId: enterprise._id, elements: [] })
            }
            const softwareExists = await Software.findOne({ nameSoftware: nameSoftware })
            if (softwareExists) {
                return res.status(409).json({ message: "Ya existe un software de igual nombre." })
            }
            const validTypes = ["Activo", "Inactivo", "En mantenimiento"]
            if (!validTypes.includes(status)) {
                return res.status(400).json({ message: "Tipo de estado no válido." })
            }
            const createdBy = await assignAction(req, res, enterprise)
            const newSoftware = new Software({
                technologyId: technology._id, nameSoftware, status, value, version, vendor, createdBy: { username: createdBy.username, position: createdBy.position, date: new Date() }
            })
            technology.softwares.push(newSoftware._id)
            await newSoftware.save()
            await technology.save()
            financeEnterprise.logsData.push({ event: "Añadido de activo.", details: "El activo se añadió correctamente desde el módulo de tecnologías." })
            financeEnterprise["actives"].push({ typeAccount: "Activo intangible", date: new Date(), amount: value, details: "Software añadido desde el módulo de tecnologías.", softwareId: newSoftware._id })
            calculateNetWorth(financeEnterprise)
            await financeEnterprise.save()
            await enterprise.save()
            return res.status(200).json({ newSoftware, technology, financeEnterprise })
        } catch (error) {
            return res.status(200).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSoftware: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId)) {
                return res.status(404).json({ message: "ID de empresa o de software inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            let technology = await Technology.findOne({ enterpriseId: enterpriseId })
            if (!technology) {
                technology = new Technology({
                    enterpriseId: enterprise._id
                })
                enterprise.technology = technology._id
            }
            const software = await Software.findOne({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!software) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            return res.status(200).json(software)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllSoftwares: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const softwares = await Software.find({
                technologyId: technology._id
            })
            if (softwares.length === 0) {
                return res.status(404).json({ message: "No se han encontrado softwares." })
            }
            return res.status(200).json(softwares)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateSoftware: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            const { nameSoftware, status, value, version, vendor } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId)) {
                return res.status(404).json({ message: "ID de empresa o software inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            let financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const updatedBy = await assignAction(req, res, enterprise)
            const updatedData = {
                nameSoftware, status, value, version, vendor, updatedBy: { username: updatedBy.username, position: updatedBy.position, date: new Date() }
            }
            const updatedSoftware = await Software.findOneAndUpdate(
                { technologyId: technology._id, _id: softwareId },
                { $set: updatedData },
                { new: true }
            )

            //actualizar activo o pasivo
            const updateDataToActive = {};

            if (value) updateDataToActive[`actives.$.amount`] = value;

            const updatedItemToNetWorth = await Finance.findOneAndUpdate(
                { enterpriseId, [`actives.softwareId`]: softwareId },
                { $set: updateDataToActive },
                { new: true }
            )

            //actualizar activo o pasivo
            if (!updatedSoftware) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }

            if (!updatedItemToNetWorth) {
                return res.status(404).json({ message: "No se ha encontrado el activo del software." })
            }
            financeEnterprise = await Finance.findOne({ enterpriseId })
            const newNetWorth = calculateNetWorth(financeEnterprise)
            financeEnterprise.netWorth.netWorth = newNetWorth
            console.log(financeEnterprise.netWorth);

            //guardar el log
            financeEnterprise.logsData.push({ event: "Actualizado de activo", details: "El activo se actualizó exitosamente desde el módulo de tecnologías." })

            await saveData(financeEnterprise, enterprise)
            return res.status(200).json({ updatedSoftware, financeEnterprise })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteSoftware: async function (req, res) {
        try {
            const { enterpriseId, softwareId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(softwareId)) {
                return res.status(404).json({ message: "ID de empresa o software inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            let financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const deletedSoftware = await Software.findOneAndDelete({
                technologyId: technology._id,
                _id: softwareId
            })
            if (!deletedSoftware) {
                return res.status(404).json({ message: "No se ha encontrado el software." })
            }
            const updatedActiveToSoftware = await Finance.findOneAndUpdate(
                { enterpriseId },
                { $pull: { actives: { softwareId } } },
                { new: true }
            )
            if (!updatedActiveToSoftware) {
                return res.status(404).json({ message: "No se ha encontrado el activo asociado al software." })
            }
            //guardar el log
            financeEnterprise.logsData.push({ event: "Eliminado de activo", details: "El activo se eliminó exitosamente desde el módulo de tecnologías." })
            technology.softwares.pull(softwareId)

            financeEnterprise = await Finance.findOne({ enterpriseId })
            const newNetWorth = calculateNetWorth(financeEnterprise)
            financeEnterprise.netWorth.netWorth = newNetWorth
            console.log(financeEnterprise.netWorth);

            await technology.save()
            await enterprise.save()
            await financeEnterprise.save()
            return res.status(200).json({ message: "Eliminado exitoso", deletedSoftware, updatedActiveToSoftware })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllSoftwares: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            let financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const totalSoftwares = await Software.find({
                technologyId: technology._id
            })
            if (totalSoftwares.length === 0) {
                return res.status(404).json({ message: "No se han encontrado softwares." })
            }
            const softwaresIds = totalSoftwares.map((sw) => sw._id)
            const deletedAllSoftwares = await Software.deleteMany({
                technologyId: technology._id
            })
            if (deletedAllSoftwares.length === 0) {
                return res.status(404).json({ message: "No se han encontrado softwares." })
            }
            const updatedActivesToSoftware = await Finance.updateMany(
                { enterpriseId, "actives.softwareId": { $in: softwaresIds } },
                { $pull: { actives: { softwareId: { $in: softwaresIds } } } },
                { new: true }
            )
            if (!updatedActivesToSoftware) {
                return res.status(404).json({ message: "No se ha encontrado el activo asociado al software." })
            }
            const updatedTechnology = await Technology.findOneAndUpdate(
                { _id: technology._id },
                { $pull: { softwares: { $in: technology.softwares } } },
                { new: true }
            )
            if (!updatedTechnology) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de tecnología." })
            }
            //guardar el log
            financeEnterprise.logsData.push({ event: "Eliminado de activo", details: "El activo se eliminó exitosamente desde el módulo de tecnologías." })
            financeEnterprise = await Finance.findOne({ enterpriseId })
            const newNetWorth = calculateNetWorth(financeEnterprise)
            financeEnterprise.netWorth.netWorth = newNetWorth
            console.log(financeEnterprise.netWorth);
            await technology.save()
            await saveData(financeEnterprise, enterprise)
            return res.status(200).json({ message: "Eliminado exitoso", totalSoftwares })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSoftwaresByVendor: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { vendor } = req.query
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            if (!vendor) {
                return res.status(400).json({ message: "No se ha ingresado un proveedor o vendedor de software." })
            }
            const software = await Software.find({
                technologyId: technology._id,
                vendor: vendor
            })
            if (software.length === 0) {
                return res.status(404).json({ message: "No se han encontrado softwares." })
            }
            return res.status(200).json(software)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSoftwaresByStatus: async function (req, res) {
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
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            if (!status) {
                return res.status(400).json({ message: "No se ha ingresado un estado de software." })
            }
            const validTypes = ["Activo", "Inactivo", "En mantenimiento"]
            if (!validTypes.includes(status)) {
                return res.status(400).json({ message: "Los datos de filtrado proporcionados no son válidos." })
            }
            const software = await Software.find({
                technologyId: technology._id,
                status: status
            })
            if (software.length === 0) {
                return res.status(404).json({ message: "No se han encontrado softwares." })
            }
            return res.status(200).json(software)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = softwareController