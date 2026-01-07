const Task = require('../../../models/rrhh/objectivesSubSoftware/RRHHObjectiveTaskModel')
const { validatePeriod } = require('./utils/handlerDates')

const VALID_STATUS = ["PLANNED", "IN_PROGRESS", "COMPLETED", "ABANDONED"]
const TaskService = {
    addTask: async function (objectiveId, enterpriseId, data) {
        const VALID_DIFFICULTY = ["LOW", "MEDIUM", "HIGH"]
        try {
            if (!VALID_STATUS.includes(data.status)) return { error: 'El tipo de estado asignado no es válido', error: 409 }
            if (!VALID_DIFFICULTY.includes(data.difficulty)) return { error: 'El tipo de dificultad asignado no es válido', error: 409 }

            const newTask = new Task({
                objectiveId,
                enterpriseId,
                title: data.title,
                description: data.description,
                status: data.status,
                weight: data.weight,
                difficulty: data.difficulty,
                dueDate: data.dueDate
            })

            await newTask.save()
            return newTask
        } catch (error) {
            return { error: `Ha ocurrido un error de servidor: ${error.message}`, code: 500 }
        }
    },
    getTask: async function (taskId, objectiveId, enterpriseId) {
        try {
            const task = await Task.findOne({ objectiveId, _id: taskId, enterpriseId })
            if (!task) return { error: 'No se ha encontrado la tarea del objetivo RRHH.', code: 404 }
            return task
        } catch (error) {
            return { error: `Ha ocurrido un error de servidor: ${error.message}`, code: 500 }
        }
    },
    getAllTasks: async function (objectiveId, enterpriseId) {
        try {
            const allTasks = await Task.find({ objectiveId, enterpriseId })
            if (!allTasks || allTasks.length === 0) return { error: 'No se han encontrado tareas', error: 404 }
            return allTasks
        } catch (error) {
            return { error: `Ha ocurrido un error de servidor: ${error.message}`, code: 500 }
        }
    },
    deleteTask: async function (taskId, objectiveId, enterpriseId) {
        try {
            const deletedTask = await Task.findOneAndDelete({ enterpriseId, objectiveId, _id: taskId })
            if (!deletedTask) return { error: 'No se ha encontrado la tarea del objetivo RRHH.', code: 404 }
            return deletedTask
        } catch (error) {
            return { error: `Ha ocurrido un error de servidor: ${error.message}`, code: 500 }
        }
    },
    updateTask: async function (taskId, objectiveId, enterpriseId) {
        try {
            const updatedTask = await Task.findOneAndUpdate({ enterpriseId, objectiveId, _id: taskId })
            if (!updatedTask) return { error: 'No se ha encontrado la tarea del objetivo RRHH.', error: 404 }
            return updatedTask
        } catch (error) {
            return { error: `Ha ocurrido un error de servidor: ${error.message}`, code: 500 }
        }
    },
    deleteAllTasksToObjective: async function () {
        try {
            const deletedAllTasks = await Task.deleteMany({ enterpriseId, objectiveId })
            if (!deletedAllTasks || deletedAllTasks.length === 0) return { error: 'No se han encontrado tareas del objetivo RRHH.', error: 404 }
            return deletedAllTasks
        } catch (error) {
            return { error: `Ha ocurrido un error de servidor: ${error.message}`, code: 500 }
        }
    },
    getTasksByCurrentPeriod: async function (objectiveId, period, enterpriseId) {
        try {
            const periodValid = validatePeriod(period)
            const tasksByPeriod = await Task.find({
                objectiveId,
                enterpriseId,
                createdAt: { $gte: periodValid.startDate, $lte: periodValid.endDate }
            })
            if (!tasksByPeriod || tasksByPeriod.length === 0) return { error: 'No se han encontrado tareas en el periodo seleccionado.', code: 404 }
            return tasksByPeriod
        } catch (error) {
            return { error: `Ha ocurrido un error de servidor: ${error.message}`, code: 500 }
        }
    },
    filterTasksByStatus: async function (objectiveId, status, enterpriseId) {
        try {
            if (!VALID_STATUS.includes(status)) return { error: 'El estado de la tarea especificado es inválido', code: 409 }
            const filteredTasks = await Task.find({ objectiveId, enterpriseId, status })
            if (!filteredTasks) return { error: 'No se han encontrado tareas con el estado especificado. Prueba otros estados.', code: 404 }
            return filteredTasks
        } catch (error) {
            return { error: `Ha ocurrido un error de servidor: ${error.message}`, code: 500 }
        }
    }
}

module.exports = TaskService