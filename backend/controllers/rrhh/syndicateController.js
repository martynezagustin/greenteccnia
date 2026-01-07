const Syndicate = require("../../models/rrhh/employees/syndicate/syndicateModel")
const Enterprise = require("../../models/enterpriseModel")

const syndicateController = {
    createSyndicate: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const { name, email, type, jurisdiction } = req.body
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const validJurisdictions = ["Internacional", "Nacional", "Provincial/Estatal", "Municipal", "Departamental"]
            if (!validJurisdictions.includes(jurisdiction)) {
                return res.status(400).json({ message: "El tipo de jurisdicción proporcionada no es válida." })
            }
            const validTypes = ['Sindicato con personería gremial', 'Sindicato simplemente inscripto', 'Sindicato de empresa', 'Sindicato de actividad', 'Federación', 'Confederación'] 
            if(!validTypes.includes(type)) return res.status(400).json({message: "El tipo de sindicato proporcionado no es válido."})
            const syndicateExists = await Syndicate.findOne({name: name, type: type})
            if(syndicateExists) return res.status(400).json({message: "¿Acaso no existe ya el sindicato?"})
            const newSyndicate = new Syndicate({
                enterpriseId, name, email, jurisdiction
            })
            await newSyndicate.save()
            return res.status(200).json({ message: "Sindicato creado con éxito." })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Ha ocurrido un error de servidor." })
        }
    },
    getSyndicate: async function (req, res) {
        try {
            const { enterpriseId, syndicateId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const syndicate = await Syndicate.findOne({ enterpriseId: enterprise._id, _id: syndicateId })
            if (!syndicate) return res.status(404).json({ message: "No se ha encontrado el sindicato." })
            return res.status(200).json(syndicate)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor." })
        }
    },
    getAllSyndicates: async function (req, res) {
        try {
            const { enterpriseId } = req.params
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const allSyndicates = await Syndicate.find({ enterpriseId: enterpriseId })
            if (allSyndicates.length === 0) return res.status(404).json({ message: "No se han encontrado sindicatos." })
            return res.status(200).json(allSyndicates)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = syndicateController