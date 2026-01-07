const mongoose = require("mongoose")
const Hardware = require("../../../models/technology/hardware/hardwareModel")
const Technology = require("../../../models/technology/technologyModel")
const Use = require("../../../models/technology/hardware/useModel")
const Maintenance = require("../../../models/technology/hardware/maintenanceModel")
const Enterprise = require("../../../models/enterpriseModel")
const Report = require("../../../models/rrhh/sustainableRrhh/reportModel")
const RRHH = require("../../../models/rrhh/rrhhModel")
const Assist = require("../../../models/rrhh/assistModel")
const Employee = require("../../../models/rrhh/employees/employeeModel")
const Finance = require("../../../models/finances/financeModel")
const { calculateNetWorth, saveData } = require("../../handlers/handlersToFinance")
const calculateCarbonFootprintByKwh = require("../../handlers/sustainable/calculateCarbonFootprintKwh")
const carbonFootprintCalculatorToEmployee = require("../../handlers/sustainable/carbonFootprintCalculatorToEmployee")
const setSustainableValuesToEnterprise = require("../../handlers/sustainable/setSustainableValuesToEnterprise")

const hardwareController = {
    addHardware: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { type, model, value, manufacturer, consumptionW } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
                return res.status(404).json({ message: "ID de empresa inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            let technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                technology = new Technology({
                    enterpriseId: enterpriseId,
                })
                enterprise.technology = technology._id
            }
            let financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                financeEnterprise = new Finance({ enterpriseId: enterprise._id, elements: [] })
            }
            const createdBy = await assignAction(req, res, enterprise)
            const newHardware = new Hardware({
                technologyId: technology._id, type, value, model, manufacturer, consumptionW, createdBy: {
                    username: createdBy.username,
                    position: createdBy.position,
                    date: new Date()
                }
            })
            technology.hardwares.push(newHardware._id)
            await newHardware.save()
            await technology.save()

            financeEnterprise.logsData.push({ event: "Añadido de activo.", details: "El activo se añadió correctamente desde el módulo de tecnologías." })
            financeEnterprise["actives"].push({ typeAccount: "Activo corriente", date: new Date(), amount: value, details: "Software añadido desde el módulo de tecnologías.", hardwareId: newHardware._id })
            calculateNetWorth(financeEnterprise)
            await financeEnterprise.save()
            await enterprise.save()
            await enterprise.save()
            return res.status(200).json({ newHardware, technology, financeEnterprise })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getHardware: async function (req, res) {
        try {
            const { enterpriseId, hardwareId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(hardwareId)) {
                return res.status(404).json({ message: "ID de empresa o hardware inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const hardware = await Hardware.findOne({
                technologyId: technology._id,
                _id: hardwareId
            })
            if (!hardware) {
                return res.status(404).json({ message: "No se ha encontrado el hardware." })
            }
            return res.status(200).json(hardware)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllHardwares: async function (req, res) {
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
            const hardwares = await Hardware.find({
                technologyId: technology._id
            })
            if (hardwares.length === 0) {
                return res.status(404).json({ message: "No se han encontrado hardwares." })
            }
            return res.status(200).json(hardwares)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateHardware: async function (req, res) {
        try {
            const { enterpriseId, hardwareId } = req.params
            const { type, model, value, manufacturer, consumptionW } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(hardwareId)) {
                return res.status(404).json({ message: "ID de empresa o hardware inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const updatedData = {
                type, model, value, manufacturer, consumptionW, updatedBy: {
                    username: updatedBy.username,
                    position: updatedBy.position, 
                    date: new Date()
                }
            }
            const updatedHardware = await Hardware.findOneAndUpdate(
                { technologyId: technology._id, _id: hardwareId },
                { $set: updatedData },
                { new: true }
            )
            //actualizar activo o pasivo
            const updateDataToActive = {};

            if (value) updateDataToActive[`actives.$.amount`] = value;
            const updatedBy = await assignAction(req, res, enterprise)
            const updatedItemToNetWorth = await Finance.findOneAndUpdate(
                { enterpriseId, [`actives.hardwareId`]: hardwareId },
                { $set: updateDataToActive },
                { new: true }
            )
            if (!updatedHardware) {
                return res.status(404).json({ message: "No se ha encontrado el hardware." })
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
            return res.status(200).json({ updatedHardware, financeEnterprise })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //FIJARSE ESTO
    deleteHardware: async function (req, res) {
        try {
            const { enterpriseId, hardwareId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(hardwareId)) {
                return res.status(404).json({ message: "ID de empresa o hardware inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const technology = await Technology.findOne({ enterpriseId: enterprise._id })
            if (!technology) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de tecnología para la empresa." })
            }
            const rrhhEnterprise = await RRHH.findOne({
                enterpriseId
            })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de recursos humanos para la empresa." })
            }
            let financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const deletedHardware = await Hardware.findOneAndDelete({
                technologyId: technology._id,
                _id: hardwareId
            })
            const totalUses = await Use.find({
                hardwareId: hardwareId
            })
            if (totalUses.deletedCount === 0) {
                console.log("No habian usos")
            }
            const totalMaintenances = await Maintenance.deleteMany({
                hardwareId: hardwareId
            })
            if (totalMaintenances.deletedCount === 0) {
                console.log("No habian mantenimientos")
            }
            if (!deletedHardware) {
                return res.status(404).json({ message: "No se ha encontrado el hardware." })
            }
            const updatedActiveToHardware = await Finance.findOneAndUpdate(
                { enterpriseId },
                { $pull: { actives: { hardwareId } } },
                { new: true }
            )
            if (!updatedActiveToHardware) {
                return res.status(404).json({ message: "No se ha encontrado el activo asociado al software." })
            }
            for (const use of totalUses) {
                const previousReport = await Report.findOne({ uses: { $in: [use._id] } })
                console.log(previousReport)
                if (previousReport) {
                    const previousAssist = await Assist.findOne({ reportId: previousReport._id })
                    if (previousAssist) {
                        const employee = await Employee.findOne({
                            "personalInfo.name": use.employee.name,
                            "personalInfo.lastname": use.employee.lastname,
                            _id: use.employee.employeeId
                        })
                        console.log(employee)
                        console.log(use)
                        const hoursKwhUse = use.hours
                        const carbonFootprintEnergy = calculateCarbonFootprintByKwh(deletedHardware.consumptionW, hoursKwhUse)
                        console.log("Huella de co2 de energía", carbonFootprintEnergy)
                        previousAssist.carbonFootprintForAssist.value -= carbonFootprintEnergy

                        await previousReport.save()
                        await previousAssist.save()
                        await carbonFootprintCalculatorToEmployee(employee)
                    }
                }
                await Use.findByIdAndDelete(use._id)
                console.log("--------- FIN ---------")
            }
            //guardar el log
            financeEnterprise.logsData.push({ event: "Eliminado de activo", details: "El activo se eliminó exitosamente desde el módulo de tecnologías." })
            technology.hardwares.pull(hardwareId)

            financeEnterprise = await Finance.findOne({ enterpriseId })
            const newNetWorth = calculateNetWorth(financeEnterprise)
            financeEnterprise.netWorth.netWorth = newNetWorth
            console.log(financeEnterprise.netWorth);
            technology.hardwares.pull(hardwareId)
            await technology.save()
            await enterprise.save()
            await setSustainableValuesToEnterprise(req, res, rrhhEnterprise, enterprise)
            return res.status(200).json({ message: "Eliminado exitoso", deletedHardware })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllHardwares: async function (req, res) {
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
            const rrhhEnterprise = await RRHH.findOne({
                enterpriseId
            })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado un módulo de recursos humanos para la empresa." })
            }
            let financeEnterprise = await Finance.findOne({ enterpriseId })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const totalHardwares = await Hardware.find({
                technologyId: technology._id
            })
            const hardwaresIds = totalHardwares.map((hw) => hw._id)
            const totalUses = await Use.find({
                hardwareId: { $in: hardwaresIds }
            })
            for (const use of totalUses) {
                const previousReport = await Report.findOne({ uses: { $in: [use._id] } })
                console.log(previousReport)
                if (previousReport) {
                    const previousAssist = await Assist.findOne({ reportId: previousReport._id })
                    if (previousAssist) {
                        const employee = await Employee.findOne({
                            "personalInfo.name": use.employee.name,
                            "personalInfo.lastname": use.employee.lastname,
                            _id: use.employee.employeeId
                        })
                        const hardware = await Hardware.findById(use.hardwareId)
                        if (!hardware) {
                            console.log("No se encontró el hardware.")
                            continue
                        }
                        const carbonFootprintEnergy = calculateCarbonFootprintByKwh(hardware.consumptionW, use.hours)
                        console.log("Huella de co2 de energía", carbonFootprintEnergy)
                        previousAssist.carbonFootprintForAssist.value -= carbonFootprintEnergy

                        await previousReport.save()
                        await previousAssist.save()
                        await carbonFootprintCalculatorToEmployee(employee)
                    }
                }
                await Use.findByIdAndDelete(use._id)
                console.log("--------- FIN ---------")
            }

            if (totalHardwares.length === 0) {
                return res.status(404).json({ message: "No se han encontrado hardwares." })
            }

            const deletedAllHardwares = await Hardware.deleteMany({
                technologyId: technology._id
            })
            if (deletedAllHardwares.length === 0) {
                return res.status(404).json({ message: "No se han encontrado hardwares." })
            }

            await Finance.updateMany({ enterpriseId, "actives.hardwareId": { $in: hardwaresIds } }, { $pull: { actives: { hardwareId: { $in: hardwaresIds } } } }, { new: true })

            await Maintenance.deleteMany({ hardwareId: { $in: hardwaresIds } })

            await Technology.findOneAndUpdate({ _id: technology._id }, { $pull: { hardwares: { $in: technology.hardwares } } }, { new: true })

            //guardar el log
            financeEnterprise.logsData.push({ event: "Eliminado de activo", details: "El activo se eliminó exitosamente desde el módulo de tecnologías." })
            financeEnterprise = await Finance.findOne({ enterpriseId })
            const newNetWorth = calculateNetWorth(financeEnterprise)
            financeEnterprise.netWorth.netWorth = newNetWorth
            console.log(financeEnterprise.netWorth);
            await technology.save()
            await saveData(financeEnterprise, enterprise)
            await setSustainableValuesToEnterprise(req, res, rrhhEnterprise, enterprise)
            return res.status(200).json({ message: "Eliminado exitoso", totalHardwares })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getHardwaresByType: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { type } = req.query
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
            const validTypes = [
                "Servidor",
                "Computadora de Escritorio",
                "Laptop",
                "Impresora",
                "Router",
                "Conmutador",
                "Celular",
                "Tablet",
                "Monitor",
                "Otro"
            ]
            if (!validTypes.includes(type)) {
                return res.status(404).json({ message: "Los datos de filtrado proporcionados no son válidos." })
            }
            const hardware = await Hardware.find({
                technologyId: technology._id,
                type: type
            })
            if (!hardware.length === 0) {
                return res.status(404).json({ message: "No se han encontrado hardwares." })
            }
            return res.status(200).json(hardware)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getHardwaresByManufacturer: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { manufacturer } = req.query
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
            const hardware = await Hardware.find({
                technologyId: technology._id,
                manufacturer: manufacturer
            })
            if (hardware.length === 0) {
                return res.status(404).json({ message: "No se han encontrado hardwares." })
            }
            return res.status(200).json(hardware)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = hardwareController