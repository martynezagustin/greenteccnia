const Finance = require("../../models/finances/financeModel")
const Enterprise = require("../../models/enterpriseModel")

//funcion adds to cash flow
async function addItemToCashFlow(req, res, elements, event, details) {
    try {
        const { concept, date, amount } = req.body
        const { enterpriseId } = req.params
        const enterprise = await Enterprise.findById(enterpriseId)
        if (!enterprise) {
            return res.status(404).json({ message: "No se ha encontrado la empresa." })
        }
        let financeEnterprise = await Finance.findOne({ enterpriseId })
        if (!financeEnterprise) {
            financeEnterprise = new Finance({ enterpriseId: enterprise._id, elements: [] })
        }
        financeEnterprise[elements].push({ concept: concept, date: date, amount: amount })
        financeEnterprise.logsData.push(({ event: event, details: details }))
        calculateCashFlow(financeEnterprise)
        await saveData(financeEnterprise, enterprise)
        res.json(financeEnterprise)
    } catch (error) {
        return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
    }
}
//eliminar elemento del flujo de caja 
async function deleteItemToCashFlow(req, res, elements, event, details) {
    const { enterpriseId, elementId } = req.params
    const enterprise = await Enterprise.findById(enterpriseId)
    if (!enterprise) {
        return res.status(404).json({ message: "No se ha encontrado la empresa." })
    }
    const financeEnterprise = await Finance.findOne({ enterpriseId })
    if (!financeEnterprise) {
        return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
    }
    const element = financeEnterprise[elements].id(elementId)
    if (!element) {
        return res.status(404).json({ message: "No se ha encontrado el item." })
    }

    if (elements === "incomes") {
        financeEnterprise.incomes.pull(elementId)
    } else if (elements === "expenses") {
        financeEnterprise.expenses.pull(elementId)
    }
    financeEnterprise.logsData.push({ event: event, details: details })

    await saveData(financeEnterprise, enterprise)
    res.json({ message: "Eliminado exitosamente." })
}
//actualizar un item del flujo de caja
async function updateItemToCashFlow(req, res, elements, event, details) {
    try {
        const { concept, date, amount } = req.body
        const { enterpriseId, elementId } = req.params
        const enterprise = await Enterprise.findById(enterpriseId)
        if (!enterprise) {
            return res.status(404).json({ message: "No se ha encontrado la empresa" })
        }
        let financeEnterprise = await Finance.findOne({ enterpriseId })
        if (!financeEnterprise) {
            return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
        }
        const element = financeEnterprise[elements].find((element) => element._id.toString() === elementId)

        if (!element) {
            return res.status(404).json({ message: "No se ha encontrado el item." })
        }
        const updateData = {};

        if (concept) updateData[`${elements}.$.concept`] = concept;
        if (date) updateData[`${elements}.$.date`] = date;
        if (amount) updateData[`${elements}.$.amount`] = amount;

        //actualizar activo o pasivo
        const updatedItemToCashFlow = await Finance.findOneAndUpdate(
            { enterpriseId, [`${elements}._id`]: elementId },
            { $set: updateData },
            { new: true }
        )
        if (!updatedItemToCashFlow) {
            return res.status(404).json({ message: "No se ha podido actualizar el item." })
        }
        financeEnterprise = await Finance.findOne({ enterpriseId })
        const newCashFlow = calculateCashFlow(financeEnterprise)
        financeEnterprise.cashFlow.cashFlow = newCashFlow
        console.log(financeEnterprise.cashFlow);

        //guardar el log
        financeEnterprise.logsData.push({ event: event, details: details })

        await saveData(financeEnterprise, enterprise)
        const updatedItem = updatedItemToCashFlow[elements].find(el => el._id.toString() === elementId)
        res.json(updatedItem)
    } catch (error) {

    }
}
//handle para manejar proyecciones de flujo de caja
async function calculateProjectedCashFlowOrNetWorth(res, startDate, endDate, positiveValues, negativeValues, averageNumber, financeEnterprise, period, cashFlowOrNetWorth) {
    const typePeriod = period
    const filteredPositiveValues = financeEnterprise[positiveValues].filter((element) => {
        const elementDate = new Date(element.date)
        return elementDate >= startDate && elementDate <= endDate 
    })
    const filteredNegativeValues = financeEnterprise[negativeValues].filter((element) => {
        const elementDate = new Date(element.date)
        return elementDate >= startDate && elementDate <= endDate
    })
    console.log(filteredNegativeValues, filteredPositiveValues)
    const totalPositiveValues = filteredPositiveValues.reduce((acc, currentValue) => acc + currentValue.amount, 0)
    const totalNegativeValues = filteredNegativeValues.reduce((acc, currentValue) => acc + currentValue.amount, 0)

    const averagePositiveValues = totalPositiveValues / averageNumber
    const averageNegativeValues = totalNegativeValues / averageNumber
    const projectedCashFlowOrNetWorth = averagePositiveValues - averageNegativeValues
    return res.json({ message: `$${projectedCashFlowOrNetWorth.toFixed(2)}` })
}
//funtion adds to net worth
async function addItemToNetWorth(req, res, elements, event, detailsEvent, ...enumTypes) {
    try {
        const { typeAccount, date, amount, details, provider } = req.body
        const { enterpriseId } = req.params
        const enterprise = await Enterprise.findById(enterpriseId)
        const currentDate = new Date()
        const currentMonth = currentDate.getMonth()
        const currentYear = currentDate.getFullYear()
        if (!enterprise) {
            return res.status(404).json({ message: "No se ha encontrado la empresa." })
        }
        let financeEnterprise = await Finance.findOne({ enterpriseId })
        if (!financeEnterprise) {
            financeEnterprise = new Finance({ enterpriseId: enterprise._id, elements: [] })
        }
        const elementExists = await financeEnterprise[elements].find((element) => {
            const elementDate = new Date(element.date)
            return element.amount && element.details == details && element.typeAccount == typeAccount && elementDate.getMonth() === currentMonth && elementDate.getFullYear() === currentYear
        })
        console.log(elementExists);

        if (elementExists) {
            return res.status(400).json({ message: "Ya existe un elemento del patrimonio con iguales características como tipo de cuenta, monto, detalles, y concurrencia del mes. Puedes actualizar el elemento '" + elementExists.details + "' para no sobreescribir la información." })
        }
        const validTypes = []
        validTypes.push(...enumTypes)
        if (!validTypes.includes(typeAccount)) {
            return res.status(404).json({ message: "El campo ingresado como tipo de cuenta no es disponible." })
        }
        financeEnterprise.logsData.push({event: event, details: detailsEvent})
        financeEnterprise[elements].push({ typeAccount: typeAccount, date: date, amount: amount, details: details, provider: provider })
        saveData(financeEnterprise, enterprise)
        calculateNetWorth(financeEnterprise)
        res.json(financeEnterprise)
    } catch (error) {
        return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
    }
}
//borrar item del patrimonio neto
async function deleteItemToNetWorth(req, res, elements, event, details) {
    try {
        const { enterpriseId, elementId } = req.params
        const enterprise = await Enterprise.findById(enterpriseId)
        if (!enterprise) {
            return res.status(404).json({ message: "No se ha encontrado la empresa." })
        }
        const financeEnterprise = await Finance.findOne({ enterpriseId })
        if (!financeEnterprise) {
            return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
        }
        const element = financeEnterprise[elements].id(elementId)
        if (!element) {
            return res.status(404).json({ message: "No se ha encontrado el item." })
        }
        if (elements === "actives") {
            financeEnterprise.actives.pull(elementId)
        } else if (elements === "liabilities") {
            financeEnterprise.liabilities.pull(elementId)
        } else {
            return res.status(400).json({ message: "No se ingresó un parámetro correspondiente." })
        }
        financeEnterprise.logsData.push({ event: event, details: details })

        saveData(financeEnterprise, enterprise)
        return res.json({ message: "Eliminado exitosamente." })
    } catch (error) {
        return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
    }
}
//actualizar item del patrimonio neto
async function updateItemToNetWorth(req, res, elements, event, details, ...enumTypes) {
    try {
        const { typeAccount, date, amount, details, provider } = req.body
        const { enterpriseId, elementId } = req.params
        const enterprise = await Enterprise.findById(enterpriseId)
        if (!enterprise) {
            return res.status(404).json({ message: "No se ha encontrado la empresa" })
        }
        let financeEnterprise = await Finance.findOne({ enterpriseId })
        if (!financeEnterprise) {
            return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
        }
        const element = financeEnterprise[elements].find((element) => element._id.toString() === elementId)

        if (!element) {
            return res.status(404).json({ message: "No se ha encontrado el item." })
        }
        const validTypes = [...enumTypes]
        if (!validTypes.includes(typeAccount)) {
            return res.status(400).json({ message: "El campo ingresado como tipo de cuenta no es disponible." })
        }

        const updateData = {};

        if (typeAccount) updateData[`${elements}.$.typeAccount`] = typeAccount;
        if (date) updateData[`${elements}.$.date`] = date;
        if (amount) updateData[`${elements}.$.amount`] = amount;
        if (details) updateData[`${elements}.$.details`] = details;
        if (provider) updateData[`${elements}.$.provider`] = provider;

        //actualizar activo o pasivo
        const updatedItemToNetWorth = await Finance.findOneAndUpdate(
            { enterpriseId, [`${elements}._id`]: elementId },
            { $set: updateData },
            { new: true }
        )
        if (!updatedItemToNetWorth) {
            return res.status(404).json({ message: "No se ha podido actualizar el item." })
        }
        financeEnterprise = await Finance.findOne({ enterpriseId })
        const newNetWorth = calculateNetWorth(financeEnterprise)
        financeEnterprise.netWorth.netWorth = newNetWorth
        console.log(financeEnterprise.netWorth);

        //guardar el log
        financeEnterprise.logsData.push({ event: event, details: details })

        await saveData(financeEnterprise, enterprise)
        const updatedItem = updatedItemToNetWorth[elements].find(el => el._id.toString() === elementId)
        res.json({ updatedItem, nw: financeEnterprise.netWorth })

    }
    catch (error) {
        return res.status(500).json({ error: "Ha ocurrido un error: " + error })
    }
}
//calcular patrimonio neto
function calculateNetWorth(finance) {
    finance.netWorth.totalActives = finance.actives.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)
    console.log(finance.netWorth.totalActives);

    finance.netWorth.totalLiabilities = finance.liabilities.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)
    finance.netWorth.netWorth = finance.netWorth.totalActives - finance.netWorth.totalLiabilities
    console.log(finance.netWorth.netWorth)
}
//calcular flujo de caja
function calculateCashFlow(finance) {
    finance.cashFlow.totalIncomes = finance.incomes.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)
    finance.cashFlow.totalExpenses = finance.expenses.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)
    finance.cashFlow.cashFlow = finance.cashFlow.totalIncomes - finance.cashFlow.totalExpenses
}
//calcular valores netos del mes corriente
function calculateNetValuesByCurrentMonth(finance, currentMonth, currentYear, positiveValues, negativeValues) {
    const filteredPositiveValues = finance[positiveValues].filter((positive) => {
        const positiveDate = new Date(positive.date)
        return positiveDate.getMonth() === currentMonth && positiveDate.getFullYear() === currentYear
    })
    const filteredNegativeValues = finance[negativeValues].filter((negative) => {
        const negativeDate = new Date(negative.date)
        return negativeDate.getMonth() === currentMonth && negativeDate.getFullYear() === currentYear
    })
    const totalPositiveValuesFiltered = filteredPositiveValues.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)
    const totalNegativeValuesFiltered = filteredNegativeValues.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)
    const getNetValuesByCurrentMonth = totalPositiveValuesFiltered - totalNegativeValuesFiltered
    return getNetValuesByCurrentMonth
}
//calcular valores netos del dia corriente
function calculateNetValuesByCurrentDate(finance, currentDate, currentMonth, currentYear, positiveValues, negativeValues) {
    const filteredPositiveValues = finance[positiveValues].filter((positive) => {
        const positiveDate = new Date(positive.date)
        return positiveDate.getUTCDate() === currentDate && positiveDate.getMonth() === currentMonth && positiveDate.getFullYear() === currentYear
    })
    const filteredNegativeValues = finance[negativeValues].filter((negative) => {
        const negativeDate = new Date(negative.date)
        return negativeDate.getUTCDate() === currentDate && negativeDate.getMonth() === currentMonth && negativeDate.getFullYear() === currentYear
    })
    console.log(currentDate)
    const totalPositiveValuesFiltered = filteredPositiveValues.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)
    const totalNegativeValuesFiltered = filteredNegativeValues.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)
    const getNetValuesByCurrentDate = totalPositiveValuesFiltered - totalNegativeValuesFiltered
    return getNetValuesByCurrentDate
}
//calcular valores netos del year corriente
function calculateNetValuesByCurrentYear(finance, currentYear, positiveValues, negativeValues) {
    const filteredPositiveValues = finance[positiveValues].filter((positive) => {
        const positiveDate = new Date(positive.date)
        console.log(positiveDate);
        return positiveDate.getFullYear() === currentYear
    })
    const filteredNegativeValues = finance[negativeValues].filter((negative) => {
        const negativeDate = new Date(negative.date)
        return negativeDate.getFullYear() === currentYear
    })
    const totalPositiveValuesFiltered = filteredPositiveValues.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)
    const totalNegativeValuesFiltered = filteredNegativeValues.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)
    const getNetValuesByCurrentYear = totalPositiveValuesFiltered - totalNegativeValuesFiltered
    return getNetValuesByCurrentYear
}
//para meses
function getOptionsForMonth(month) {
    const options = {
        "Enero": 0,
        "Febrero": 1,
        "Marzo": 2,
        "Abril": 3,
        "Mayo": 4,
        "Junio": 5,
        "Julio": 6,
        "Agosto": 7,
        "Septiembre": 8,
        "Octubre": 9,
        "Noviembre": 10,
        "Diciembre": 11
    }
    const selectedOption = options[month]
    return selectedOption
}
//guardar data
async function saveData(financeEnterprise, enterprise) {
    enterprise.finances = financeEnterprise._id
    await financeEnterprise.save()
    await enterprise.save()
}

module.exports = { addItemToCashFlow, deleteItemToCashFlow, updateItemToCashFlow, calculateProjectedCashFlowOrNetWorth, addItemToNetWorth, deleteItemToNetWorth, updateItemToNetWorth, calculateNetWorth, calculateCashFlow, calculateNetValuesByCurrentMonth, calculateNetValuesByCurrentDate, calculateNetValuesByCurrentYear, getOptionsForMonth, saveData }