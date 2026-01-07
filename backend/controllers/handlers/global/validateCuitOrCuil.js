function validateCuitOrCuil(cuit) {
    cuit = cuit.replace(/[-_]/g, '')

    //debe tener 11 dígitos
    if (!/^\d{11}$/.test(cuit)) return false

    const digits = cuit.split('').map(Number)
    const factors = [5,4,3,2,7,6,5,4,3,2]
    const sum = digits.slice(0,10).reduce((acc,val, i) => acc + val * factors[i],0)

    const resto = sum % 11
    let verifiedDigit = 11 - resto

    if(verifiedDigit === 11) verifiedDigit = 0
    if(verifiedDigit === 10) verifiedDigit = 9 //regla CUIT/CUIL

    return digits[10] === verifiedDigit
}

module.exports = validateCuitOrCuil