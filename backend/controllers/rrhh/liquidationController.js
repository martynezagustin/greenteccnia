const Enterprise = require("../../models/enterpriseModel")
const Liquidation = require("../../models/rrhh/liquidationModel")
const RRHH = require("../../models/rrhh/rrhhModel")
const Employee = require("../../models/rrhh/employees/employeeModel")

const liquidationController = {
    addLiquidation: async function (req, res) {
        try {
            const { enterpriseId, employeeId } = req.params
            const { grossSalary, additionalPayments, deductions, employerContributions, dateOfRemuneration, employer } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(404).json({ message: "ID inválido de empresa o de empleado." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })
            }
            const employeeExists = await Employee.findOne({ rrhhEnterprise: rrhhEnterprise._id, _id: employeeId })
            console.log(employeeExists.personalInfo.name);
            if (!employeeExists.personalInfo || !employeeExists.personalInfo.name || !employeeExists.personalInfo.lastname) {
                return res.status(400).json({ message: "El empleado no tiene ni nombre ni apellido." })
            }
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const totalAdditionalPayments = additionalPayments.reduce((acc, val) => acc + parseFloat(val.amount), 0)
            console.log(totalAdditionalPayments)
            const totalDeductions = deductions.reduce((acc, val) => acc + parseFloat(val.amount), 0)
            console.log(totalDeductions)

            const netSalary = parseFloat(grossSalary) + (parseFloat(totalAdditionalPayments) || 0) - (parseFloat(totalDeductions) || 0)
            const employerAddressExists = enterprise.address.find((a) => a == employer.address)
            if (employerAddressExists !== employer.address) return res.status(400).json({ message: "No existe la dirección de la empresa proporcionada." })
            const newLiquidation = new Liquidation({
                employee: employeeExists._id,
                grossSalary,
                additionalPayments,
                deductions,
                bank: employeeExists.financialInformation.bank,
                employerContributions,
                netSalary,
                dateOfRemuneration,
                CCT: employeeExists.jobInfo.CCT,
                employer: {
                    companyName: enterprise.nameEnterprise,
                    address: employerAddressExists
                },
            })
            const createdBy = await assignAction(req, res, enterprise)
            newLiquidation.createdBy = {
                username: createdBy.username,
                position: createdBy.position,
                date: new Date()
            }
            await newLiquidation.save()
            financeEnterprise.expenses.push({
                concept: "Liquidación de haberes",
                date: dateOfRemuneration,
                amount: netSalary,
                salary: {
                    grossAmount: grossSalary,
                    netAmount: netSalary,
                    liquidationId: newLiquidation._id
                }
            })
            employeeExists.liquidations.push(newLiquidation._id)
            await employeeExists.save()
            calculateCashFlow(financeEnterprise)
            await financeEnterprise.save()
            return res.status(200).json({ message: "Liquidado exitosamente.", newLiquidation, employeeExists })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getLiquidation: async function (req, res) {
        try {
            const { enterpriseId, employeeId, liquidationId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(404).json({ message: "ID inválido de empresa o de empleado." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })
            }
            const employee = await Employee.findOne({ rrhhEnterprise: rrhhEnterprise._id, _id: employeeId })
            console.log(employee._id);

            if (!employee) {
                return res.status(404).json({ message: "No se ha encontrado el empleado" })
            }

            const liquidation = await Liquidation.findOne({
                _id: liquidationId,
                "employee.employeeId": employee._id
            })

            if (!liquidation) {
                return res.status(404).json({ message: "No se ha encontrado la liquidación de sueldo." })
            }
            return res.status(200).json({ message: "Liquidación de sueldo: ", liquidation })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllLiquidations: async function (req, res) {
        try {
            const { enterpriseId, employeeId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(404).json({ message: "ID inválido de empresa o de empleado." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })
            }
            const employee = await Employee.findOne({ rrhhEnterprise: rrhhEnterprise._id, _id: employeeId })
            console.log(employee._id);

            if (!employee) {
                return res.status(404).json({ message: "No se ha encontrado el empleado" })
            }
            const liquidations = await Liquidation.find({ "employee.employeeId": employee._id })
            return res.status(200).json(liquidations)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateLiquidation: async function (req, res) {
        try {
            const { employee, grossSalary, additionalPayments, deductions, bank, employerContributions, dateOfRemuneration, CCT, employer } = req.body
            const { enterpriseId, employeeId, liquidationId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(liquidationId)) {
                return res.status(404).json({ message: "ID inválido de empresa o de empleado." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })
            }
            const employeeExists = await Employee.findOne({ rrhhEnterprise: rrhhEnterprise._id, _id: employeeId })

            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado" })
            }
            const totalAdditionalPayments = additionalPayments.reduce((acc, val) => acc + val.amount, 0)
            const totalDeductions = deductions.reduce((acc, val) => acc + val.amount, 0)

            const netSalary = grossSalary + (totalAdditionalPayments || 0) - (totalDeductions || 0)
            const updatedBy = await assignAction(req, res, enterprise)
            const updateData = {
                grossSalary, additionalPayments, deductions, bank, employerContributions, netSalary, dateOfRemuneration, CCT, employer, updatedBy: { username: updatedBy.username, position: updatedBy.position, date: new Date() }
            }
            //actualizar liquidacion
            const updatedLiquidation = await Liquidation.findOneAndUpdate(
                { _id: liquidationId, employee: employeeExists._id },
                { $set: updateData },
                { new: true }
            )
            if (!updatedLiquidation) {
                return res.status(404).json({ message: "No se ha encontrado la liquidación" })
            }
            return res.status(200).json(updatedLiquidation)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteLiquidation: async function (req, res) {
        try {
            const { enterpriseId, employeeId, liquidationId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(liquidationId)) {
                return res.status(404).json({ message: "ID inválido de empresa o de empleado." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })
            }
            const employeeExists = await Employee.findOne({ rrhhEnterprise: rrhhEnterprise._id, _id: employeeId })

            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado" })
            }
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
            }
            const deleteLiquidation = await Liquidation.findOneAndDelete({
                _id: liquidationId,
                employee: employeeExists._id,
            })
            if (!deleteLiquidation) {
                return res.status(404).json({ message: "No se ha encontrado la liquidación." })
            }
            const updatedFinance = await Finance.findOneAndUpdate(
                { enterpriseId },
                { $pull: { expenses: { "salary.liquidationId": liquidationId } } },
                { new: true }
            )
            console.log(updatedFinance)
            if (!updatedFinance) return res.status(404).json({ message: "No se ha encontrado la liquidación de haberes en el flujo de caja." })
            employeeExists.liquidations.pull(liquidationId)
            await employeeExists.save()
            calculateCashFlow(updatedFinance)
            await updatedFinance.save()
            return res.status(200).json({ message: "Eliminado exitosamente.", deleteLiquidation })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllLiquidations: async function (req, res) {
        try {
            const { enterpriseId, employeeId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(404).json({ message: "ID inválido de empresa o de empleado." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) {
                return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para esta empresa." })
            }
            const employeeExists = await Employee.findOne({ rrhhEnterprise: rrhhEnterprise._id, _id: employeeId })

            if (!employeeExists) {
                return res.status(404).json({ message: "No se ha encontrado el empleado" })
            }
            const allLiquidationsToDelete = await Liquidation.find({
                employee: employeeExists._id
            })
            if (allLiquidationsToDelete.length === 0) return res.status(404).json({ message: "No se han encontrado liquidaciones" })
            //obtener ids
            const liquidationIds = allLiquidationsToDelete.map((liquidation) => liquidation._id)
            const deletedAllLiquidations = await Liquidation.deleteMany({
                employee: employeeExists._id
            })
            if (deletedAllLiquidations.deletedCount === 0) {
                return res.status(404).json({ message: "No se han encontrado liquidaciones de sueldo." })
            }
            const updatedEmployee = await Employee.findOneAndUpdate(
                { _id: employeeExists._id, },
                { $pull: { liquidations: { $in: employeeExists.liquidations } } },
                { new: true }
            )
            const updatedFinance = await Finance.findOneAndUpdate({
                enterpriseId: enterprise._id,
            }, {
                $pull: { expenses: { "salary.liquidationId": { $in: liquidationIds } } }
            }, {
                new: true
            })
            if (!updatedFinance) return res.status(404).json({ message: "No se ha encontrado el módulo de finanzas." })
            calculateCashFlow(updatedFinance)
            await updatedFinance.save()
            return res.status(200).json({ updatedEmployee, updatedFinance })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = liquidationController