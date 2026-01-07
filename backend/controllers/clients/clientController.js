const Client = require("../../models/clients/clientModel")
const Enterprise = require("../../models/enterpriseModel")
const assignAction = require("../handlers/members/assignAction")
const mongoose = require("mongoose")

const clientController = {
    addClient: async function (req, res) {
        try {
            const { name, lastname, email, phone, address, age, categoryIVA, tags, taskDescription, taskStartDate, taskEndDate } = req.body
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const clientExists = await Client.findOne({ $or: [{ name }, { lastname }, { phone }] })
            if (clientExists) {
                return res.status(409).json({ message: "El cliente ya existe." })
            }
            const createdBy = await assignAction(req, res, enterprise)
            const client = new Client({
                enterpriseId: enterprise._id, name, lastname, email, phone, address, age, categoryIVA, tags, createdBy: {
                    username: createdBy.username,
                    position: createdBy.position,
                    date: new Date()
                }
            })
            if (taskDescription) {
                client.tasks.push({ description: taskDescription, startDate: taskStartDate, endDate: taskEndDate })
            }
            await client.save()
            enterprise.clients.push(client)
            await enterprise.save()
            return res.status(200).json({ message: "Cliente añadido con éxito.", client, enterprise })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getClient: async function (req, res) {
        try {
            const { enterpriseId, clientId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(clientId)) {
                return res.status(404).json({ message: "No se ha encontrado el cliente o no pertenece a la empresa." })
            }
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const client = await Client.findOne({ _id: clientId, enterpriseId: enterpriseId })
            if (!client) {
                return res.status(404).json({ message: "No se ha encontrado el cliente o no pertenece a la empresa." })
            }
            res.json(client)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllClients: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const clients = await Client.find({ enterpriseId })
            res.json(clients)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateClient: async function (req, res) {
        try {
            const { name, lastname, email, phone, address, age, categoryIVA } = req.body
            const { enterpriseId, clientId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(clientId)) {
                return res.status(404).json({ message: "No se ha encontrado el cliente o no pertenece a la empresa." })
            }
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const updatedBy = await assignAction(req, res, enterprise)
            const updatedClient = await Client.findOneAndUpdate({ _id: clientId, enterpriseId: enterpriseId }, {
                name, lastname, email, phone, address, age, categoryIVA, tags, updatedBy: {
                    username: updatedBy.username,
                    position: updatedBy.position,
                    date: new Date()
                }
            }, { new: true })
            if (!updatedClient) {
                return res.status(404).json({ message: "No se ha podido actualizar el cliente." })
            }
            return res.status(200).json({ message: "Cliente actualizado con éxito.", updatedClient })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteClient: async function (req, res) {
        try {
            const { enterpriseId, clientId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(clientId)) {
                return res.status(404).json({ message: "No se ha encontrado el cliente o no pertenece a la empresa." })
            }
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const deletedClient = await Client.findOneAndDelete({ _id: clientId, enterpriseId: enterpriseId })
            if (!deletedClient) {
                return res.status(404).json({ message: "No se ha podido borrar el cliente." })
            }
            return res.status(200).json({ message: "Cliente borrado con éxito.", deletedClient })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    addTaskToClient: async function (req, res) {
        try {
            const { taskDescription, taskStartDate, taskEndDate } = req.body
            const { enterpriseId, clientId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(clientId)) {
                return res.status(404).json({ message: "No se ha encontrado el cliente o no pertenece a la empresa." })
            }
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const client = await Client.findOne({ _id: clientId, enterpriseId: enterpriseId })
            if (!client) {
                return res.status(404).json({ message: "No se ha encontrado el cliente." })
            }
            const createdBy = await assignAction(req, res, enterprise)
            if (taskDescription) {
                client.tasks.push({
                    description: taskDescription, startDate: taskStartDate, endDate: taskEndDate, createdBy: {
                        username: createdBy.username,
                        position: createdBy.position,
                        date: new Date()
                    }
                })
            }
            await client.save()
            return res.json(client)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    getTaskToClient: async function (req, res) {
        try {
            const { enterpriseId, clientId, taskId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(clientId)) {
                return res.status(404).json({ message: "No se ha encontrado el cliente o no pertenece a la empresa." })
            }
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const client = await Client.findOne({ _id: clientId, enterpriseId: enterpriseId })
            if (!client) {
                return res.status(404).json({ message: "No se ha encontrado el cliente" })
            }
            const task = client.tasks.find((task) => task._id.toString() === taskId)
            if (!task) {
                return res.status(404).json({ message: "No se ha encontrado la tarea." })
            }
            return res.json(task)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllTasksToClient: async function (req, res) {
        try {
            const { enterpriseId, clientId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(clientId)) {
                return res.status(404).json({ message: "No se ha encontrado el cliente o no pertenece a la empresa." })
            }
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const client = await Client.findOne({ _id: clientId, enterpriseId: enterpriseId })
            if (!client) {
                return res.status(404).json({ message: "No se ha encontrado el cliente o no pertenece a la empresa." })
            }
            const tasks = client.tasks
            if (!tasks) {
                return res.status(404).json({ message: "No se han encontrado tareas." })
            }
            return res.json(tasks)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteTaskToClient: async function (req, res) {
        try {
            const { enterpriseId, clientId, taskId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(clientId)) {
                return res.status(404).json({ message: "No se ha encontrado el cliente o no pertenece a la empresa." })
            }
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const client = await Client.findOne({ _id: clientId, enterpriseId: enterpriseId })
            if (!client) {
                return res.status(404).json({ message: "No se ha encontrado el cliente o no pertenece a la empresa." })
            }
            const task = client.tasks.find((task) => task._id.toString() === taskId)
            if (!task) {
                return res.status(404).json({ message: "No se ha encontrado la tarea." })
            }
            client.tasks.pull(taskId)
            await client.save()
            return res.json(client.tasks)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateTaskToClient: async function (req, res) {
        try {
            const { taskDescription, taskStartDate, taskEndDate } = req.body
            const { enterpriseId, clientId, taskId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(clientId)) {
                return res.status(404).json({ message: "No se ha encontrado el cliente o no pertenece a la empresa." })
            }
            if (!enterprise) {
                return res.status(404).json({ message: "No se ha encontrado la empresa." })
            }
            const client = await Client.findOne({ _id: clientId, enterpriseId: enterpriseId })
            if (!client) {
                return res.status(404).json({ message: "No se ha encontrado el cliente o no pertenece a la empresa." })
            }
            const task = client.tasks.find((task) => task._id.toString() === taskId)
            if (!task) {
                return res.status(404).json({ message: "No se ha encontrado la tarea." })
            }
            const updatedBy = await assignAction(req, res, enterprise)
            const updateData = {}

            if (taskDescription) updateData['tasks.$.description'] = taskDescription
            if (taskStartDate) updateData['tasks.$.startDate'] = taskStartDate
            if (taskEndDate) updateData['tasks.$.endDate'] = taskEndDate
            updateData['tasks.$.updatedBy'] = {
                username: updatedBy.username,
                position: updatedBy.position,
                date: new Date()
            }

            console.log(taskId)
            const taskUpdated = await Client.findOneAndUpdate(
                { _id: clientId, enterpriseId: enterpriseId, ['tasks._id']: taskId },
                { $set: updateData },
                { new: true }
            )
            if (!taskUpdated) {
                return res.status(404).json({ message: "No se ha podido actualizar la tarea." })
            }
            return res.json(taskUpdated)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = clientController
