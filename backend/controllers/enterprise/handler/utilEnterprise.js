const Enterprise = require('../../../models/enterpriseModel')
const mongoose = require('mongoose')

async function validateEnterprise(req, res) {
    const { enterpriseId } = req.params
    const enterprise = await Enterprise.findById(enterpriseId)
    if (!mongoose.Types.ObjectId.isValid(enterpriseId)) return { error: 'ID inválido de empresa.', code: 404 }
    if (!enterprise) return res.status(404).json({ message: 'No se ha encontrado la empresa.' })
    return enterprise
}

module.exports = { validateEnterprise }