const Enterprise = require("../../models/enterpriseModel")

const verifyOwnership = async (req, res, next) => {
    try {

        const { enterpriseId } = req.params
        const userId = req.user.userId
        
        const enterprise = await Enterprise.findById(enterpriseId)
        if (!enterprise) {
            return res.status(404).json({ message: "No se ha encontrado la empresa" })
        }
        const userIdToEnterprise = enterprise.userId.toString()
        if (userIdToEnterprise != userId) {
            return res.status(403).json({ message: "No tienes permiso para modificar los datos de esta empresa" })
        }
        console.log("Usuario correcto");
        
        next()
    } catch (error) {
        return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
    }
}

module.exports = verifyOwnership