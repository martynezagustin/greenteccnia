const cron = require("node-cron")
const WorkEnvironmentSnapshot = require("../../../../models/rrhh/satisfaction/workEnvironmentSnapshotModel")
const RRHH = require("../../../../models/rrhh/rrhhModel")
const Enterprise = require("../../../../models/enterpriseModel")
const Employee = require("../../../../models/rrhh/employees/employeeModel")
const { calculateGenericWorkEnvironmentPerMonth } = require("./calculateWorkEnvironment")

//La tarea se ejecuta el primer día de cada mes a las 00:00
const scheduleCronWorkEnvironmentSnapshot = async () => {
    cron.schedule("0 0 1 * *", async () => {
        try {
            console.log("🧠 Generando cálculo del clima laboral mensual, función clave para graficar")
            const enterprises = await Enterprise.find()
            for (const enterprise of enterprises) {
                const now = new Date()
                now.setMonth(now.getMonth() - 1)
                const month = now.getMonth() + 1
                const year = now.getFullYear()
                console.log(`Procesando empresa ${enterprise.nameEnterprise} para ${month}/${year}`)
                const score = await calculateGenericWorkEnvironmentPerMonth(enterprise._id, year, month)
                const exists = await WorkEnvironmentSnapshot.findOne({ enterpriseId: enterprise._id, year, month })
                if (exists) {
                    console.log(`Ya existe el snapshot para la empresa ${enterprise.nameEnterprise} en el mes ${month}/${year}`)
                    continue
                }
                console.log(score, "Este es el score del cron que configuras")
                if(score === null) {
                    console.log(`No se pudo calcular el clima laboral para la empresa ${enterprise.nameEnterprise} en el mes ${month}/${year} por falta de datos.`)
                    continue
                }
                const snapshot = new WorkEnvironmentSnapshot({
                    enterpriseId: enterprise._id,
                    year,
                    month,
                    workEnvironmentScore: score
                })
                const rrhh = await RRHH.findOne({ enterpriseId: enterprise._id })
                if (rrhh) {
                    await snapshot.save()
                    rrhh.workEnvironmentSnapshots.push(snapshot._id)
                    await rrhh.save()
                }
            }
        } catch (error) {
            console.error("Hubo un error al generar el clima laboral", error)
        }
    })
}

module.exports = scheduleCronWorkEnvironmentSnapshot