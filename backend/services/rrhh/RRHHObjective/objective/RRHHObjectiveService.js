const RRHHObjective = require('../../../../models/rrhh/objectivesSubSoftware/objective/RRHHObjectiveModel')
const ProgressSnapshot = require('../../../../models/rrhh/objectivesSubSoftware/objective/progress/progressSnapshotModel')
const RRHHObjectiveSnapshotService = require('../RRHHObjectiveSnapshotService')
const { validatePeriod } = require('../utils/handlerDates')
const Checklist = require('../../../../models/rrhh/objectivesSubSoftware/objective/checklist/checklistModel')
const Classification = require('../../../../models/rrhh/objectivesSubSoftware/classificationObjectiveModel')
const mongoose = require('mongoose')

const RRHHObjectiveService = {
    createObjective: async function (data, user, enterpriseId) {
        try {
            //1️⃣ clasificación
            const classification = data.classification
            const existsClassification = await Classification.findOne({ name: classification })
            if (!existsClassification) return { error: 'No se encuentra la clasificación.', code: 404 }
            
            const checklist = data.checklist
            
            console.log('Cómo llega el checklist al service', checklist)

            const dataObjective = { ...data, enterpriseId: enterpriseId, createdBy: user._id, classification: existsClassification._id, checklist: [] }

            const newRRHHObjective = await RRHHObjective.create(dataObjective)
           
            if(checklist && checklist.length > 0){
                const taskToCreate = checklist.map(t => ({...t, objectiveId: newRRHHObjective._id,enterpriseId}))
                await Checklist.insertMany(taskToCreate)
                //agregamos las tareas creadas al objetivo para popular el campo checklist del objetivo
                const createdTasks = await Checklist.find({ objectiveId: newRRHHObjective._id })
                newRRHHObjective.checklist = createdTasks.map(t => t._id)
            }

            //calculamos el progreso
            if (checklist) {
                const tasks = checklist.length
                const tasksCompleted = checklist.filter(t => t.completed).length
                const progress = (tasksCompleted / tasks) * 100 || 0
                newRRHHObjective.progress = progress
            }
            newRRHHObjective.save()
            return newRRHHObjective
        } catch (error) {
            console.error(error);
            return { error: `Ha ocurrido un error de servidor: ${error.message}`, code: 500 }
        }
    },
    getObjective: async function (objectiveId, enterpriseId) {
        try {
            if (!objectiveId) return { error: 'No se ha especificado un ID de objetivo', code: 404 }
            const objective = await RRHHObjective.findOne({ _id: objectiveId, enterpriseId: enterpriseId })
            if (!objective) return { error: 'No se ha encontrado el objetivo.', code: 404 }
            return objective
        } catch (error) {
            return { error: 'Ha ocurrido un error de servidor.', code: 500 }
        }
    },
    getAllObjectives: async function (enterpriseId) {
        try {
            const allObjectives = await RRHHObjective.find({ enterpriseId: enterpriseId })
            if (!allObjectives || allObjectives.length === 0) return { error: 'No se han encontrado objetivos de RRHH de la empresa.', code: 404 }
            return allObjectives
        } catch (error) {
            return { error: 'Ha ocurrido un error de servidor.', error: 500 }
        }
    },
    updateObjective: async function (objectiveId, data, enterpriseId) {
        try {
            if (!objectiveId) return { error: 'No se ha especificado un ID de objetivo', code: 404 }
            let updatedObjective = await RRHHObjective.findOneAndUpdate({ _id: objectiveId, enterpriseId: enterpriseId }, { ...data }, { new: true })
            if (!updatedObjective) return { error: 'No se ha encontrado el objetivo.', code: 404 }

            const healthResult = await healthEngine(updatedObjective)
            if (healthResult.error) { return { error: 'Ocurrió un error al calcular la salud del objetivo post actualizarlo.', code: 500 } }

            updatedObjective.status = healthResult.status
            updatedObjective.health = healthResult.health
            updatedObjective.metrics.progress.score = healthResult.score
            updatedObjective.metrics.progress.taskProgress = healthResult.taskProgress

            await updatedObjective.save()

            if (data?.operative?.plannedEnd) {
                await RRHHObjectiveTask.updateMany(
                    {
                        objectiveId, dueDate: { $gt: data.operative.plannedEnd }
                    },
                    {
                        $set: { dueDate: data.operative.plannedEnd }
                    }
                )
            }

            const snapshot = await RRHHObjectiveSnapshotService.createSnapshot(updatedObjective, enterpriseId, 'UPDATE')
            await snapshot.save()
            updatedObjective.snapshots.push(snapshot._id)
            return updatedObjective
        } catch (error) {
            return { error: 'Ha ocurrido un error de servidor.', code: 500 }
        }
    },
    deleteObjective: async function (objectiveId, enterpriseId) {
        try {
            if (!objectiveId) return { error: 'No se especificó un ID de objetivo', code: 404 }
            const deletedObjective = await RRHHObjective.findOneAndDelete({ enterpriseId: enterpriseId, _id: objectiveId })
            if (!deletedObjective) return { error: 'No se ha encontrado el objetivo.', code: 404 }
            const deleteSnapshotsOfObjective = await RRHHObjectiveSnapshotService.deleteAllSnapshots(objectiveId, enterpriseId)
            return { deletedObjective, deleteSnapshotsOfObjective }
        } catch (error) {
            return { error: 'Ha ocurrido un error de servidor.', code: 500 }
        }
    },
    deleteAllObjectives: async function (enterpriseId) {
        try {
            const deletedAllObjectives = await RRHHObjective.deleteMany({ enterpriseId })
            if (!deletedAllObjectives || deletedAllObjectives.length === 0) return { error: 'No se han encontrado objetivos.', code: 404 }
            return deletedAllObjectives
        } catch (error) {
            return { error: 'Ha ocurrido un error de servidor.', code: 500 }
        }
    },
    getGeneralObjectivesByCurrentPeriod: async function (enterpriseId, currentPeriod) {
        try {
            const periodValid = validatePeriod(currentPeriod)
            const objectives = await RRHHObjective.find({ enterpriseId, createdAt: { $gte: periodValid.startDate, $lte: periodValid.endDate } })
            if (!objectives || objectives.length === 0) return { error: 'No se han encontrado objetivos en el periodo especificado', code: 404 }
            return objectives
        } catch (error) {
            return { error: `Ha ocurrido un error de servidor: ${error.message}`, code: 500 }
        }
    },
    getObjectivesByStatus: async function (enterpriseId, status) {
        try {
            const objectives = await RRHHObjective.find({ enterpriseId, status: status })
            if (!objectives || objectives.length === 0) return { error: 'No se han encontrado objetivos.', code: 404 }
            return objectives
        } catch (error) {
            return { error: `Ha ocurrido un error de servidor: ${error.message}`, code: 500 }
        }
    },
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    */
    //SERVICIOS PARA EL DASHBOARD 
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    //SERVICIOS PARA EL DASHBOARD
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    /*----------------------------------------------------------------------------------------------
    */
    getLastObjective: async function (enterpriseId) {
        try {
            const objective = await RRHHObjective.findOne({ enterpriseId: enterpriseId }).sort({ createdAt: -1 })
            if (!objective) return { error: 'No hay objetivos RRHH agregados aún.', code: 404 }
            return objective
        } catch (error) {
            return { error: `Ha ocurrido un error de servidor: ${error.message}.`, code: 500 }
        }
    },
    getLastObjectiveByOwner: async function (enterpriseId, ownerType, ownerId) {
        try {
            const objective = await RRHHObjective.findOne({ enterpriseId, 'owner.ownerType': ownerType, 'owner.ownerId': ownerId }).sort({ createdAt: -1 })
            if (!objective) return { error: 'No se ha encontrado ningún objetivo del responsable seleccionado.' }
            return objective
        } catch (error) {
            return { error: `Ha ocurrido un error de servidor: ${error.message}.`, code: 500 }
        }
    },
    getObjectivesByPriority: async function (enterpriseId, priority) {
        try {
            const objective = await RRHHObjective.find({ enterpriseId, priority })
            if (!objective) return { error: 'No se ha encontrado el objetivo RRHH filtrado por prioridad. Vuelva a intentarlo.', code: 404 }
            return objective
        } catch (error) {
            return { error: `Ha ocurrido un error de servidor: ${error.message}.`, code: 500 }
        }
    },
    getObjectivesByClassification: async function (enterpriseId, classification) {
        try {
            const objective = await RRHHObjective.find({ enterpriseId, classification })
            if (!objective) return { error: 'No se ha encontrado el objetivo RRHH filtrado por clasificación. Vuelva a intentarlo.', code: 404 }
            return objective
        } catch (error) {
            return { error: `Ha ocurrido un error de servidor: ${error.message}.`, code: 500 }
        }
    },
    startObjective: async function (enterpriseId, objectiveId) {
        try {
            const startObjective = await RRHHObjective.findOneAndUpdate({ enterpriseId, _id: objectiveId, status: { $in: ['DRAFT', 'PLANNED'] } }, { status: 'IN_PROGRESS', dateStart: new Date() }, { new: true })
            if (!startObjective) return { error: 'No se ha encontrado el objetivo o no puede setearse su inicio.', code: 404 }
            const snapshot = await RRHHObjectiveSnapshotService.createSnapshot(startObjective, enterpriseId, reason = 'STARTED')
            return { startObjective, snapshot }
        } catch (error) {
            return { error: `Ha ocurrido un error de servidor: ${error.message}.`, code: 500 }
        }
    },
    printDashboardObjectives: async function (enterpriseId) {
        try {
            const result = await RRHHObjective.aggregate([
                { $match: { enterpriseId: new mongoose.Types.ObjectId(enterpriseId) } },
                {
                    $lookup: {
                        from: 'checklists',
                        localField: '_id',
                        foreignField: 'objectiveId',
                        as: 'tasks'
                    }
                },
                //Métricas por objetivo
                {
                    $addFields: {
                        totalTasks: { $size: '$tasks' },
                        completedTasks: {
                            $size: {
                                $filter: {
                                    input: '$tasks',
                                    as: 'task',
                                    cond: { $eq: ['$$task.completed', true] }
                                }
                            }
                        }
                    }
                },
                //Progreso individual
                {
                    $addFields: {
                        progressPerObjective: {
                            $cond: [
                                { $eq: ['$totalTasks', 0] },
                                0,
                                {
                                    $round: [
                                        {
                                            $multiply: [
                                                { $divide: ['$completedTasks', '$totalTasks'] }, 100
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                },
                {
                    $facet: {
                        metrics: [
                            {
                                $group: {
                                    _id: null,
                                    totalObjectives: { $sum: 1 },
                                    active: {
                                        $sum: {
                                            $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0]
                                        }
                                    },
                                    warning: {
                                        $sum: {
                                            $cond: [{ $eq: ['$status', 'WARNING'] }, 1, 0]
                                        }
                                    },
                                    completed: {
                                        $sum: {
                                            $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0]
                                        }
                                    },
                                    totalTasks: { $sum: '$totalTasks' },
                                    totalCompleted: { $sum: '$completedTasks' },
                                    objectives: { $push: '$$ROOT' }
                                }
                            },
                            {
                                $addFields: {
                                    efectiveness: {
                                        $cond: [
                                            { $eq: ['$totalTasks', 0] },
                                            0,
                                            {
                                                $round: [
                                                    {
                                                        $multiply: [
                                                            { $divide: ['$totalCompleted', '$totalTasks'] }, 100
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                }
                            }
                        ],
                        composition: [
                            {
                                $group: {
                                    _id: '$status',
                                    count: { $sum: 1 }
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    status: '$_id',
                                    count: 1
                                }
                            }
                        ],
                        objectives: [
                            { $project: { tasks: 0 } }
                        ],
                        classificationStats: [
                            {
                                $group: {
                                    _id: '$classification',
                                    count: { $sum: 1 },
                                    avgProgress: { $avg: '$progress' },
                                }
                            },
                            {
                                $lookup: {
                                    from: 'classifications',
                                    foreignField: '_id',
                                    localField: '_id',
                                    as: 'classificationData'
                                }
                            },
                            {
                                $unwind: { path: "$classificationData", preserveNullAndEmptyArrays: true }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    classificationId: '$_id',
                                    name: { $ifNull: ['$classificationData.name', 'Sin clasificación'] },
                                    value: '$count',
                                    avgProgress: { $round: [{ $ifNull: ['$avgProgress', 0] }, 1] }
                                }
                            },
                            {
                                $sort: {
                                    value: -1
                                }
                            }
                        ]
                    }
                },
            ])
            const resultadoDOS = await RRHHObjective.find(
                { classification: new mongoose.Types.ObjectId('69a4eb56fabaa63477dd3b66') },
                { title: 1, progress: 1 }
            )
            //primero, fechas
            const now = new Date()
            const firstDateMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            firstDateMonth.setUTCHours(0, 0, 0, 0)
            const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            endMonth.setUTCHours(23, 59, 59, 999)
            const snapshotsAccomplished = await ProgressSnapshot.find({ enterpriseId: enterpriseId, date: { $gte: firstDateMonth, $lte: endMonth } }).sort({ date: 1 }).lean()
            //obtenemos las fechas, es decir -> categorías
            const categories = snapshotsAccomplished.map(s => s.date.toISOString().split('T')[0])
            //ordenamos las series
            const activesSeries = snapshotsAccomplished.map(s => s.metrics.active)
            const warningSeries = snapshotsAccomplished.map(s => s.metrics.warning)
            const plannedSeries = snapshotsAccomplished.map(s => s.metrics.planned)
            const overallProgress = snapshotsAccomplished.map(s => Number(s.overallProgress.toFixed(2)))
            //------------------------------------------
            //traemos los datos del último objetivo AGREGADO
            const lastObjectiveAggregated = await RRHHObjective.findOne().sort({ createdAt: -1 }).populate("checklist").lean()
            //ahora, los últimos SIETE snapshots
            let lastSevenSnapshots
            if (lastObjectiveAggregated) {
                lastSevenSnapshots = await RRHHObjectiveSnapshotService.getSnapshotsByObjective(lastObjectiveAggregated._id, enterpriseId, 7)
            }
            const actualProgress = {
                value: overallProgress[overallProgress.length - 1],
                color: overallProgress[overallProgress.length - 1] <= 50 ? '#ff0000' : overallProgress[overallProgress.length - 1] < 60 && overallProgress[overallProgress.length - 1] >= 50 ? '#905600' : overallProgress[overallProgress.length - 1] <= 75 && overallProgress[overallProgress.length - 1] >= 60 ? '#7f7418' : overallProgress[overallProgress.length - 1] <= 75 && overallProgress[overallProgress.length - 1] >= 75 && overallProgress[overallProgress.length - 1] <= 85 ? '#608444' : '#258332',
            }
            //creamos el lineChart
            const evolutionStatusObjectives = {
                categories,
                series: [
                    { name: 'Activos', data: activesSeries },
                    { name: 'Advertencia', data: warningSeries },
                    { name: 'Planeados', data: plannedSeries }
                ]
            }
            const evolutionOverallProgress = {
                series: [
                    {
                        name: 'Progreso general',
                        data: snapshotsAccomplished.map((s) => ({
                            x: new Date(s.date).toISOString().split('T')[0],
                            y: Number(s.overallProgress).toFixed(1)
                        }))
                    }

                ],
                xaxis: {
                    type: 'datetime'
                }
            }
            //el gráfico treemap
            const treemap = {
                series: [{
                    data: result[0].classificationStats.map((c) => ({
                        x: c.name,
                        y: c.value,
                        avgProgress: c.avgProgress
                    }))
                }]
            }
            console.log("Che, el treemap series", treemap)
            let lastObjectiveOrquest
            if (lastObjectiveAggregated) {
                lastObjectiveOrquest = {
                    evolutionLastObjectiveAggregated: {
                        series: [
                            {
                                name: `Progreso en la fecha`,
                                data: lastSevenSnapshots.length > 0 ? lastSevenSnapshots.map(s => ({
                                    x: new Date(s.createdAt).toISOString().split('T')[0],
                                    y: Number(s.progress).toFixed(1)
                                })) : []
                            }
                        ]
                    },
                    color: lastObjectiveAggregated.progress < 50 ? 'red' : lastObjectiveAggregated.progress > 50 && lastObjectiveAggregated.progress <= 60 ? '#aa6600' : lastObjectiveAggregated.progress <= 75 && lastObjectiveAggregated.progress >= 60 ? '#7f7418' : lastObjectiveAggregated.progress <= 75 && lastObjectiveAggregated.progress >= 75 && lastObjectiveAggregated.progress <= 85 ? '#608444' : '#258332',
                    //valor actual
                    actualProgressLastObjectiveAggregated: lastObjectiveAggregated.progress
                }

            }
            return {
                metrics: result[0].metrics,
                composition: result[0].composition || [],
                objectives: result[0].objectives || [],
                evolutionStatusObjectives,
                overallProgress: {
                    evolutionOverallProgress,
                    actualProgress: actualProgress
                },
                lastObjective: lastObjectiveAggregated ? {
                    evolutionLastObjectiveAggregated: lastObjectiveOrquest.evolutionLastObjectiveAggregated || [], actualProgress: lastObjectiveOrquest.actualProgressLastObjectiveAggregated || null,
                    color: lastObjectiveOrquest.color || undefined
                } : {},
                lastObjectiveInfo: lastObjectiveAggregated || {},
                mostUsedClassifications: treemap || []
            }
        } catch (error) {
            console.error(error)
            return { error: `Ha ocurrido un error de servidor: ${error.message}.`, code: 500 }
        }
    }
}

module.exports = RRHHObjectiveService