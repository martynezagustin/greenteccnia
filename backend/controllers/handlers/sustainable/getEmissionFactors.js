const axios = require("axios")
const getEmissionFactorsByPaper = async function (req, res) {
    try {
        const responsePaper = await axios.get("http://localhost:3000/api/paper-factors")
        let emissionFactorPaper = responsePaper.data;
        return emissionFactorPaper
    } catch (error) {
        return res.status(500).json({ error: "Hubo un error al traer los factores de emisión: " + error })
    }
}

const getEmissionFactorsByWasted = async function (req, res) {
    try {
        const responseWasted = await axios.get("http://localhost:3000/api/wasted-factors")
        let emissionFactorWasted = responseWasted.data;
        return emissionFactorWasted
    } catch (error) {
        return res.status(500).json({ error: "Hubo un error al traer los factores de emisión: " + error })
    }
}

const getEmissionFactorsByFuel = async function (req, res) {
    let emissionFactorsByFuel
    //consumir la API de carbonfootprint
    try {
        const responseFuelFactors = await axios.get("http://localhost:3000/api/fuel-factors")
        emissionFactorsByFuel = responseFuelFactors.data
        return emissionFactorsByFuel
    } catch (error) {
        return res.status(500).json({ error: "Hubo un error al traer los factores de emisión: " + error })
    }
}

const getFuelConsumptionByType = async function(req,res){
    try {
        let fuelConsumptionByType
        const responseFuelConsumptionByType = await axios.get("http://localhost:3000/api/fuel-consumption")
        fuelConsumptionByType = responseFuelConsumptionByType.data
        return fuelConsumptionByType
    } catch (error) {
        return res.status(500).json({ error: "Hubo un error al traer los factores de emisión: " + error })
    }
}


module.exports = { getEmissionFactorsByPaper, getEmissionFactorsByWasted, getEmissionFactorsByFuel, getFuelConsumptionByType }