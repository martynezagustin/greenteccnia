const Finance = require("../../models/finances/financeModel")
const Enterprise = require("../../models/enterpriseModel")
const assignAction = require("../handlers/members/assignAction")
const mongoose = require("mongoose")

//funcion adds to cash flow
async function addItemToCashFlow(req, res, elements, event, details) {
    try {
        const { concept, date, category, amount, paymentMethod } = req.body
        console.log(req.body)
        const { enterpriseId } = req.params
        const enterprise = await Enterprise.findById(enterpriseId)
        if (!enterprise) {
            return res.status(404).json({ message: "No se ha encontrado la empresa." })
        }
        let financeEnterprise = await Finance.findOne({ enterpriseId })
        if (!financeEnterprise) {
            financeEnterprise = new Finance({ enterpriseId: enterprise._id, elements: [] })
        }
        const validTypesPaymentMethod = ["Efectivo",
            "Transferencia bancaria",
            "Cheque",
            "Tarjeta de crédito",
            "Tarjeta de débito",
            "Criptomonedas",
            "Otros"]
        if (!validTypesPaymentMethod.includes(paymentMethod)) {
            return res.status(404).json({ message: "El campo ingresado como método de pago no es válido." })
        }
        const createdBy = await assignAction(req, res, enterprise)
        financeEnterprise[elements].push({
            concept: concept, date: date, amount: amount, paymentMethod, category, createdBy: {
                username: createdBy.username,
                position: createdBy.position,
                date: new Date()
            }
        })
        financeEnterprise.logsData.push(({ event: event, details: details }))
        calculateCashFlow(financeEnterprise)
        calculateNetWorth(financeEnterprise)
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
    financeEnterprise[elements].pull(elementId)

    financeEnterprise.logsData.push({ event: event, details: details })
    calculateCashFlow(financeEnterprise)
    await saveData(financeEnterprise, enterprise)
    res.json({ message: "Eliminado exitosamente." })
}
async function deleteAllItemsToCashFlow(req, res, elements, event, details) {
    try {
        const { enterpriseId } = req.params
        const enterprise = await Enterprise.findById(enterpriseId)
        if (!enterprise) {
            return res.statuts(404).json({ message: "No se ha encontrado la empresa." })
        }
        const financeEnterprise = await Finance.findOne({ enterpriseId })
        if (!financeEnterprise) {
            return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
        }
        let deletedAllItems
        if (elements === "incomes") {
            deletedAllItems = await Finance.findOneAndUpdate({
                enterpriseId: enterprise._id
            }, {
                $pull: { incomes: { $in: financeEnterprise.incomes } }
            }, {
                new: true
            })
        } else if (elements === "expenses") {
            deletedAllItems = await Finance.findOneAndUpdate({
                enterpriseId: enterprise._id
            }, {
                $pull: { expenses: { $in: financeEnterprise.expenses } }
            }, {
                new: true
            })
        } else {
            return res.status(404).json({ message: "No se ha ingresado un parámetro correspondiente." })
        }

        financeEnterprise.logsData.push({ event: event, details: details })
        calculateCashFlow(deletedAllItems)
        return res.status(200).json(deletedAllItems)
    } catch (error) {
        return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
    }
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
        const updatedBy = await assignAction(req, res, enterprise)
        const updateData = {};

        if (concept) updateData[`${elements}.$.concept`] = concept;
        if (date) updateData[`${elements}.$.date`] = date;
        if (amount) updateData[`${elements}.$.amount`] = amount;

        updateData[`${elements}.$.updatedBy`] = {
            username: updatedBy.username,
            position: updatedBy.position
        }
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
        calculateCashFlow(financeEnterprise)
        calculateNetWorth(financeEnterprise)
        const updatedItem = updatedItemToCashFlow[elements].find(el => el._id.toString() === elementId)
        res.json(updatedItem)
    } catch (error) {

    }
}
//obtener todos los items
async function getAllItems(req, res, elements) {
    try {
        const { enterpriseId } = req.params
        const enterprise = await Enterprise.findById(enterpriseId)
        if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
        const financeEnterprise = await Finance.findOne({ enterpriseId })
        if (!financeEnterprise) {
            return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
        }
        if (financeEnterprise[elements].length === 0) return res.status(404).json({ message: "No se han encontrado items." })
        res.json(financeEnterprise[elements])
    } catch (error) {
        return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
    }
}
//obtener por composicion de categoria elementos del patrimonio neto
async function getValueItemsByCompositionCategory(req, res, elements) {
    try {
        const { enterpriseId } = req.params
        if (!mongoose.Types.ObjectId.isValid(enterpriseId)) return res.status(404).json({ message: "ID de empresa no válido." })
        const enterprise = await Enterprise.findById(enterpriseId)
        if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
        const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
        if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado un esquema de finanzas de la empresa." })
        const totalElements = financeEnterprise[elements]
        const totals = {}
        if (totalElements.length === 0) return res.status(404).json({ message: "No pueden mostrarse los datos históricos porque nunca se ingresaron items." })
        totalElements.forEach(item => {
            const category = item.category
            totals[category] = (totals[category] || 0) + parseFloat(item.amount)
        })
        const grandTotal = Object.values(totals).reduce((acc, value) => acc + value, 0)
        console.log(grandTotal)
        const composition = Object.entries(totals).map(([category, amount]) => ({
            category,
            amount,
            percentage: parseFloat((amount / grandTotal) * 100).toFixed(2)
        }))
        return res.status(200).json(composition)
    } catch (error) {
        return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
    }
}
//obtener por composicion de metodo de pago
async function getItemsByCompositionPaymentMethod(req, res, elements) {
    try {
        try {
            const { enterpriseId } = req.params
            if (!mongoose.Types.ObjectId.isValid(enterpriseId)) return res.status(404).json({ message: "ID de empresa no válido." })
            const enterprise = await Enterprise.findById(enterpriseId)
            if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
            const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
            if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado un esquema de finanzas de la empresa." })
            const totalElements = financeEnterprise[elements]
            const totals = {}
            if (totalElements.length === 0) return res.status(404).json({ message: "No pueden mostrarse los datos históricos porque nunca se ingresaron items." })
            totalElements.forEach(item => {
                const paymentMethod = item.paymentMethod
                totals[paymentMethod] = (totals[paymentMethod] || 0) + parseFloat(item.amount)
            })
            const grandTotal = Object.values(totals).reduce((acc, value) => acc + value, 0)
            console.log(grandTotal)
            const composition = Object.entries(totals).map(([paymentMethod, amount]) => ({
                paymentMethod,
                amount,
                percentage: parseFloat((amount / grandTotal) * 100).toFixed(2)
            }))
            console.log("Composicion", composition)
            return res.status(200).json(composition)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    } catch (error) {
        return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
    }
}
async function getItemsByCompositionPaymentMethodPerPeriod(req, res, elements, period) {
    try {
        const { enterpriseId } = req.params
        if (!mongoose.Types.ObjectId.isValid(enterpriseId)) return res.status(404).json({ message: "ID de empresa no válido." })
        const enterprise = await Enterprise.findById(enterpriseId)
        if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
        const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
        if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado un esquema de finanzas de la empresa." })
        if (!period) return res.status(400).json({ message: "No has ingresado un periodo." })
        const validTypes = ['diary', 'monthly', 'annual']
        if (!validTypes.includes(period)) return res.status(400).json({ message: "No es válido el período ingresado" })
        let start
        let end
        const now = new Date().toLocaleDateString()
        const [day, month, year] = now.split("/")
        const newDate = new Date(Date.UTC(year, month - 1, day))
        switch (period) {
            case 'monthly':
                start = new Date(newDate.getFullYear(), newDate.getMonth(), 1)
                start.setUTCHours(0, 0, 0, 0)
                end = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0)
                end.setUTCHours(23, 59, 59, 999)
                break;
            case 'diary':
                console.log(newDate)
                start = new Date(newDate)
                start.setUTCHours(0, 0, 0, 0)
                end = new Date(newDate)
                end.setUTCHours(23, 59, 59, 999)
                break;
            case 'annual':
                const currentDate = new Date()
                start = new Date(currentDate.getFullYear(), 0, 1)
                start.setUTCHours(0, 0, 0, 0)
                end = new Date(currentDate.getFullYear(), 11, 31)
                end.setUTCHours(23, 59, 59, 999)
            default:
                break;
        }
        console.log(start, end)
        const totalElements = await Finance.aggregate([
            { $match: { enterpriseId: enterprise._id } },
            { $unwind: `$${elements}` },
            { $match: { [`${elements}.date`]: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: `$${elements}.paymentMethod`,
                    totalAmount: { $sum: { $toDouble: `$${elements}.amount` } },
                }
            },
        ])
        console.log("Suma total", totalElements)
        const totalSum = totalElements.reduce((acc, el) => acc + el.totalAmount, 0)
        if (totalSum === 0) {
            return res.status(404).json({ message: "No pueden mostrarse datos del periodo seleccionado." })
        }
        const composition = totalElements.map(el => ({
            paymentMethod: el._id,
            amount: el.totalAmount,
            percentage: parseFloat((el.totalAmount / totalSum) * 100).toFixed(2)
        }))
        return res.status(200).json(composition)
    } catch (error) {
        return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
    }
}
async function getItemsByCompositionCategoryPerPeriod(req, res, elements, period) {
    try {
        const { enterpriseId } = req.params
        if (!mongoose.Types.ObjectId.isValid(enterpriseId)) return res.status(404).json({ message: "ID de empresa no válido." })
        const enterprise = await Enterprise.findById(enterpriseId)
        if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
        const financeEnterprise = await Finance.findOne({ enterpriseId: enterprise._id })
        if (!financeEnterprise) return res.status(404).json({ message: "No se ha encontrado un esquema de finanzas de la empresa." })
        let start
        let end
        const now = new Date().toLocaleDateString()
        const [day, month, year] = now.split("/")
        const newDate = new Date(Date.UTC(year, month - 1, day))
        switch (period) {
            case 'monthly':
                start = new Date(newDate.getFullYear(), newDate.getMonth(), 1)
                start.setUTCHours(0, 0, 0, 0)
                end = new Date(newDate.getFullYear(), newDate.getMonth(), 31)
                end.setUTCHours(23, 59, 59, 999)
                break;
            case 'diary':
                console.log(newDate)
                start = new Date(newDate)
                start.setUTCHours(0, 0, 0, 0)
                end = new Date(newDate)
                end.setUTCHours(23, 59, 59, 999)
                break;
            case 'annual':
                const currentDate = new Date()
                start = new Date(currentDate.getFullYear(), 0, 1)
                start.setUTCHours(0, 0, 0, 0)
                end = new Date(currentDate.getFullYear(), 11, 31)
                end.setUTCHours(23, 59, 59, 999)
            default:
                break;
        }
        console.log(start, end)
        const totalElements = await Finance.aggregate([
            { $match: { enterpriseId: enterprise._id } },
            { $unwind: `$${elements}` },
            { $match: { [`${elements}.date`]: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: `$${elements}.category`,
                    totalAmount: { $sum: { $toDouble: `$${elements}.amount` } },
                }
            },
        ])
        console.log("Suma total", totalElements)
        const totalSum = totalElements.reduce((acc, el) => acc + el.totalAmount, 0)
        if (totalSum === 0) {
            return res.status(404).json({ message: "No pueden mostrarse datos del periodo seleccionado." })
        }
        const composition = totalElements.map(el => ({
            category: el._id,
            amount: el.totalAmount,
            percentage: parseFloat((el.totalAmount / totalSum) * 100).toFixed(2)
        }))
        return res.status(200).json(composition)
    } catch (error) {
        return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
    }
}
//obtener items por el mes actual
async function getValueItemsByCurrentPeriod(req, res, items, period) {
    try {
        const { enterpriseId } = req.params
        const financeEnterprise = await Finance.findOne({ enterpriseId })
        const enterprise = await Enterprise.findById(enterpriseId)
        if (!enterprise) return res.status(404).json({ messsage: "No se ha encontrado la empresa." })
        if (!financeEnterprise) {
            return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
        }

        const now = new Date()

        let startCurrent
        let endCurrent
        //fechas anteriores
        let startLast
        let endLast
        const validPeriods = ['date', 'month', 'year', 'trimester']
        if (!validPeriods.includes(period)) return res.status(400).json({ message: "El tipo de periodo ingresado no es válido" })
        switch (period) {
            case 'date':
                startCurrent = new Date(now)
                startCurrent.setUTCHours(0, 0, 0, 0)
                endCurrent = new Date(now)
                endCurrent.setUTCHours(23, 59, 59, 999)

                startLast = new Date(startCurrent)
                startLast.setUTCDate(startCurrent.getDate() - 1)

                endLast = new Date(startLast)
                endLast.setUTCHours(23, 59, 59, 999)
                break;
            case 'month':
                startCurrent = new Date(now.getFullYear(), now.getMonth(), 1)
                startCurrent.setUTCHours(0, 0, 0, 0)
                endCurrent = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                endCurrent.setUTCHours(23, 59, 59, 999)
                startLast = new Date(startCurrent.getFullYear(), startCurrent.getMonth() - 1, 1)
                endLast = new Date(endCurrent.getFullYear(), endCurrent.getMonth(), 0)
                break;
            case 'year':
                const actualDate = new Date()
                startCurrent = new Date(actualDate.getFullYear(), 0, 1)
                startCurrent.setUTCHours(0, 0, 0, 0)

                endCurrent = new Date(now.getFullYear(), 11, 31)
                endCurrent.setUTCHours(23, 59, 59, 999)

                startLast = new Date(startCurrent.getFullYear() - 1, 0, 1)
                endLast = new Date(endCurrent.getFullYear() - 1, 11, 31)
                endLast.setUTCHours(23, 59, 59, 999)
                break;
        }

        console.log("Inicio de fecha de periodo", startCurrent)
        console.log("Fin de fecha de periodo", endCurrent)
        const getTotals = async (startCurrent, endCurrent) => {
            const result = await Finance.aggregate([
                { $match: { enterpriseId: enterprise._id } },
                { $unwind: `$${items}` },
                { $match: { [`${items}.date`]: { $gte: startCurrent, $lte: endCurrent } } },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: `$${items}.amount` }
                    }
                }
            ])
            const totalAmount = (result && result.length > 0 && result[0].totalAmount) ? result[0].totalAmount : 0
            return totalAmount
        }
        const itemsByCurrentPeriod = await getTotals(startCurrent, endCurrent)
        console.log("Los items del current periodo?", itemsByCurrentPeriod)
        const itemsByLastPeriod = await getTotals(startLast, endLast)
        let variation = 0
        if (itemsByLastPeriod !== 0) {
            variation = ((itemsByCurrentPeriod - itemsByLastPeriod) / itemsByLastPeriod) * 100
        } else if (itemsByLastPeriod.length > 0) {
            variation = 100
        } else {
            variation = 0
        }

        console.log(variation, itemsByCurrentPeriod, itemsByLastPeriod)
        res.json({ getItemsByCurrentPeriod: itemsByCurrentPeriod, percentage: variation.toFixed(2) })
    } catch (error) {
        return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
    }
}
//obtener los items en si. Sirve para trazar los graphics
async function getItemsByCurrentPeriod(req, res, items, period) {
    try {
        const { enterpriseId } = req.params
        const enterprise = await Enterprise.findById(enterpriseId)
        if (!enterprise) return res.status(404).json({ message: "No se ha encontrado la empresa." })
        const financeEnterprise = await Finance.findOne({ enterpriseId })
        if (!financeEnterprise) {
            return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
        }
        let startCurrent
        let endCurrent
        console.log("Qu periodo?", period)
        const now = new Date()
        switch (period) {
            case 'date':
                startCurrent = new Date(now)
                startCurrent.setUTCHours(0, 0, 0, 0)
                endCurrent = new Date(now)
                endCurrent.setUTCHours(23, 59, 59, 999)
                break;
            case 'month':
                startCurrent = new Date(now.getFullYear(), now.getMonth(), 1)
                startCurrent.setUTCHours(0, 0, 0, 0)
                endCurrent = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                endCurrent.setUTCHours(23, 59, 59, 999)
                break;
            case 'year':
                const actualDate = new Date()
                startCurrent = new Date(actualDate.getFullYear(), 0, 1)
                startCurrent.setUTCHours(0, 0, 0, 0)
                endCurrent = new Date(actualDate.getFullYear(), 11, 31)
                endCurrent.setUTCHours(23, 59, 59, 999)
                break;
        }
        console.log("Inicio en local date", startCurrent)
        const allItems = await Finance.aggregate([
            { $match: { enterpriseId: enterprise._id } },
            { $unwind: `$${items}` },
            { $match: { [`${items}.date`]: { $gte: startCurrent, $lte: endCurrent } } },
            {
                $group: {
                    _id: null,
                    items: { $push: `$${items}` }
                }
            }
        ])
        console.log("los items?", allItems[0]?.items || 0);

        //        if (allItems.length === 0) return res.status(404).json({ message: `No se han encontrado items de ${items === 'actives' ? 'activos' : items === 'liabilities' ? 'pasivos' : items === 'expenses' ? 'egresos' : 'ingresos'}` })
        return res.status(200).json(allItems[0]?.items || 0)
    } catch (error) {
        return res.status(500).json({ error: "Ha ocurrido un error de servidor " + error })
    }
}
//handle para manejar proyecciones de flujo de caja
async function calculateProjectedCashFlowOrNetWorth(req, res, startDate, endDate, positiveValues, negativeValues, averageNumber) {
    const { enterpriseId } = req.params
    const enterprise = await Enterprise.findById(enterpriseId)
    if (!enterprise) {
        return res.status(404).json({ message: "No se ha encontrado la empresa." })
    }
    const financeEnterprise = await Finance.findOne({ enterpriseId })
    if (!financeEnterprise) {
        return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
    }
    const filteredPositiveItemsCurrent = await handleGetItems(enterprise, positiveValues, startDate, endDate)
    const filteredNegativeItemsCurrent = await handleGetItems(enterprise, negativeValues, startDate, endDate)


    const averagePositiveItemsCurrent = filteredPositiveItemsCurrent / averageNumber
    const averageNegativeItemsCurrent = filteredNegativeItemsCurrent / averageNumber
    const projectedCashFlowOrNetWorth = averagePositiveItemsCurrent - averageNegativeItemsCurrent

    //asignar y compara nuevas fechas
    const now = new Date()
    const filteredPositiveItemsLast = await handleGetItems(enterprise, positiveValues, new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 0))
    const filteredNegativeItemsLast = await handleGetItems(enterprise, negativeValues, new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 0))
    const cashFlowLastMonth = filteredPositiveItemsLast - filteredNegativeItemsLast
    console.log(cashFlowLastMonth)
    let variation
    if (cashFlowLastMonth === 0) {
        variation = projectedCashFlowOrNetWorth === 0 ? 0 : 100
    } else {
        variation = ((projectedCashFlowOrNetWorth - cashFlowLastMonth) / Math.abs(cashFlowLastMonth)) * 100
    }
    return res.json({ projectedCashFlowOrNetWorth: projectedCashFlowOrNetWorth.toFixed(2), percentage: variation.toFixed(2) })
}
//funtion adds to net worth
async function addItemToNetWorth(req, res, elements, event, detailsEvent, ...enumTypes) {
    try {
        const { enterpriseId } = req.params
        const { category, typeAccount, date, amount, details, providerId } = req.body
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
        if (elementExists) {
            return res.status(409).json({ message: "Ya existe un elemento del patrimonio con iguales características como tipo de cuenta, monto, detalles, y concurrencia del mes. Puedes actualizar el elemento '" + elementExists.details + "' para no sobreescribir la información." })
        }
        const validTypes = []
        validTypes.push(...enumTypes)
        console.log(validTypes)
        if (!validTypes.includes(category)) {
            return res.status(404).json({ message: "El campo ingresado como tipo de cuenta no es disponible." })
        }
        if (!category || !typeAccount || !date || !amount || !details) {
            return res.status(400).json({ message: "Faltan campos obligatorios. Vuelva a intentarlo." })
        }
        if (elements !== "liabilities" & providerId) {
            return res.status(400).json({ error: "No puedes asociar un proveedor a un activo." })
        }
        const createdBy = await assignAction(req, res, enterprise)
        financeEnterprise[elements].push({
            category: category, typeAccount: typeAccount, date: date ? date : new Date(), amount: amount, details: details, provider: providerId, createdBy: {
                username: createdBy.username,
                position: createdBy.position,
                date: new Date()
            }
        })
        financeEnterprise.logsData.push({ event: event, details: detailsEvent })
        calculateNetWorth(financeEnterprise)
        await saveData(financeEnterprise, enterprise)
        return res.status(200).json({ message: "Has ingresado un nuevo elemento al patrimonio neto." })
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
        calculateNetWorth(financeEnterprise)
        await saveData(financeEnterprise, enterprise)
        return res.json({ message: "Eliminado exitosamente." })
    } catch (error) {
        return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
    }
}
async function deleteAllItemsToNetWorth(req, res, elements, event, details) {
    try {
        const { enterpriseId } = req.params
        const enterprise = await Enterprise.findById(enterpriseId)
        if (!enterprise) {
            return res.status(404).json({ message: "No se ha encontrado la empresa." })
        }
        const financeEnterprise = await Finance.findOne({ enterpriseId })
        if (!financeEnterprise) {
            return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
        }
        let deletedAllElements
        if (elements === "actives") {
            deletedAllElements = await Finance.findOneAndUpdate({
                enterpriseId: enterprise._id,
                _id: financeEnterprise._id
            }, {
                $pull: { actives: { $in: financeEnterprise.actives } }
            }, {
                new: true
            })
        } else if (elements === "liabilities") {
            deletedAllElements = await Finance.findOneAndUpdate({
                enterpriseId: enterprise._id,
                _id: financeEnterprise._id
            }, {
                $pull: { liabilities: { $in: financeEnterprise.liabilities } }
            }, {
                new: true
            })
        } else {
            return res.status(404).json({ message: "No se ha ingresado un parámetro correspondiente." })
        }

        financeEnterprise.logsData.push({ event: event, details: details })
        calculateNetWorth(deletedAllElements)
        calculateCashFlow(deletedAllElements)
        await financeEnterprise.save()
        return res.status(200).json(deletedAllElements)
    } catch (error) {
        return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
    }
}
//actualizar item del patrimonio neto
async function updateItemToNetWorth(req, res, elements, event, details, ...enumTypes) {
    try {
        const { typeAccount, date, amount, details, providerId } = req.body
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
        if (providerId) updateData[`${elements}.$.provider`] = providerId;

        const updatedBy = await assignAction(req, res, enterprise)
        updateData[`${elements}.$.updatedBy`] = {
            username: updatedBy.username,
            position: updatedBy.position,
            date: new Date()
        }
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

        const updatedItem = updatedItemToNetWorth[elements].find(el => el._id.toString() === elementId)
        calculateNetWorth(financeEnterprise)
        await saveData(financeEnterprise, enterprise)
        return res.status(200).json({ updatedItem, nw: financeEnterprise.netWorth })

    }
    catch (error) {
        return res.status(500).json({ error: "Ha ocurrido un error: " + error })
    }
}
//calcular patrimonio neto
function calculateNetWorth(finance) {
    finance.netWorth.totalActives = finance.actives.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)
    finance.netWorth.totalLiabilities = finance.liabilities.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)

    finance.netWorth.netWorth = finance.netWorth.totalActives - finance.netWorth.totalLiabilities


    return finance.netWorth.netWorth

}
//calcular flujo de caja
function calculateCashFlow(finance) {
    finance.cashFlow.totalIncomes = finance.incomes.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)
    finance.cashFlow.totalExpenses = finance.expenses.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)
    finance.cashFlow.cashFlow = finance.cashFlow.totalIncomes - finance.cashFlow.totalExpenses

    return finance.cashFlow.cashFlow
}
//calcular valores netos del mes corriente
function calculateNetValuesByCurrentMonth(finance, currentMonth, currentYear, positiveValues, negativeValues) {
    const filteredPositiveValues = finance[positiveValues].filter((positive) => {
        const positiveDate = new Date(positive.date)
        return positiveDate.getUTCMonth() === currentMonth && positiveDate.getUTCFullYear() === currentYear
    })
    filteredPositiveValues.forEach((positive) => {
        console.log("El dia es correcto? ==>", positive.date)
    })
    const filteredNegativeValues = finance[negativeValues].filter((negative) => {
        const negativeDate = new Date(negative.date)
        return negativeDate.getUTCMonth() === currentMonth && negativeDate.getUTCFullYear() === currentYear
    })
    const totalPositiveValuesFiltered = filteredPositiveValues.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)
    const totalNegativeValuesFiltered = filteredNegativeValues.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)
    const getNetValuesByCurrentMonth = totalPositiveValuesFiltered - totalNegativeValuesFiltered
    return getNetValuesByCurrentMonth
}
//calcular valores netos del dia corriente
async function calculateNetValuesByCurrentDate(finance, enterprise, positiveValues, negativeValues) {
    const start = new Date()
    start.setUTCHours(0, 0, 0, 0)
    const end = new Date()
    end.setUTCHours(23, 59, 59, 999)
    const filteredPositiveItems = await finance.aggregate([
        { $match: { enterpriseId: enterprise._id } },
        { $unwind: `$${positiveValues}` },
        { $match: { [`${positiveValues}.date`]: { $gte: start, $lte: end } } },
        {
            $project: {
                _id: 0,
                enterpriseId: 1,
                amount: `$${positiveValues}.amount`
            }
        },
        {
            $group: {
                _id: "$enterpriseId",
                totalAmount: { $sum: `$amount` }
            }
        }
    ])
    const filteredNegativeItems = await finance.aggregate([
        { $match: { enterpriseId: enterprise._id } },
        { $unwind: `$${negativeValues}` },
        { $match: { [`${negativeValues}.date`]: { $gte: start, $lte: end } } },
        {
            $project: {
                _id: 0,
                enterpriseId: 1,
                amount: `$${negativeValues}.amount`
            }
        },
        {
            $group: {
                _id: "$enterpriseId",
                totalAmount: { $sum: `$amount` }
            }
        }
    ])
    const totalPositiveValuesFiltered = filteredPositiveItems.reduce((accumulator, currentValue) => accumulator + currentValue.totalAmount, 0)
    const totalNegativeValuesFiltered = filteredNegativeItems.reduce((accumulator, currentValue) => accumulator + currentValue.totalAmount, 0)
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
//obtener items de un mes determinado
function getItemsByMonth(financeEnterprise, values) {
    const actualDate = new Date()
    const currentMonth = actualDate.getMonth()
    const currentYear = actualDate.getFullYear()

    const filteredItemsByCurrentMonth = financeEnterprise[values].filter((item) => {
        const itemDate = new Date(item.date)
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear
    })
    return filteredItemsByCurrentMonth
}
//handle items by current month
async function handleGetItems(enterprise, items, start, end) {
    const formatHours = (start, end) => {
        start.setUTCHours(0, 0, 0, 0)
        end.setUTCHours(23, 59, 59, 999)
        return { start, end }
    }


    const format = formatHours(start, end)
    console.log("Start?", start, "End?", end)
    const result = await Finance.aggregate([
        { $match: { enterpriseId: enterprise._id } },
        { $unwind: `$${items}` },
        { $match: { [`${items}.date`]: { $gte: format.start, $lte: format.end } } },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: `$${items}.amount` }
            }
        }
    ])
    const totalAmount = (result && result.length > 0 && result[0].totalAmount) ? result[0].totalAmount : 0
    return totalAmount
}
//obtener o items de cash flow o net worth
async function getTotalItemsByNumberOfCashFlowOrNetWorth(req, res, type, totalItems) {
    try {
        const { enterpriseId } = req.params
        const financeEnterprise = await Finance.findOne({ enterpriseId })
        if (!financeEnterprise) {
            return res.status(404).json({ message: "No se ha encontrado el esquema de finanzas de la empresa." })
        }
        let allTotalItems = financeEnterprise[type][totalItems]
        if (!allTotalItems) {
            allTotalItems = 0
        }
        return res.status(200).json(allTotalItems)
    } catch (error) {
        res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
    }
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

module.exports = { addItemToCashFlow, deleteItemToCashFlow, deleteAllItemsToCashFlow, updateItemToCashFlow, calculateProjectedCashFlowOrNetWorth, addItemToNetWorth, deleteItemToNetWorth, deleteAllItemsToNetWorth, updateItemToNetWorth, calculateNetWorth, calculateCashFlow, calculateNetValuesByCurrentMonth, calculateNetValuesByCurrentDate, calculateNetValuesByCurrentYear, getOptionsForMonth, saveData, getItemsByMonth, getValueItemsByCompositionCategory, getItemsByCompositionCategoryPerPeriod,  getTotalItemsByNumberOfCashFlowOrNetWorth, getAllItems, getItemsByCompositionPaymentMethod, getItemsByCompositionPaymentMethodPerPeriod, getValueItemsByCurrentPeriod, getItemsByCurrentPeriod }