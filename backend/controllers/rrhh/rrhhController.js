const RRHH = require("../../models/rrhh/rrhhModel")
const Enterprise = require("../../models/enterpriseModel")
const Employee = require("../../models/rrhh/employees/employeeModel")
const Accident = require("../../models/rrhh/accidents/accidentModel")
const { getGenderParity } = require("./functions/employeeHelpers")

const rrhhController = {
    printDashboardSummaryRRHH: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa" })
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos de la empresa." })
            //parte relacionada a empleados
            ///// -- empleados activos  -- nos serviran a futuro
            const employeesActive = await Employee.find({
                enterpriseId: enterprise._id, rrhhEnterprise: rrhhEnterprise._id,
                "jobInfo.contractEndDate": null
            })
            console.log("Empleados activos", employeesActive)
            const now = new Date()
            const startLastYear = new Date(now.getFullYear() - 1, 0, 1)
            startLastYear.setUTCHours(0, 0, 0, 0)

            const endLastYear = new Date(now.getFullYear(), 0, 0)
            endLastYear.setUTCHours(23, 59, 59, 999)

            console.log("PAra printear el dashboard", startLastYear, endLastYear)

            // Empleados activos el año pasado (sin fecha de cese)
            const employeesLastYear = await Employee.find({
                rrhhEnterprise: rrhhEnterprise._id,
                'jobInfo.contractStartDate': { $lte: endLastYear }, //es decir, hasta fin del año pasado comenzó la relación laboral seguro
                $or: [
                    { 'jobInfo.contractEndDate': null },
                    { 'jobInfo.contractEndDate': { $gte: startLastYear } }
                ]
            })

            //porcentaje de crecimiento
            let percentage
            console.log(employeesLastYear)
            if (employeesLastYear.length > 0) {
                percentage = ((employeesActive.length - employeesLastYear.length) / employeesLastYear.length) * 100 || 0
            }

            //paridad de género
            const genderParity = await getGenderParity(enterpriseId, rrhhEnterprise, 'generic')
            //respecto a accidentes laborales
            // ... empleados en total
            const employees = await Employee.find({
                enterpriseId: enterprise._id,
                rrhhEnterprise: rrhhEnterprise._id
            })
            //primero, los nombres de los empleados
            const orConditions = employees.map(e => ({
                "employee.name": e.personalInfo.name,
                "employee.lastname": e.personalInfo.lastname
            }))
            const accidents = await Accident.countDocuments({
                $or: orConditions,
            })
            //presupuesto en salarios
            const payroll = employeesActive.reduce((acc, e) => acc + e.financialInformation.grossSalary, 0) || 0
            return res.status(200).json({
                employees: {
                    total: employeesActive.length,
                    percentage: percentage ? percentage.toFixed(2) : null
                },
                genderParity,
                accidents,
                payroll
            })
        } catch (error) {
            console.error(error);

            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = rrhhController