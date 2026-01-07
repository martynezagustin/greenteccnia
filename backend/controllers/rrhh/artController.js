const mongoose = require("mongoose")
const ART = require("../../models/rrhh/employees/ART/artModel")
const Enterprise = require("../../models/enterpriseModel")
const RRHH = require("../../models/rrhh/rrhhModel")

const artController = {
    createART: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { name, CUIT, address, phone, email, dateOfContract, endOfContract } = req.body
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos de la empresa." })
            const newART = new ART({
                enterpriseId: enterprise._id,
                name,
                CUIT,
                address,
                phone,
                email,
                dateOfContract,
                endOfContract
            })
            await newART.save()
            return res.status(200).json({message: "ART añadida con éxito."})
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getART: async function (req, res) {
        try {
            const { enterpriseId, ARTId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para la empresa. " })
            const ART = await ART.findOne({ enterpriseId: enterprise._id, _id: ARTId })
            if (!ART) return res.status(404).json({ message: "No se ha encontrado la aseguradora de riesgos." })
            return res.status(200).json(ART)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllARTs: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const rrhhEnterprise = await RRHH.findOne({ enterpriseId: enterprise._id })
            if (!rrhhEnterprise) return res.status(404).json({ message: "No se ha encontrado el módulo de Recursos Humanos para la empresa. " })
            const ARTs = await ART.find({
                enterpriseId: enterprise._id
            })
            if (ARTs.length === 0) return res.status(404).json({ message: "No se han encontrado aseguradora de riesgos." })
            return res.status(200).json(ARTs)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = artController