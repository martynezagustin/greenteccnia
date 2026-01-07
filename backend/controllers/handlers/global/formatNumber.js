function formatNumberToARS(num) {
    if (typeof num !== 'number') num = Number(num)
    return num.toLocaleString('es-AR')
}

module.exports = formatNumberToARS