const healthEngine = async (objective, totalTasks, completedTasks) => {
    try {
        console.log(totalTasks, completedTasks);

        let progress
        progress = totalTasks > 0 ? ((completedTasks > 0 && !isNaN(completedTasks) ? completedTasks : 0 / totalTasks > 0 ? totalTasks : 0) * 100) : 0
        if(progress >= 100){
            progress = 100
        }

        //bloque 2, días que quedan
        const now = new Date()
        const startDate = new Date(objective.startDate)
        const endDate = new Date(objective.endDate)
        const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) || 0
        console.log('Cuántos días quedan?', daysRemaining)
        let status

        if (startDate > now) {
            status = 'PLANNED'
        }
        else if (progress === 100) {
            status = 'COMPLETED'
        } else if (endDate < now) {
            status = 'EXPIRED'
        }
        else if (daysRemaining <= 10 && progress < 50) {
            status = 'CRITICAL'
        }
        else {
            status = 'ACTIVE'
        }
        return { progress, status }
    } catch (error) {
        throw new Error('Ocurrió un error con el healthEngine', error)
    }
}

module.exports = healthEngine