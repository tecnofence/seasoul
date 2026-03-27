import type { FastifyInstance } from 'fastify'

export default async function dashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET /resort/:resortId — Dashboard de um resort ──
  app.get<{ Params: { resortId: string } }>('/resort/:resortId', async (request, reply) => {
    const { resortId } = request.params

    const resort = await app.prisma.resort.findUnique({ where: { id: resortId } })
    if (!resort) {
      return reply.code(404).send({ error: 'Resort não encontrado' })
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const [
      totalRooms,
      occupiedRooms,
      checkInsToday,
      checkOutsToday,
      pendingMaintenance,
      pendingServiceOrders,
      revenueTodayAgg,
      revenueMtdAgg,
      lowStockCount,
      avgRating,
    ] = await Promise.all([
      app.prisma.room.count({ where: { resortId } }),
      app.prisma.room.count({ where: { resortId, status: 'OCCUPIED' } }),
      app.prisma.reservation.count({
        where: { resortId, status: 'CONFIRMED', checkIn: { gte: todayStart, lte: todayEnd } },
      }),
      app.prisma.reservation.count({
        where: { resortId, status: 'CHECKED_IN', checkOut: { gte: todayStart, lte: todayEnd } },
      }),
      app.prisma.maintenanceTicket.count({
        where: { resortId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      app.prisma.roomServiceOrder.count({
        where: { resortId, status: { in: ['PENDING', 'CONFIRMED'] } },
      }),
      app.prisma.sale.aggregate({
        where: { resortId, status: 'INVOICED', createdAt: { gte: todayStart, lte: todayEnd } },
        _sum: { totalAmount: true },
      }),
      app.prisma.sale.aggregate({
        where: { resortId, status: 'INVOICED', createdAt: { gte: monthStart } },
        _sum: { totalAmount: true },
      }),
      app.prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT COUNT(*) as count FROM "StockItem" WHERE "resortId" = $1 AND "currentQty" <= "minQty"`,
        resortId,
      ),
      app.prisma.guestReview.aggregate({
        where: { resortId, published: true },
        _avg: { overallRating: true },
      }),
    ])

    const occupancy = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100 * 10) / 10 : 0

    return reply.send({
      data: {
        resortId,
        resortName: resort.name,
        occupancy,
        totalRooms,
        occupiedRooms,
        revenueToday: revenueTodayAgg._sum.totalAmount?.toNumber() ?? 0,
        revenueMtd: revenueMtdAgg._sum.totalAmount?.toNumber() ?? 0,
        checkInsToday,
        checkOutsToday,
        pendingMaintenance,
        lowStockAlerts: Number(lowStockCount[0]?.count ?? 0),
        pendingServiceOrders,
        averageRating: avgRating._avg.overallRating ?? 0,
      },
    })
  })

  // ── GET /central — Dashboard central (todos os resorts) ──
  app.get('/central', async (request, reply) => {
    if (!['SUPER_ADMIN'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Apenas SUPER_ADMIN pode aceder ao dashboard central' })
    }

    const resorts = await app.prisma.resort.findMany({ where: { active: true } })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const overviews = await Promise.all(
      resorts.map(async (resort) => {
        const [totalRooms, occupiedRooms, checkInsToday, revenueMtdAgg] = await Promise.all([
          app.prisma.room.count({ where: { resortId: resort.id } }),
          app.prisma.room.count({ where: { resortId: resort.id, status: 'OCCUPIED' } }),
          app.prisma.reservation.count({
            where: { resortId: resort.id, status: 'CONFIRMED', checkIn: { gte: todayStart } },
          }),
          app.prisma.sale.aggregate({
            where: { resortId: resort.id, status: 'INVOICED', createdAt: { gte: monthStart } },
            _sum: { totalAmount: true },
          }),
        ])

        return {
          resortId: resort.id,
          resortName: resort.name,
          occupancy: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100 * 10) / 10 : 0,
          totalRooms,
          occupiedRooms,
          checkInsToday,
          revenueMtd: revenueMtdAgg._sum.totalAmount?.toNumber() ?? 0,
        }
      }),
    )

    return reply.send({
      data: {
        resorts: overviews,
        totalRevenueMtd: overviews.reduce((sum, r) => sum + r.revenueMtd, 0),
        totalOccupancy: overviews.length > 0
          ? Math.round(overviews.reduce((sum, r) => sum + r.occupancy, 0) / overviews.length * 10) / 10
          : 0,
        combinedCheckInsToday: overviews.reduce((sum, r) => sum + r.checkInsToday, 0),
      },
    })
  })
}
