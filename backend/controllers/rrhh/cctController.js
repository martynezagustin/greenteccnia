const CCT = require("../../models/rrhh/employees/cct/cctModel")
const Enterprise = require("../../models/enterpriseModel")

const CCTController = {
    createCCT: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { name, dateOfCelebration, cctNumber, contractDocument } = req.body
            const enterprise = await Enterprise.findById(enterpriseId)
            console.log(req.body)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            if(!name || !cctNumber || !dateOfCelebration) return res.status(400).json({message: "Hay campos incompletos. Vuelva a intentarlo."})
            const newCCT = new CCT({
                enterpriseId,
                name,
                dateOfCelebration,
                cctNumber,
                contractDocument
            })
            await newCCT.save()
            return res.status(200).json({ message: "Convenio colectivo creado con éxito." })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ message: "Error del servidor.", error})
        }
    },
    getCCT: async function (req, res) {
        try {
            const { enterpriseId, CCTId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const CCT = await CCT.findOne({ enterpriseId, CCTId })
            if (!CCT) return res.status(404).json({ message: "No se ha encontrado el convenio colectivo." })
            return res.status(200).json(CCT)
        } catch (error) {
            return res.status(500).json({ message: "Error del servidor.", error: error.message })
        }
    },
    getAllCCTs: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const ccts = await CCT.find({
                enterpriseId
            })
            if (ccts.length === 0) return res.status(404).json({ message: "No se han encontrado convenios colectivos." })
            return res.status(200).json(ccts)
        } catch (error) {
            return res.status(500).json({ message: "Error del servidor.", error: error.message })
        }
    }
}

module.exports = CCTController