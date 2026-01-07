const emissionFactors = {
    paperUsage: 2.0,
    wasteGenerated: {
        "Vertederos": 2.5,
        "Incineración": 1.5,
        "Reciclaje": 0.2
    },
    otherEmissionsCO2: {
        Energía: 0.5,
        Maquinaria: 2.0,
        Residuos: 1.8
    },
    internalTransport: {
        "Nafta": 8.0,
        "Diesel": 5.0,
        "Gas Natural Comprimido": 3.5,
        "Eléctrico": 0.0,
        "No aplica": 0.0
    },
    emissionFactorsFuel: {
        "Nafta": 2.31,
        "Diesel": 2.68,
        "Gas Natural Comprimido": 2.2,
        "Eléctrico": 0.12
    },
    chemicalUsage: {
        "Detergentes": 1.1,
        "Pinturas": 2.0,
        "Solventes": 2.5,
        "Otros": 1.0
    }
}


module.exports = emissionFactors