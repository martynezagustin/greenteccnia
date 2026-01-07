const SustainabilityEnterprise = require("../../../models/sustainability/sustainabilityModel")
const SustainableEmployee = require("../../../models/rrhh/sustainableRrhh/sustainableEmployeeModel")
const Employee = require("../../../models/rrhh/employees/employeeModel")

const setSustainableValuesToEnterprise = async function (req, res, rrhhEnterprise, enterprise) {
    try {
        const employees = await Employee.find({
            rrhhEnterprise: rrhhEnterprise._id
        })
        if (employees.length === 0) {
            return res.status(404).json({ message: "No se han encontrado empleados." })
        }
        const sustainableEmployees = await Promise.all(
            employees.map((employee) => SustainableEmployee.findOne({ employeeId: employee._id }))
        )
        const totalCarbonFootprintAccumulatedKG = sustainableEmployees.reduce((acc, sE) => {
            return acc + sE.carbonFootprint?.carbonFootprintKG || 0
        }, 0)
        console.log("El total acumulado de huella de carbono por empleados", totalCarbonFootprintAccumulatedKG)
        const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({
            enterpriseId: enterprise._id
        })
        if(!sustainabilityEnterprise){
            return res.status(404).json({message: "No existe el módulo de sustentabilidad de la empresa."})
        }
        sustainabilityEnterprise.carbonFootprint.carbonFootprintG = totalCarbonFootprintAccumulatedKG * 1000
        sustainabilityEnterprise.carbonFootprint.carbonFootprintLB = totalCarbonFootprintAccumulatedKG * 2.2025
        sustainabilityEnterprise.carbonFootprint.carbonFootprintKG = totalCarbonFootprintAccumulatedKG
        sustainabilityEnterprise.carbonFootprint.carbonFootprintMT = totalCarbonFootprintAccumulatedKG / 1000
        await sustainabilityEnterprise.save()
    } catch (error) {
        return res.status(500).json({error: "Ha ocurrido un error de servidor: " + error})
    }
}

module.exports = setSustainableValuesToEnterprise