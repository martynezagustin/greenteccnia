const TaskService = require('../../../services/rrhh/RRHHObjective/RRHHTaskObjectiveService')
const { validateEnterprise } = require('../../../controllers/enterprise/handler/utilEnterprise')

const taskController = {
    createTask: async function (req, res, next) {
        try {
            const { objectiveId } = req.params
            const enterprise = await validateEnterprise(req, res)
            const task = await TaskService.addTask(objectiveId, enterprise._id, req.body)
            if (task.error) return res.status(task.code).json({ message: task.error })
            return res.status(201).json({ message: 'Task añadida con éxito.', task })
        } catch (error) {
            next(error)
        }
    },
    getTask: async function (req, res, next) {
        try {
            const { objectiveId, taskId } = req.params
            const enterprise = await validateEnterprise(req, res)
            const task = await TaskService.getTask(taskId, objectiveId, enterprise._id)
            if (task.error) return res.status(task.code).json({ message: task.error })
            return res.status(200).json(task)
        } catch (error) {
            next(error)
        }
    },
    getAllTasksForObjective: async function (req, res, next) {
        try {
            const { objectiveId } = req.params
            const enterprise = await validateEnterprise(req, res)
            const tasks = await TaskService.getAllTasksForObjective(objectiveId, enterprise._id)
            if (tasks.error) return res.status(tasks.code).json({ message: tasks.error })
            return res.status(200).json(tasks)
        } catch (error) {
            next(error)
        }
    },
    deleteTask: async function (req, res, next) {
        try {
            const { objectiveId, taskId } = req.params
            const enterprise = await validateEnterprise(req, res)
            const deletedTask = await TaskService.deleteTask(taskId, objectiveId, enterprise._id)
            if (!deletedTask) return res.status(deletedTask.code).json({ message: deletedTask.error })
        } catch (error) {
            next(error)
        }
    },
    updateTask: async function (req, res, next) {
        try {
            const { objectiveId, taskId } = req.params
            const enterprise = await validateEnterprise(req, res)
            const updatedTask = await TaskService.updateTask(taskId, objectiveId, enterprise._id, req.body)
            if (!updatedTask) return res.status(updatedTask.code).json({ message: updatedTask.error })
            return res.status(200).json({message: updatedTask.message})
        } catch (error) {
            next(error)
        }
    }
}

module.exports = taskController