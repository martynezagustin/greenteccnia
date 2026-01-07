const getFactor = (providedFactor, defaultFactor) => {
    return isNaN(providedFactor) ? defaultFactor : providedFactor
}
const setEmissions = (source, defaultFactor) => {
    if (!source) return 0
    const factor = getFactor(source.factor, defaultFactor)
    return source.value * factor
}

module.exports = {getFactor,setEmissions}