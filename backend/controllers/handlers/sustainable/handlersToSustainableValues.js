function setFrequenciesToSustainableValues(value, frequency) {
    const conversionRates = {
        horas: 1 / 24,
        días: 1,
        mes: 30,
        años: 365
    }
    return value * (conversionRates[frequency] || 1)
}

module.exports = setFrequenciesToSustainableValues