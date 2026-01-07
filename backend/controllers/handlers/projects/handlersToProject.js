function convertToDays(data) {
    const defaultUnit = "litros"
    const conversionRates = {
        horas: 1 / 24,
        días: 1,
        mes: 30,
        años: 365
    }

    const rate = conversionRates[data.frecuency] || 1
    return {
        value: data.value * rate,
        unit: data?.unit || defaultUnit,
        frecuency: "día"

    }
}

const calculateProgress = (tasks) => {
    const totalTasks = tasks.length
    if (totalTasks === 0) return 0
    const completedTasks = tasks.filter(task => task.status === "Completada").length
    return Math.round((completedTasks / totalTasks) * 100)
}

module.exports = { convertToDays, calculateProgress }