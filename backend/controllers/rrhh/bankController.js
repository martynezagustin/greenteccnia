const mongoose = require("mongoose")
const Enterprise = require("../../models/enterpriseModel")
const Bank = require("../../models/rrhh/banks/bankModel")

const bankController = {
    createBank: async function (req, res) {
        const { enterpriseId } = req.params
        try {
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const { name, shortName, CUIT, bicSwift, supportPhone, supportEmail, city, provinceOrEstate } = req.body
            if (!name || !shortName || !CUIT || !bicSwift || !city || !provinceOrEstate) {
                return res.status(400).json({ message: "Faltan datos obligatorios" })
            }
            const newBank = new Bank({
                enterpriseId: enterprise._id,
                name,
                shortName,
                CUIT,
                bicSwift,
                supportPhone,
                supportEmail,
                city,
                provinceOrEstate
            })
            await newBank.save()
            return res.status(200).json({message: "Banco creado exitosamente."})
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getBank: async function (req, res) {
        try {
            const { enterpriseId, bankId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const bank = await Bank.findOne({
                enterpriseId: enterprise._id,
                _id: bankId
            })
            if (!bank) return res.status(404).json({ message: "No se ha encontrado el banco." })
            return res.status(200).json(bank)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllBanks: async function (req, res) {
        try {
            const { enterpriseId, bankId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const banks = await Bank.find({ enterpriseId: enterprise._id })
            if (banks.length === 0) return res.status(404).json({ message: "No se han encontrado bancos." })
            return res.status(200).json(banks)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = bankController