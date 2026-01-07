const mongoose = require("mongoose")
const Negotiation = require("../../models/clients/negotiationModel")
const Client = require("../../models/clients/clientModel")
const Enterprise = require("../../models/enterpriseModel")
const assignAction = require("../handlers/members/assignAction")

const negotiationController = {
    addNegotiation: async function (req, res) {
        try {
            const { enterpriseId, clientId } = req.params
            const { aspects, status, lastComunication, expectingCloseData, notes } = req.body
            if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(clientId)) return res.status(404).json({ message: "ID de empresa o de cliente inválido." })
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const client = await Client.findOne({ enterpriseId: enterprise._id, _id: clientId })
            if (!client) return res.status(404).json({ message: "No se ha encontrado el cliente." })
            const validTypes = ["Ganada", "En proceso", "Perdida"]
            if (!validTypes.includes(status)) return res.status(400).json({ message: "El tipo de estado proporcionado no es válido." })
            const createdBy = await assignAction(req, res, enterprise)
            const newNegotiation = new Negotiation({
                clientId: client._id,
                aspects,
                status,
                lastComunication,
                expectingCloseData,
                notes: notes || [],
                createdBy: {
                    username: createdBy.username,
                    position: createdBy.position,
                    date: new Date()
                }
            })
            client.negotiations.push(newNegotiation._id)
            await newNegotiation.save()
            return res.status(200).json({ message: "Negociación añadida con éxito.", newNegotiation })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getNegotiation: async function (req, res) {
        try {
            const { enterpriseId, clientId, negotiationId } = req.params
            if (!mongoose.Schema.Types.ObjectId(enterpriseId) || !mongoose.Schema.Types.ObjectId(clientId) || !mongoose.Schema.Types.ObjectId(negotiationId)) return res.status(400).json({ message: "ID inválido de empresa, de cliente o de negociación." })
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const client = await Client.findOne({ enterpriseId: enterprise._id, _id: clientId })
            if (!client) return res.status(404).json({ message: "No se ha encontrado el cliente." })
            const negotiation = await Negotiation.findOne({
                _id: negotiationId,
                clientId: client._id
            })
            if (!negotiation) return res.status(404).json({ message: "No se ha encontrado la negociación." })
            return res.status(200).json(negotiation)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllNegotiations: async function (req, res) {
        try {
            const { enterpriseId, clientId } = req.params
            if (!mongoose.Schema.Types.ObjectId(enterpriseId) || !mongoose.Schema.Types.ObjectId(clientId)) return res.status(400).json({ message: "ID inválido de empresa o de cliente." })
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const client = await Client.findOne({ enterpriseId: enterprise._id, _id: clientId })
            if (!client) return res.status(404).json({ message: " No se ha encontrado el cliente" })
            const allNegotiations = await Negotiation.find({
                clientId: client._id
            })
            if (allNegotiations.length === 0) return res.status(404).json({ message: "No se han encontrado negociaciones." })
            return res.status(200).json(allNegotiations)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteNegotiation: async function (req, res) {
        try {
            const { enterpriseId, clientId, negotiationId } = req.params
            if (!mongoose.Schema.Types.ObjectId(enterpriseId) || !mongoose.Schema.Types.ObjectId(clientId) || !mongoose.Schema.Types.ObjectId(negotiationId)) return res.status(400).json({ message: "ID inválido de empresa, de cliente o de negociación." })
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const client = await Client.findOne({ enterpriseId: enterprise._id, _id: clientId })
            if (!client) return res.status(404).json({ message: " No se ha encontrado el cliente" })
            const deletedNegotiation = await Negotiation.findOneAndUpdate({
                _id: negotiationId, clientId: client._id
            })
            if (!deletedNegotiation) return res.status(404).json({ message: "No se ha encontrado la negociación." })
            client.negotiations.pull(negotiationId)
            await client.save()
            return res.status(200).json({ message: "Negociación eliminada con éxito.", deletedNegotiation })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteAllNegotiations: async function (req, res) {
        try {
            const { enterpriseId, clientId } = req.params
            if (!mongoose.Schema.Types.ObjectId(enterpriseId) || !mongoose.Schema.Types.ObjectId(clientId)) return res.status(404).json({ message: "ID de empresa o de cliente inválido." })
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const client = await Client.findOne({ _id: clientId, enterpriseId: enterprise._id })
            if (!client) return res.status(404).json({ mesage: "No se ha encontrado el cliente." })
            const deletedAllNegotiations = await Negotiation.deleteMany({
                clientId: client._id
            })
            if (deletedAllNegotiations.deletedCount === 0) return res.status(404).json({ message: "No se han encontrado negociaciones." })
            const updatedClient = await Client.findOneAndUpdate({
                enterpriseId: enterprise._id,
                clientId: client._id
            }, {
                $pull: { negotiations: { $in: client.negotiations } }
            }, {
                new: true
            })
            if (!updatedClient) return res.status(404).json({ message: "No se ha encontrado el cliente." })
            return res.status(200).json({ message: "Todas las negociaciones eliminadas con éxito." })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateNegotiation: async function (req, res) {
        try {
            const { enterpriseId, clientId, negotiationId } = req.params
            if (!mongoose.Types.ObjectI.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(clientId) || !mongoose.Types.ObjectId.isValid(negotiationId)) {
                return res.status(404).json({ message: "ID de empresa, de cliente o de negociación inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const client = await Client.findOne({ enterpriseId: enterprise._id, _id: clientId })
            if (!client) return res.status(404).json({ message: " No se ha encontrado el cliente" })
            const updatedBy = await assignAction(req, res, enterprise)
            const updatedNegotiation = await Negotiation.findOneAndUpdate({
                _id: negotiationId, clientId: client._id,
                updatedBy: {
                    username: updatedBy.username,
                    position: updatedBy.position,
                    date: new Date()
                }
            })
            if (!updatedNegotiation) return res.status(404).json({ message: "No se ha encontrado la negociación." })
            return res.status(200).json({ message: " Negociación actualizada" })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    filterNegotiationsByStatus: async function (req, res) {
        try {
            const { enterpriseId, clientId } = req.params
            const { status } = req.query
            if (!mongoose.Types.ObjectI.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(clientId)) {
                return res.status(404).json({ message: "ID de empresa o de cliente inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const client = await Client.findOne({ enterpriseId: enterprise._id, _id: clientId })
            if (!client) return res.status(404).json({ message: " No se ha encontrado el cliente" })
            const validTypes = ["Ganada", "Perdida", "En proceso"]
            if (!validTypes.includes(status)) return res.status(400).json({ message: "El tipo de estado proporcionado no es válido." })
            const filteredNegotiationsByStatus = await Negotiation.find({
                clientId: client._id,
                status: status
            })
            if (filteredNegotiationsByStatus.length === 0) return res.status(404).json({ message: "No se han encontrado negociaciones con el tipo de estado indicado." })
            return res.status(200).json(filteredNegotiationsByStatus)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    filterNegotiationsByExpectingCloseDate: async function (req, res) {
        try {
            const { enterpriseId, clientId } = req.params
            const { expectingCloseDate } = req.query
            if (!mongoose.Types.ObjectI.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(clientId)) {
                return res.status(404).json({ message: "ID de empresa o de cliente inválido." })
            }
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const client = await Client.findOne({ enterpriseId: enterprise._id, _id: clientId })
            if (!client) return res.status(404).json({ message: " No se ha encontrado el cliente" })
            const filteredNegotiationsByStatus = await Negotiation.find({
                clientId: client._id,
                expectingCloseDate: expectingCloseDate
            })
            if (filteredNegotiationsByStatus.length === 0) return res.status(404).json({ message: "No se han encontrado negociaciones con la fecha de expectativa de cierre indicada." })
            return res.status(200).json(filteredNegotiationsByStatus)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}


module.exports = negotiationController