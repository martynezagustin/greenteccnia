const Assist = require("../../../models/rrhh/assistModel")
const SustainableEmployee = require("../../../models/rrhh/sustainableRrhh/sustainableEmployeeModel")

const carbonFootprintCalculatorToEmployee = async function (employee) {
    const assists = await Assist.find({ employeeId: employee._id })
    const sustainableEmployee = await SustainableEmployee.findOne({
        employeeId: employee._id
    })
    if(!sustainableEmployee){
        return console.error("No se encontró el módulo sustentable.")
    }
    const totalCarbonFootprint = assists.reduce((acc, assist) => acc + parseFloat(assist.carbonFootprintForAssist.value).toFixed(2), 0)
    sustainableEmployee.carbonFootprint.carbonFootprintG = totalCarbonFootprint * 1000
    sustainableEmployee.carbonFootprint.carbonFootprintLB = totalCarbonFootprint * 2.205
    sustainableEmployee.carbonFootprint.carbonFootprintKG = totalCarbonFootprint
    sustainableEmployee.carbonFootprint.carbonFootprintMT = totalCarbonFootprint / 1000
    await sustainableEmployee.save()

    console.log(sustainableEmployee)
}

module.exports = carbonFootprintCalculatorToEmployee