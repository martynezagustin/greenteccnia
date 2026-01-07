const Employee = require("../../../models/rrhh/employees/employeeModel");
const Department = require("../../../models/rrhh/employees/departments/departmentModel");

//es para determinar el horario de entrada del empleado
function calculateLateMinutes(checkIn, normalCheckIn) {
    const [normalHours, normalMin] = normalCheckIn.split(':').map(number)
    const normalMinutes = normalHours * 60 + normalMin;

    //convertimos el checkIn a fecha
    const checkInDate = new Date(checkIn);
    //obtenemos la hora y minutos del checkIn
    const checkInHours = checkInDate.getHours() * 60 + checkInDate.getMinutes();
    return Math.max(0, checkInHours - normalMinutes)

}
//es para calcular la tasa de rotación de empleados
async function calculateTurnoverRate(enterpriseId, startPeriod, endPeriod) {
    const leavers = await Employee.countDocuments({
        enterpriseId,
        'jobInfo.contractEndDate': { $gte: new Date(startPeriod), $lte: new Date(endPeriod) }
    })
    //empleados activos al inicio
    const employeesAtStart = await Employee.countDocuments({
        enterpriseId,
        'jobInfo.startDate': { $lte: startPeriod },
        $or: [
            { 'jobInfo.contractEndDate': null },
            { 'jobInfo.contractEndDate': { $gte: startPeriod } }
        ]
    })
    //empleados activos al final
    const employeesAtEnd = await Employee.countDocuments({
        enterpriseId,
        'jobInfo.contractStartDate': { $lte: endPeriod },
        $or: [
            { 'jobInfo.contractEndDate': null },
            { 'jobInfo.contractEndDate': { $gte: endPeriod } }
        ]
    })

    //promedio empleados
    const averageEmployees = (employeesAtStart + employeesAtEnd) / 2
    //tasa de rotacion
    const turnoverRate = (leavers / averageEmployees) * 100 || 0
    return parseFloat(turnoverRate.toFixed(1))
}

async function getGenderParity(enterpriseId, rrhhEnterprise, type) {
    const totalGender = {}
    let employees
    let totalEmployees
    switch (type) {
        case 'generic':
            employees = await Employee.find({ rrhhEnterprise: rrhhEnterprise._id, 'jobInfo.contractEndDate': null })
            employees.forEach((e) => {
                const gender = e.personalInfo.gender
                totalGender[gender] = (totalGender[gender] || 0) + 1
            })
            //get percentage
            totalEmployees = employees.length
            Object.keys(totalGender).forEach((g) => {
                totalGender[g] = ((totalGender[g] / totalEmployees) * 100)
                totalGender[g] = parseFloat(totalGender[g].toFixed(2))
            })
            break;
        case 'per-department':
            const departments = await Department.find({ enterpriseId: enterpriseId })
            if (!departments) throw new Error('No puede calcularse la paridad de género en departamentos.')
            const totalDepartments = {}
            for (const department of departments) {
                const employees = await Employee.find({
                    enterpriseId: enterpriseId,
                    rrhhEnterprise: rrhhEnterprise._id,
                    'jobInfo.contractEndDate': null,
                    'jobInfo.department.name': department.name
                })
                console.log("Empleados que encuentra", employees)
                const genderCount = {}
                const total = employees.length

                employees.forEach((e) => {
                    const gender = e.personalInfo.gender || 'No especificado'
                    genderCount[gender] = (genderCount[gender] || 0) + 1
                })

                Object.keys(genderCount).forEach((g) => {
                    genderCount[g] = parseFloat(((genderCount[g] / total) * 100).toFixed(2))
                })

                totalDepartments[department.name] = {
                    totalEmployees: total,
                    parity: genderCount
                }
            }
            console.log("Vayamos a totalDepartments", totalDepartments)
            return totalDepartments
        default:
            break;
    }
    return totalGender
}

module.exports = {
    calculateTurnoverRate, calculateLateMinutes, getGenderParity
}