const Employee = require("../../../models/rrhh/employees/employeeModel")
const Assist = require("../../../models/rrhh/assistModel")

function calculatePunctuality(expectedTime, actualTime, status) {
    const actual = new Date(actualTime)
    console.log("Lo que ingresé",actual)
    const [expHour, expMin] = expectedTime.split(":").map(Number)

    const expected = new Date(actual)
    expected.setHours(expHour, expMin, 0, 0)

    console.log("El tiempo de expectativa", expected)

    const diffMs = actual - expected
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin <= 0) return { status: 'PUNTUAL', minutesLate: 0 };
    if (diffMin <= 10) return { status: 'TARDE', minutesLate: diffMin }
    if(diffMin < 30) return {status: 'MUY TARDE', minutesLate: diffMin}
    return { status: null, minutesLate: diffMin }
}

const calculateMonthlyIndexPuntuality = async (employeeId, month, year) => {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const assists = await Assist.find({
        employeeId: employeeId,
        dateAssist: { $gte: startDate, $lte: endDate }
    })

    const employee = await Employee.findById(employeeId)
    if (!employee) throw new Error("Empleado no encontrado.")

    const expected = employee.jobInfo?.expectedCheckInTime
    if (!expected) throw new Error('El empleado no tiene hora esperada de ingreso.')

    const [expectedHours, expectedMinutes] = expected.split(":").map(Number)

    let onTime = 0

    const validAssists = assists.filter(a => a.checkIn)
    console.log('Asistencias para calcular index o puntaje',validAssists);
    

    validAssists.forEach(a => {
        if (!a.checkIn) return
        console.log(a.checkIn)

        const checkInDate = new Date(a.checkIn)
        const expectedCheckIn = new Date(checkInDate)
        expectedCheckIn.setHours(expectedHours, expectedMinutes, 0, 0)
        console.log("Fecha de checkIn", checkInDate, "Fecha de expected check", expectedCheckIn)
        if (checkInDate <= expectedCheckIn) onTime++
        console.log("On time?",onTime)
    });


    const total = validAssists.length
    if (total === 0) return null

    const index = (onTime / validAssists.length) * 100

    return Number(index.toFixed(2))
}

module.exports = { calculatePunctuality, calculateMonthlyIndexPuntuality }