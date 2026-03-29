import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { createHash, randomBytes } from 'crypto'

const prisma = new PrismaClient()

// Hash simples para passwords de seed (bcrypt não disponível aqui)
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

async function main() {
  console.log('🌱 A iniciar seed da base de dados...')

  // ── LIMPEZA (garante seed idempotente) ──
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE
    "SecurityPatrol", "SecurityIncident", "SecurityInstallation", "SecurityContract",
    "ElectricalCertification", "ElectricalInspection", "ElectricalProject",
    "ConstructionWork", "BudgetItem", "WorkMeasurement", "EngineeringProject",
    "Deal", "Client",
    "Vehicle",
    "Payroll", "AttendanceRecord", "Employee",
    "StockMovement", "StockItem", "Supplier",
    "SaleItem", "Sale",
    "GuestReview", "RoomServiceOrder", "ChatMessage",
    "Reservation", "Guest",
    "Tariff", "Room",
    "Product",
    "Notification", "AlertRule", "AuditLog",
    "Document", "InvoiceItem", "Invoice", "InvoiceSeries",
    "RefreshToken", "User",
    "TenantModule", "Module",
    "Branch", "Tenant",
    "Resort"
  CASCADE`)
  console.log('✅ BD limpa — a criar dados...')

  // ── RESORTS ──
  const caboLedo = await prisma.resort.upsert({
    where: { slug: 'cabo-ledo' },
    update: {},
    create: {
      name: 'Sea and Soul — Cabo Ledo',
      slug: 'cabo-ledo',
      lat: -9.0333,
      lng: 13.2333,
      geofenceRadius: 300,
    },
  })

  const sangano = await prisma.resort.upsert({
    where: { slug: 'sangano' },
    update: {},
    create: {
      name: 'Sea and Soul — Sangano',
      slug: 'sangano',
      lat: -9.1000,
      lng: 13.1500,
      geofenceRadius: 300,
    },
  })

  console.log('✅ Resorts criados:', caboLedo.name, '|', sangano.name)

  // ── PALMEIRA HOTEL (demo client) ──
  const palmeira = await prisma.resort.upsert({
    where: { slug: 'palmeira' },
    update: {},
    create: {
      name: 'Palmeira Beach Hotel',
      slug: 'palmeira',
      lat: -8.8147,
      lng: 13.2302,
      geofenceRadius: 200,
    },
  })
  console.log('✅ Resort demo criado:', palmeira.name)

  // Quartos para Palmeira
  const palmeiraRooms = await Promise.all([
    prisma.room.upsert({ where: { id: 'palmeira-room-101' }, update: {}, create: { id: 'palmeira-room-101', resortId: palmeira.id, number: '101', type: 'STANDARD', floor: 1, capacity: 2, pricePerNight: new Decimal('35000'), status: 'AVAILABLE' } }),
    prisma.room.upsert({ where: { id: 'palmeira-room-201' }, update: {}, create: { id: 'palmeira-room-201', resortId: palmeira.id, number: '201', type: 'SUPERIOR', floor: 2, capacity: 2, pricePerNight: new Decimal('50000'), status: 'AVAILABLE' } }),
    prisma.room.upsert({ where: { id: 'palmeira-room-301' }, update: {}, create: { id: 'palmeira-room-301', resortId: palmeira.id, number: '301', type: 'SUPERIOR', floor: 3, capacity: 2, pricePerNight: new Decimal('75000'), status: 'AVAILABLE' } }),
    prisma.room.upsert({ where: { id: 'palmeira-room-401' }, update: {}, create: { id: 'palmeira-room-401', resortId: palmeira.id, number: '401', type: 'SUITE', floor: 4, capacity: 4, pricePerNight: new Decimal('120000'), status: 'AVAILABLE' } }),
    prisma.room.upsert({ where: { id: 'palmeira-room-501' }, update: {}, create: { id: 'palmeira-room-501', resortId: palmeira.id, number: '501', type: 'SUITE', floor: 5, capacity: 6, pricePerNight: new Decimal('250000'), status: 'AVAILABLE' } }),
  ])
  console.log('✅ Quartos Palmeira:', palmeiraRooms.length)

  // ── UTILIZADORES ──
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@seasoul.ao' },
      update: {},
      create: {
        name: 'Administrador Geral',
        email: 'admin@seasoul.ao',
        passwordHash: '$2b$10$placeholder.admin.hash', // mudar em produção
        role: 'SUPER_ADMIN',
        resortId: null,
      },
    }),
    prisma.user.upsert({
      where: { email: 'manager.cl@seasoul.ao' },
      update: {},
      create: {
        name: 'Carlos Mendes',
        email: 'manager.cl@seasoul.ao',
        passwordHash: '$2b$10$placeholder.manager.hash',
        role: 'RESORT_MANAGER',
        resortId: caboLedo.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'manager.sg@seasoul.ao' },
      update: {},
      create: {
        name: 'Ana Santos',
        email: 'manager.sg@seasoul.ao',
        passwordHash: '$2b$10$placeholder.manager.hash',
        role: 'RESORT_MANAGER',
        resortId: sangano.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'recepcao.cl@seasoul.ao' },
      update: {},
      create: {
        name: 'Maria Silva',
        email: 'recepcao.cl@seasoul.ao',
        passwordHash: '$2b$10$placeholder.recep.hash',
        role: 'RECEPTIONIST',
        resortId: caboLedo.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'pos.cl@seasoul.ao' },
      update: {},
      create: {
        name: 'João Ferreira',
        email: 'pos.cl@seasoul.ao',
        passwordHash: '$2b$10$placeholder.pos.hash',
        role: 'POS_OPERATOR',
        resortId: caboLedo.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'stock.cl@seasoul.ao' },
      update: {},
      create: {
        name: 'Pedro Costa',
        email: 'stock.cl@seasoul.ao',
        passwordHash: '$2b$10$placeholder.stock.hash',
        role: 'STOCK_MANAGER',
        resortId: caboLedo.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'hr@seasoul.ao' },
      update: {},
      create: {
        name: 'Luísa Neto',
        email: 'hr@seasoul.ao',
        passwordHash: '$2b$10$placeholder.hr.hash',
        role: 'HR_MANAGER',
        resortId: caboLedo.id,
      },
    }),
  ])

  console.log(`✅ ${users.length} utilizadores criados`)

  // ── QUARTOS — Cabo Ledo ──
  const roomTypes = [
    { type: 'STANDARD' as const, price: 25000, floors: [1, 2], count: 8 },
    { type: 'SUPERIOR' as const, price: 45000, floors: [2, 3], count: 6 },
    { type: 'SUITE' as const, price: 75000, floors: [3], count: 4 },
    { type: 'VILLA' as const, price: 120000, floors: [0], count: 2 },
  ]

  const rooms = []
  let roomNum = 100

  for (const rt of roomTypes) {
    for (let i = 0; i < rt.count; i++) {
      roomNum++
      const floor = rt.floors[i % rt.floors.length]
      rooms.push(
        prisma.room.upsert({
          where: { resortId_number: { resortId: caboLedo.id, number: String(roomNum) } },
          update: {},
          create: {
            resortId: caboLedo.id,
            number: String(roomNum),
            type: rt.type,
            floor,
            capacity: rt.type === 'VILLA' ? 6 : rt.type === 'SUITE' ? 4 : 2,
            pricePerNight: new Decimal(String(rt.price)),
            amenities: rt.type === 'STANDARD'
              ? ['Wi-Fi', 'AC', 'TV']
              : rt.type === 'SUPERIOR'
                ? ['Wi-Fi', 'AC', 'TV', 'Minibar', 'Vista Mar']
                : ['Wi-Fi', 'AC', 'TV', 'Minibar', 'Vista Mar', 'Jacuzzi', 'Varanda'],
          },
        }),
      )
    }
  }

  // Quartos Sangano
  roomNum = 200
  for (const rt of roomTypes) {
    for (let i = 0; i < rt.count; i++) {
      roomNum++
      const floor = rt.floors[i % rt.floors.length]
      rooms.push(
        prisma.room.upsert({
          where: { resortId_number: { resortId: sangano.id, number: String(roomNum) } },
          update: {},
          create: {
            resortId: sangano.id,
            number: String(roomNum),
            type: rt.type,
            floor,
            capacity: rt.type === 'VILLA' ? 6 : rt.type === 'SUITE' ? 4 : 2,
            pricePerNight: new Decimal(String(rt.price)),
            amenities: ['Wi-Fi', 'AC', 'TV'],
          },
        }),
      )
    }
  }

  const createdRooms = await Promise.all(rooms)
  console.log(`✅ ${createdRooms.length} quartos criados (${roomTypes.reduce((s, r) => s + r.count, 0)} por resort)`)

  // ── TARIFAS ──
  const tariffs = await Promise.all([
    // Cabo Ledo — Época Alta
    prisma.tariff.create({
      data: {
        resortId: caboLedo.id,
        name: 'Época Alta — Standard',
        roomType: 'STANDARD',
        pricePerNight: new Decimal('30000'),
        validFrom: new Date('2026-06-01'),
        validUntil: new Date('2026-09-30'),
        minNights: 2,
      },
    }),
    prisma.tariff.create({
      data: {
        resortId: caboLedo.id,
        name: 'Época Alta — Suite',
        roomType: 'SUITE',
        pricePerNight: new Decimal('90000'),
        validFrom: new Date('2026-06-01'),
        validUntil: new Date('2026-09-30'),
        minNights: 2,
      },
    }),
    // Cabo Ledo — Época Baixa
    prisma.tariff.create({
      data: {
        resortId: caboLedo.id,
        name: 'Época Baixa — Standard',
        roomType: 'STANDARD',
        pricePerNight: new Decimal('20000'),
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-05-31'),
        minNights: 1,
      },
    }),
    // Sangano
    prisma.tariff.create({
      data: {
        resortId: sangano.id,
        name: 'Tarifa Base — Standard',
        roomType: 'STANDARD',
        pricePerNight: new Decimal('22000'),
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-12-31'),
        minNights: 1,
      },
    }),
  ])

  console.log(`✅ ${tariffs.length} tarifas criadas`)

  // ── PRODUTOS ──
  const products = await Promise.all([
    // Bar — serviços de hotelaria: HOTEL_SERVICE 7%
    prisma.product.create({ data: { name: 'Cerveja Cuca', category: 'Bebidas', department: 'BAR', unitPrice: new Decimal('800'), taxCategory: 'HOTEL_SERVICE', taxRate: new Decimal('7') } }),
    prisma.product.create({ data: { name: 'Cerveja Nocal', category: 'Bebidas', department: 'BAR', unitPrice: new Decimal('800'), taxCategory: 'HOTEL_SERVICE', taxRate: new Decimal('7') } }),
    prisma.product.create({ data: { name: 'Água Mineral 0.5L', category: 'Bebidas', department: 'BAR', unitPrice: new Decimal('300'), taxCategory: 'FOOD_REDUCED', taxRate: new Decimal('7') } }),
    prisma.product.create({ data: { name: 'Sumo Natural', category: 'Bebidas', department: 'BAR', unitPrice: new Decimal('1200'), taxCategory: 'HOTEL_SERVICE', taxRate: new Decimal('7') } }),
    prisma.product.create({ data: { name: 'Caipirinha', category: 'Cocktails', department: 'BAR', unitPrice: new Decimal('2500'), taxCategory: 'HOTEL_SERVICE', taxRate: new Decimal('7') } }),
    prisma.product.create({ data: { name: 'Mojito', category: 'Cocktails', department: 'BAR', unitPrice: new Decimal('2800'), taxCategory: 'HOTEL_SERVICE', taxRate: new Decimal('7') } }),
    prisma.product.create({ data: { name: 'Whisky Dose', category: 'Bebidas Espirituosas', department: 'BAR', unitPrice: new Decimal('3500'), taxCategory: 'HOTEL_SERVICE', taxRate: new Decimal('7') } }),
    // Restaurante — serviços de hotelaria: HOTEL_SERVICE 7%
    prisma.product.create({ data: { name: 'Peixe Grelhado', category: 'Pratos Principais', department: 'RESTAURANTE', unitPrice: new Decimal('5500'), taxCategory: 'HOTEL_SERVICE', taxRate: new Decimal('7') } }),
    prisma.product.create({ data: { name: 'Lagosta', category: 'Pratos Principais', department: 'RESTAURANTE', unitPrice: new Decimal('12000'), taxCategory: 'HOTEL_SERVICE', taxRate: new Decimal('7') } }),
    prisma.product.create({ data: { name: 'Muamba de Galinha', category: 'Pratos Principais', department: 'RESTAURANTE', unitPrice: new Decimal('4500'), taxCategory: 'HOTEL_SERVICE', taxRate: new Decimal('7') } }),
    prisma.product.create({ data: { name: 'Calulu de Peixe', category: 'Pratos Principais', department: 'RESTAURANTE', unitPrice: new Decimal('4800'), taxCategory: 'HOTEL_SERVICE', taxRate: new Decimal('7') } }),
    prisma.product.create({ data: { name: 'Bife com Batatas', category: 'Pratos Principais', department: 'RESTAURANTE', unitPrice: new Decimal('6000'), taxCategory: 'HOTEL_SERVICE', taxRate: new Decimal('7') } }),
    prisma.product.create({ data: { name: 'Salada Mista', category: 'Entradas', department: 'RESTAURANTE', unitPrice: new Decimal('1800'), taxCategory: 'HOTEL_SERVICE', taxRate: new Decimal('7') } }),
    prisma.product.create({ data: { name: 'Sopa do Dia', category: 'Entradas', department: 'RESTAURANTE', unitPrice: new Decimal('1200'), taxCategory: 'HOTEL_SERVICE', taxRate: new Decimal('7') } }),
    prisma.product.create({ data: { name: 'Pudim', category: 'Sobremesas', department: 'RESTAURANTE', unitPrice: new Decimal('1500'), taxCategory: 'HOTEL_SERVICE', taxRate: new Decimal('7') } }),
    prisma.product.create({ data: { name: 'Gelado 2 Bolas', category: 'Sobremesas', department: 'RESTAURANTE', unitPrice: new Decimal('1200'), taxCategory: 'HOTEL_SERVICE', taxRate: new Decimal('7') } }),
    // SPA — serviços de hotelaria: HOTEL_SERVICE 7%
    prisma.product.create({ data: { name: 'Massagem Relaxante 60min', category: 'Massagens', department: 'SPA', unitPrice: new Decimal('15000'), taxCategory: 'HOTEL_SERVICE', taxRate: new Decimal('7') } }),
    prisma.product.create({ data: { name: 'Massagem Desportiva 45min', category: 'Massagens', department: 'SPA', unitPrice: new Decimal('12000'), taxCategory: 'HOTEL_SERVICE', taxRate: new Decimal('7') } }),
    prisma.product.create({ data: { name: 'Tratamento Facial', category: 'Tratamentos', department: 'SPA', unitPrice: new Decimal('10000'), taxCategory: 'HOTEL_SERVICE', taxRate: new Decimal('7') } }),
    // Atividades — serviços de hotelaria: HOTEL_SERVICE 7%
    prisma.product.create({ data: { name: 'Aula de Surf 1h', category: 'Desportos Aquáticos', department: 'ATIVIDADES', unitPrice: new Decimal('8000'), taxCategory: 'HOTEL_SERVICE', taxRate: new Decimal('7') } }),
    prisma.product.create({ data: { name: 'Aluguer Kayak 1h', category: 'Desportos Aquáticos', department: 'ATIVIDADES', unitPrice: new Decimal('5000'), taxCategory: 'HOTEL_SERVICE', taxRate: new Decimal('7') } }),
    prisma.product.create({ data: { name: 'Passeio de Barco', category: 'Excursões', department: 'ATIVIDADES', unitPrice: new Decimal('20000'), taxCategory: 'HOTEL_SERVICE', taxRate: new Decimal('7') } }),
    // Loja — retalho: STANDARD 14%
    prisma.product.create({ data: { name: 'T-shirt Sea and Soul', category: 'Merchandising', department: 'LOJA', unitPrice: new Decimal('3500'), taxCategory: 'STANDARD', taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Protetor Solar SPF50', category: 'Utilidades', department: 'LOJA', unitPrice: new Decimal('4000'), taxCategory: 'STANDARD', taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Chapéu de Praia', category: 'Merchandising', department: 'LOJA', unitPrice: new Decimal('2500'), taxCategory: 'STANDARD', taxRate: new Decimal('14') } }),
  ])

  console.log(`✅ ${products.length} produtos criados`)

  // ── FORNECEDORES ──
  const suppliers = await Promise.all([
    prisma.supplier.upsert({ where: { nif: '5417123456' }, update: {}, create: { name: 'Distribuidora Luanda', nif: '5417123456', contact: 'Manuel Sousa', phone: '+244 923 111 222', email: 'vendas@distluanda.ao' } }),
    prisma.supplier.upsert({ where: { nif: '5417654321' }, update: {}, create: { name: 'Pescador Cabo Ledo', nif: '5417654321', contact: 'António Pescador', phone: '+244 923 333 444' } }),
    prisma.supplier.upsert({ where: { nif: '5417111222' }, update: {}, create: { name: 'Fazenda Orgânica Bengo', nif: '5417111222', contact: 'Rosa Campos', phone: '+244 923 555 666', email: 'encomendas@fazendabengo.ao' } }),
    prisma.supplier.upsert({ where: { nif: '5417999888' }, update: {}, create: { name: 'Bebidas Angola Lda', nif: '5417999888', contact: 'Carlos Bebidas', phone: '+244 923 777 888' } }),
  ])

  console.log(`✅ ${suppliers.length} fornecedores criados`)

  // ── STOCK — Cabo Ledo ──
  const stockItems = await Promise.all([
    prisma.stockItem.create({ data: { resortId: caboLedo.id, name: 'Cerveja Cuca (caixa 24)', department: 'BAR', unit: 'caixa', currentQty: new Decimal('50'), minQty: new Decimal('10') } }),
    prisma.stockItem.create({ data: { resortId: caboLedo.id, name: 'Água Mineral 0.5L (pack 12)', department: 'BAR', unit: 'pack', currentQty: new Decimal('80'), minQty: new Decimal('20') } }),
    prisma.stockItem.create({ data: { resortId: caboLedo.id, name: 'Toalhas Banho', department: 'HOUSEKEEPING', unit: 'unidade', currentQty: new Decimal('200'), minQty: new Decimal('50') } }),
    prisma.stockItem.create({ data: { resortId: caboLedo.id, name: 'Lençóis Cama Casal', department: 'HOUSEKEEPING', unit: 'conjunto', currentQty: new Decimal('100'), minQty: new Decimal('30') } }),
    prisma.stockItem.create({ data: { resortId: caboLedo.id, name: 'Detergente Multiusos 5L', department: 'LIMPEZA', unit: 'garrafão', currentQty: new Decimal('15'), minQty: new Decimal('5') } }),
    prisma.stockItem.create({ data: { resortId: caboLedo.id, name: 'Arroz 25kg', department: 'COZINHA', unit: 'saco', currentQty: new Decimal('8'), minQty: new Decimal('3') } }),
    prisma.stockItem.create({ data: { resortId: caboLedo.id, name: 'Azeite 5L', department: 'COZINHA', unit: 'garrafão', currentQty: new Decimal('12'), minQty: new Decimal('4') } }),
    prisma.stockItem.create({ data: { resortId: caboLedo.id, name: 'Peixe Fresco', department: 'COZINHA', unit: 'kg', currentQty: new Decimal('25.5'), minQty: new Decimal('10') } }),
    // Sangano
    prisma.stockItem.create({ data: { resortId: sangano.id, name: 'Cerveja Cuca (caixa 24)', department: 'BAR', unit: 'caixa', currentQty: new Decimal('30'), minQty: new Decimal('10') } }),
    prisma.stockItem.create({ data: { resortId: sangano.id, name: 'Toalhas Banho', department: 'HOUSEKEEPING', unit: 'unidade', currentQty: new Decimal('150'), minQty: new Decimal('40') } }),
  ])

  console.log(`✅ ${stockItems.length} itens de stock criados`)

  // ── COLABORADORES ──
  const employees = await Promise.all([
    prisma.employee.upsert({ where: { nif: '000111222AA' }, update: {}, create: { resortId: caboLedo.id, name: 'António Luís', nif: '000111222AA', role: 'Rececionista', department: 'RECEÇÃO', baseSalary: new Decimal('180000'), startDate: new Date('2024-01-15') } }),
    prisma.employee.upsert({ where: { nif: '000222333BB' }, update: {}, create: { resortId: caboLedo.id, name: 'Beatriz Martins', nif: '000222333BB', role: 'Chef de Cozinha', department: 'COZINHA', baseSalary: new Decimal('350000'), startDate: new Date('2023-06-01') } }),
    prisma.employee.upsert({ where: { nif: '000333444CC' }, update: {}, create: { resortId: caboLedo.id, name: 'Carlos Neto', nif: '000333444CC', role: 'Barman', department: 'BAR', baseSalary: new Decimal('150000'), startDate: new Date('2024-03-01') } }),
    prisma.employee.upsert({ where: { nif: '000444555DD' }, update: {}, create: { resortId: caboLedo.id, name: 'Diana Sousa', nif: '000444555DD', role: 'Governanta', department: 'HOUSEKEEPING', baseSalary: new Decimal('200000'), startDate: new Date('2023-09-15') } }),
    prisma.employee.upsert({ where: { nif: '000555666EE' }, update: {}, create: { resortId: caboLedo.id, name: 'Eduardo Fonseca', nif: '000555666EE', role: 'Segurança', department: 'SEGURANÇA', baseSalary: new Decimal('120000'), startDate: new Date('2024-06-01') } }),
    prisma.employee.upsert({ where: { nif: '000666777FF' }, update: {}, create: { resortId: caboLedo.id, name: 'Fernanda Lima', nif: '000666777FF', role: 'Terapeuta SPA', department: 'SPA', baseSalary: new Decimal('200000'), startDate: new Date('2024-01-01') } }),
    prisma.employee.upsert({ where: { nif: '000777888GG' }, update: {}, create: { resortId: sangano.id, name: 'Gabriel Santos', nif: '000777888GG', role: 'Rececionista', department: 'RECEÇÃO', baseSalary: new Decimal('180000'), startDate: new Date('2024-02-01') } }),
    prisma.employee.upsert({ where: { nif: '000888999HH' }, update: {}, create: { resortId: sangano.id, name: 'Helena Costa', nif: '000888999HH', role: 'Chef de Cozinha', department: 'COZINHA', baseSalary: new Decimal('320000'), startDate: new Date('2023-08-15') } }),
  ])

  console.log(`✅ ${employees.length} colaboradores criados`)

  // ── HÓSPEDES ──
  const guests = await Promise.all([
    prisma.guest.create({ data: { name: 'Roberto Almeida', phone: '+244 923 100 001', email: 'roberto@email.com', language: 'pt' } }),
    prisma.guest.create({ data: { name: 'Sofia Fernandes', phone: '+244 923 100 002', email: 'sofia@email.com', language: 'pt' } }),
    prisma.guest.create({ data: { name: 'John Smith', phone: '+1 555 100 003', email: 'john.smith@email.com', language: 'en' } }),
    prisma.guest.create({ data: { name: 'Marie Dupont', phone: '+33 6 100 004', email: 'marie.dupont@email.com', language: 'fr' } }),
  ])

  console.log(`✅ ${guests.length} hóspedes criados`)

  // ── RESERVAS EXEMPLO ──
  const clRooms = createdRooms.filter((r) => r.resortId === caboLedo.id)
  const reservations = await Promise.all([
    prisma.reservation.create({
      data: {
        resortId: caboLedo.id,
        roomId: clRooms[0].id,
        guestId: guests[0].id,
        guestName: 'Roberto Almeida',
        guestEmail: 'roberto@email.com',
        guestPhone: '+244 923 100 001',
        checkIn: new Date('2026-04-01'),
        checkOut: new Date('2026-04-05'),
        nights: 4,
        adults: 2,
        children: 0,
        status: 'CONFIRMED',
        totalAmount: new Decimal('100000'),
        depositPaid: new Decimal('50000'),
        paymentStatus: 'PARTIAL',
        bookingSource: 'DIRECT',
      },
    }),
    prisma.reservation.create({
      data: {
        resortId: caboLedo.id,
        roomId: clRooms[4].id,
        guestId: guests[2].id,
        guestName: 'John Smith',
        guestEmail: 'john.smith@email.com',
        guestPhone: '+1 555 100 003',
        checkIn: new Date('2026-04-10'),
        checkOut: new Date('2026-04-17'),
        nights: 7,
        adults: 2,
        children: 1,
        status: 'CONFIRMED',
        totalAmount: new Decimal('525000'),
        depositPaid: new Decimal('525000'),
        paymentStatus: 'PAID',
        bookingSource: 'WEBSITE',
      },
    }),
    prisma.reservation.create({
      data: {
        resortId: caboLedo.id,
        roomId: clRooms[2].id,
        guestId: guests[1].id,
        guestName: 'Sofia Fernandes',
        guestEmail: 'sofia@email.com',
        guestPhone: '+244 923 100 002',
        checkIn: new Date('2026-03-25'),
        checkOut: new Date('2026-03-28'),
        nights: 3,
        adults: 1,
        children: 0,
        status: 'CHECKED_IN',
        totalAmount: new Decimal('75000'),
        depositPaid: new Decimal('75000'),
        paymentStatus: 'PAID',
        bookingSource: 'PHONE',
      },
    }),
  ])

  console.log(`✅ ${reservations.length} reservas criadas`)

  // Marcar quarto da reserva checked-in como OCCUPIED
  await prisma.room.update({
    where: { id: clRooms[2].id },
    data: { status: 'OCCUPIED' },
  })

  // ══════════════════════════════════════════════
  // MULTI-TENANT — ENGERIS ONE
  // ══════════════════════════════════════════════

  // ── TENANTS ──
  const engeris = await prisma.tenant.upsert({
    where: { slug: 'engeris' },
    update: {},
    create: {
      name: 'ENGERIS',
      slug: 'engeris',
      nif: '5417892301',
      plan: 'ENTERPRISE',
      primaryColor: '#0A5C8A',
      maxUsers: 100,
      maxBranches: 10,
    },
  })

  const seaSoul = await prisma.tenant.upsert({
    where: { slug: 'sea-soul' },
    update: {},
    create: {
      name: 'Sea & Soul Resorts',
      slug: 'sea-soul',
      nif: '5623891045',
      plan: 'PROFESSIONAL',
      primaryColor: '#1A3E6E',
      maxUsers: 25,
      maxBranches: 3,
    },
  })

  console.log('✅ Tenants criados:', engeris.name, '|', seaSoul.name)

  // ── PALMEIRA TENANT (demo client) ──
  const palmeiraTenant = await prisma.tenant.upsert({
    where: { slug: 'palmeira' },
    update: {},
    create: {
      name: 'Palmeira Beach Hotel',
      slug: 'palmeira',
      plan: 'PROFESSIONAL',
      primaryColor: '#D97706',
      active: true,
    },
  })
  console.log('✅ Tenant Palmeira criado:', palmeiraTenant.name)

  const seasoulTenant = await prisma.tenant.upsert({
    where: { slug: 'seaandsoul' },
    update: {},
    create: {
      name: 'Sea and Soul Resorts',
      slug: 'seaandsoul',
      plan: 'ENTERPRISE',
      primaryColor: '#1A3E6E',
      active: true,
    },
  })
  console.log('✅ Tenant Sea and Soul criado:', seasoulTenant.name)

  // ── MÓDULOS DO MARKETPLACE (só hotelaria & restauração) ──
  const MODULE_CATALOG = [
    // Core — incluído em todos os planos
    { id: 'core',        name: 'Plataforma Core',     category: 'Core',       basePrice: 0  },
    { id: 'pms',         name: 'PMS & Reservas',      category: 'Core',       basePrice: 0  },
    { id: 'pos',         name: 'POS & Restauração',   category: 'Core',       basePrice: 0  },
    { id: 'finance',     name: 'Faturação & Finanças',category: 'Core',       basePrice: 0  },
    // Operações hoteleiras
    { id: 'stock',       name: 'Stock & Compras',     category: 'Operations', basePrice: 49 },
    { id: 'hr',          name: 'RH & Assiduidade',    category: 'Operations', basePrice: 49 },
    { id: 'maintenance', name: 'Manutenção & Ops',    category: 'Operations', basePrice: 29 },
    { id: 'security',    name: 'Segurança & Rondas',  category: 'Operations', basePrice: 29 },
    { id: 'retail',      name: 'Loja do Resort',      category: 'Operations', basePrice: 29 },
    // Lazer & experiências
    { id: 'spa',         name: 'Spa & Bem-Estar',     category: 'Leisure',    basePrice: 49 },
    { id: 'activities',  name: 'Atividades & Tours',  category: 'Leisure',    basePrice: 29 },
    { id: 'events',      name: 'Eventos & Banquetes', category: 'Leisure',    basePrice: 39 },
  ]

  for (const mod of MODULE_CATALOG) {
    await prisma.module.upsert({
      where: { id: mod.id },
      update: { name: mod.name, category: mod.category, basePrice: mod.basePrice },
      create: { id: mod.id, name: mod.name, category: mod.category, basePrice: mod.basePrice, isAvailable: true },
    })
  }
  console.log(`✅ ${MODULE_CATALOG.length} módulos do marketplace criados`)

  // ── MÓDULOS DO TENANT ──
  const allModules = MODULE_CATALOG.map(m => m.id)
  // Sea and Soul tem todos os módulos (plano Enterprise)
  const seaSoulModules = allModules

  for (const moduleId of allModules) {
    await prisma.tenantModule.upsert({
      where: { tenantId_moduleId: { tenantId: engeris.id, moduleId } },
      update: {},
      create: { tenantId: engeris.id, moduleId },
    })
  }
  for (const moduleId of seaSoulModules) {
    await prisma.tenantModule.upsert({
      where: { tenantId_moduleId: { tenantId: seaSoul.id, moduleId } },
      update: {},
      create: { tenantId: seaSoul.id, moduleId },
    })
  }
  console.log(`✅ Módulos: ENGERIS=${allModules.length}, Sea&Soul=${seaSoulModules.length}`)

  // ── FILIAIS ──
  await Promise.all([
    prisma.branch.upsert({ where: { tenantId_slug: { tenantId: engeris.id, slug: 'sede-luanda' } }, update: {}, create: { tenantId: engeris.id, name: 'Sede Luanda', slug: 'sede-luanda', address: 'Rua da Missão, 45', city: 'Luanda', phone: '+244 222 334 567' } }),
    prisma.branch.upsert({ where: { tenantId_slug: { tenantId: engeris.id, slug: 'filial-benguela' } }, update: {}, create: { tenantId: engeris.id, name: 'Filial Benguela', slug: 'filial-benguela', address: 'Av. Norton de Matos, 120', city: 'Benguela', phone: '+244 272 221 345' } }),
    prisma.branch.upsert({ where: { tenantId_slug: { tenantId: engeris.id, slug: 'filial-cabinda' } }, update: {}, create: { tenantId: engeris.id, name: 'Filial Cabinda', slug: 'filial-cabinda', address: 'Rua Principal, 8', city: 'Cabinda' } }),
    prisma.branch.upsert({ where: { tenantId_slug: { tenantId: seaSoul.id, slug: 'cabo-ledo-resort' } }, update: {}, create: { tenantId: seaSoul.id, name: 'Cabo Ledo Resort', slug: 'cabo-ledo-resort', city: 'Cabo Ledo', lat: -9.0333, lng: 13.2333, geofenceRadius: 300 } }),
    prisma.branch.upsert({ where: { tenantId_slug: { tenantId: seaSoul.id, slug: 'sangano-resort' } }, update: {}, create: { tenantId: seaSoul.id, name: 'Sangano Beach Resort', slug: 'sangano-resort', city: 'Sangano', lat: -9.1, lng: 13.15, geofenceRadius: 300 } }),
  ])
  console.log('✅ 5 filiais criadas')

  // ── UTILIZADORES MULTI-TENANT ──
  await Promise.all([
    prisma.user.upsert({ where: { email: 'admin@engeris.ao' }, update: {}, create: { name: 'Super Admin ENGERIS', email: 'admin@engeris.ao', passwordHash: '$2b$10$placeholder.superadmin', role: 'SUPER_ADMIN', tenantId: engeris.id } }),
    prisma.user.upsert({ where: { email: 'gestor@engeris.ao' }, update: {}, create: { name: 'Paulo Gestor', email: 'gestor@engeris.ao', passwordHash: '$2b$10$placeholder.manager', role: 'RESORT_MANAGER', tenantId: engeris.id } }),
    prisma.user.upsert({ where: { email: 'tecnico@engeris.ao' }, update: {}, create: { name: 'Marco Técnico', email: 'tecnico@engeris.ao', passwordHash: '$2b$10$placeholder.staff', role: 'STAFF', tenantId: engeris.id } }),
  ])
  console.log('✅ Utilizadores multi-tenant criados')

  // ── SEGURANÇA DO RESORT ──
  await Promise.all([
    prisma.securityIncident.create({ data: { tenantId: seasoulTenant.id, title: 'Acesso não autorizado — Piscina', type: 'INTRUSION', severity: 'LOW', status: 'RESOLVED', location: 'Zona Piscina, Cabo Ledo', description: 'Visitante externo entrou na área restrita — acompanhado à saída' } }),
    prisma.securityIncident.create({ data: { tenantId: seasoulTenant.id, title: 'Equipamento avariado — Câmara Portão', type: 'EQUIPMENT_FAILURE', severity: 'LOW', status: 'RESOLVED', location: 'Portão Principal, Cabo Ledo', description: 'Câmara CCTV do portão principal sem imagem — substituída a 27/03' } }),
  ])
  await Promise.all([
    prisma.securityPatrol.create({ data: { tenantId: seasoulTenant.id, guardName: 'Eduardo Fonseca', guardId: 'EF-001', route: 'Rota A — Perímetro Praia', startedAt: new Date('2026-03-26T22:00:00'), endedAt: new Date('2026-03-27T06:00:00'), status: 'COMPLETED', checkpoints: [{ point: 'Portão Principal', time: '22:10', ok: true }, { point: 'Acesso Praia', time: '23:00', ok: true }, { point: 'Zona de Villas', time: '00:30', ok: true }, { point: 'Bar da Piscina', time: '02:00', ok: true }] } }),
    prisma.securityPatrol.create({ data: { tenantId: seasoulTenant.id, guardName: 'Manuel Segurança', guardId: 'MS-002', route: 'Rota B — Interior Resort', startedAt: new Date('2026-03-27T22:00:00'), status: 'IN_PROGRESS', checkpoints: [{ point: 'Receção', time: '22:05', ok: true }, { point: 'Bloco A', time: '22:45', ok: true }] } }),
  ])
  console.log('✅ Segurança resort: 2 incidentes, 2 patrulhas')

  // ── SPA ──
  const spaService = await prisma.spaService.create({ data: { tenantId: seasoulTenant.id, name: 'Massagem Relaxante', category: 'MASSAGE', duration: 60, price: new Decimal('15000'), description: 'Massagem completa com óleos essenciais' } })
  await prisma.spaService.create({ data: { tenantId: seasoulTenant.id, name: 'Tratamento Facial Premium', category: 'FACIAL', duration: 45, price: new Decimal('12000') } })
  await prisma.spaBooking.create({ data: { tenantId: seasoulTenant.id, serviceId: spaService.id, clientName: 'Sofia Fernandes', clientPhone: '+244 923 100 002', date: new Date('2026-04-01T10:00:00'), totalPrice: new Decimal('15000'), status: 'CONFIRMED' } })
  console.log('✅ Spa: 2 serviços, 1 reserva')

  // ── EVENTOS ──
  await Promise.all([
    prisma.event.create({ data: { tenantId: seasoulTenant.id, title: 'Casamento na Praia — Família Silva', eventType: 'WEDDING', location: 'Terraço Cabo Ledo', startDate: new Date('2026-05-10'), endDate: new Date('2026-05-11'), maxCapacity: 120, price: new Decimal('250000'), status: 'CONFIRMED', organizer: 'Receção' } }),
    prisma.event.create({ data: { tenantId: seasoulTenant.id, title: 'Jantar de Gala — Fim de Ano', eventType: 'GALA', location: 'Restaurante Principal', startDate: new Date('2026-12-31'), maxCapacity: 80, price: new Decimal('35000'), status: 'PLANNED', organizer: 'F&B Manager' } }),
  ])
  console.log('✅ Eventos: 2 eventos')

  // ── CONTABILIDADE (Sea & Soul) ──
  await Promise.all([
    prisma.accountingEntry.create({ data: { tenantId: seasoulTenant.id, entryNumber: 'LC-2026-001', date: new Date('2026-03-01'), description: 'Receita Alojamento — Março', account: '71.1.1', debit: new Decimal('0'), credit: new Decimal('4250000'), category: 'REVENUE', reference: 'FT' } }),
    prisma.accountingEntry.create({ data: { tenantId: seasoulTenant.id, entryNumber: 'LC-2026-002', date: new Date('2026-03-01'), description: 'Receita Restaurante & Bar — Março', account: '71.1.2', debit: new Decimal('0'), credit: new Decimal('1380000'), category: 'REVENUE', reference: 'FT' } }),
    prisma.accountingEntry.create({ data: { tenantId: seasoulTenant.id, entryNumber: 'LC-2026-003', date: new Date('2026-03-01'), description: 'Receita Spa & Atividades — Março', account: '71.1.3', debit: new Decimal('0'), credit: new Decimal('520000'), category: 'REVENUE', reference: 'FT' } }),
    prisma.accountingEntry.create({ data: { tenantId: seasoulTenant.id, entryNumber: 'LC-2026-004', date: new Date('2026-03-05'), description: 'Salários Colaboradores — Março', account: '63.1.1', debit: new Decimal('1980000'), credit: new Decimal('0'), category: 'EXPENSE' } }),
    prisma.accountingEntry.create({ data: { tenantId: seasoulTenant.id, entryNumber: 'LC-2026-005', date: new Date('2026-03-10'), description: 'Compras de Alimentos & Bebidas', account: '62.1.1', debit: new Decimal('420000'), credit: new Decimal('0'), category: 'EXPENSE' } }),
    prisma.accountingEntry.create({ data: { tenantId: seasoulTenant.id, entryNumber: 'LC-2026-006', date: new Date('2026-03-15'), description: 'Manutenção e Reparações', account: '62.3.1', debit: new Decimal('185000'), credit: new Decimal('0'), category: 'EXPENSE' } }),
    prisma.accountingEntry.create({ data: { tenantId: seasoulTenant.id, entryNumber: 'LC-2026-007', date: new Date('2026-03-20'), description: 'Eletricidade & Água — Março', account: '62.5.1', debit: new Decimal('320000'), credit: new Decimal('0'), category: 'EXPENSE' } }),
    prisma.accountingEntry.create({ data: { tenantId: seasoulTenant.id, entryNumber: 'LC-2026-008', date: new Date('2026-03-28'), description: 'Receita Loja do Resort', account: '71.2.1', debit: new Decimal('0'), credit: new Decimal('156000'), category: 'REVENUE', reference: 'FT' } }),
  ])
  console.log('✅ Contabilidade: 8 lançamentos')

  // ── ATIVIDADES ──
  const activity = await prisma.activity.create({ data: { tenantId: seasoulTenant.id, name: 'Surf em Cabo Ledo', category: 'WATER', duration: 120, maxParticipants: 8, price: new Decimal('12000'), difficulty: 'MODERATE', status: 'ACTIVE', location: 'Praia de Cabo Ledo' } })
  await prisma.activity.create({ data: { tenantId: seasoulTenant.id, name: 'Trilho do Miradouro', category: 'NATURE', duration: 180, maxParticipants: 15, price: new Decimal('8000'), difficulty: 'EASY', status: 'ACTIVE' } })
  await prisma.activityBooking.create({ data: { tenantId: seasoulTenant.id, activityId: activity.id, clientName: 'John Smith', clientEmail: 'john@email.com', participants: 3, date: new Date('2026-04-10T08:00:00'), totalPrice: new Decimal('36000'), status: 'CONFIRMED' } })
  await prisma.activity.create({ data: { tenantId: seasoulTenant.id, name: 'Passeio de Barco ao Pôr do Sol', category: 'WATER', duration: 150, maxParticipants: 12, price: new Decimal('20000'), difficulty: 'EASY', status: 'ACTIVE', location: 'Marina Cabo Ledo' } })
  await Promise.all([
    prisma.activityBooking.create({ data: { tenantId: seasoulTenant.id, activityId: activity.id, clientName: 'Sofia Fernandes', clientPhone: '+244 923 100 002', participants: 2, date: new Date('2026-04-12T07:00:00'), totalPrice: new Decimal('24000'), status: 'BOOKED' } }),
    prisma.activityBooking.create({ data: { tenantId: seasoulTenant.id, activityId: activity.id, clientName: 'Roberto Almeida', participants: 1, date: new Date('2026-04-15T09:00:00'), totalPrice: new Decimal('12000'), status: 'CONFIRMED' } }),
  ])
  console.log('✅ Atividades: 3 atividades, 3 reservas')

  // ── LOJA DO RESORT ──
  const store = await prisma.retailStore.create({ data: { tenantId: seasoulTenant.id, name: 'Loja Sea & Soul — Cabo Ledo', code: 'LJ-CL-01', address: 'Hall Receção, Cabo Ledo Resort', city: 'Cabo Ledo', manager: 'Maria Silva', openTime: '08:00', closeTime: '20:00' } })
  await prisma.retailSale.create({ data: { tenantId: seasoulTenant.id, storeId: store.id, saleNumber: 'VND-001', clientName: 'John Smith', items: [{ name: 'T-shirt Sea and Soul', qty: 2, price: 3500, total: 7000 }, { name: 'Chapéu de Praia', qty: 1, price: 2500, total: 2500 }], subtotal: new Decimal('9500'), taxAmount: new Decimal('1330'), discount: new Decimal('0'), totalAmount: new Decimal('10830'), paymentMethod: 'CARD' } })
  const store2 = await prisma.retailStore.create({ data: { tenantId: seasoulTenant.id, name: 'Loja Sea & Soul — Sangano', code: 'LJ-SG-01', address: 'Receção Sangano Resort', city: 'Sangano', manager: 'Gabriel Santos', openTime: '08:00', closeTime: '20:00' } })
  await Promise.all([
    prisma.retailSale.create({ data: { tenantId: seasoulTenant.id, storeId: store.id, saleNumber: 'VND-002', clientName: 'Sofia Fernandes', items: [{ name: 'Protetor Solar SPF50', qty: 2, price: 4000, total: 8000 }], subtotal: new Decimal('8000'), taxAmount: new Decimal('1120'), discount: new Decimal('0'), totalAmount: new Decimal('9120'), paymentMethod: 'CASH' } }),
    prisma.retailSale.create({ data: { tenantId: seasoulTenant.id, storeId: store.id, saleNumber: 'VND-003', clientName: 'Roberto Almeida', items: [{ name: 'T-shirt Sea and Soul', qty: 1, price: 3500, total: 3500 }, { name: 'Garrafa Personalizada', qty: 1, price: 2000, total: 2000 }], subtotal: new Decimal('5500'), taxAmount: new Decimal('770'), discount: new Decimal('0'), totalAmount: new Decimal('6270'), paymentMethod: 'ROOM_CHARGE' } }),
    prisma.retailSale.create({ data: { tenantId: seasoulTenant.id, storeId: store2.id, saleNumber: 'VND-004', clientName: 'Marie Dupont', items: [{ name: 'Chapéu de Praia', qty: 2, price: 2500, total: 5000 }], subtotal: new Decimal('5000'), taxAmount: new Decimal('700'), discount: new Decimal('0'), totalAmount: new Decimal('5700'), paymentMethod: 'CARD' } }),
  ])
  console.log('✅ Loja do Resort: 2 lojas, 4 vendas')

  // ── FATURAÇÃO (Sea & Soul) ──
  const ftSeries = await prisma.invoiceSeries.create({ data: { tenantId: seasoulTenant.id, documentType: 'FT', series: 'A', prefix: 'FT A', lastNumber: 0 } })
  await prisma.invoiceSeries.create({ data: { tenantId: seasoulTenant.id, documentType: 'FR', series: 'A', prefix: 'FR A', lastNumber: 0 } })
  const ncSeries = await prisma.invoiceSeries.create({ data: { tenantId: seasoulTenant.id, documentType: 'NC', series: 'A', prefix: 'NC A', lastNumber: 0 } })
  // Série TREINO
  await prisma.invoiceSeries.create({ data: { tenantId: seasoulTenant.id, documentType: 'FT', series: 'TREINO', prefix: 'FT-TREINO', lastNumber: 0, isTraining: true } })

  // ── SÉRIES DE FATURAÇÃO AGT ───────────────────────────────────────────────
  console.log('Criar séries de faturação por resort...')

  const invoiceSeriesData = [
    // Cabo Ledo — série principal
    { tenantId: seasoulTenant.id, resortId: caboLedo.id, documentType: 'FT'  as const, series: 'A', prefix: 'FT A',       lastNumber: 0 },
    { tenantId: seasoulTenant.id, resortId: caboLedo.id, documentType: 'FR'  as const, series: 'A', prefix: 'FR A',       lastNumber: 0 },
    { tenantId: seasoulTenant.id, resortId: caboLedo.id, documentType: 'NC'  as const, series: 'A', prefix: 'NC A',       lastNumber: 0 },
    { tenantId: seasoulTenant.id, resortId: caboLedo.id, documentType: 'ORC' as const, series: 'A', prefix: 'ORC A',      lastNumber: 0 },
    { tenantId: seasoulTenant.id, resortId: caboLedo.id, documentType: 'FT'  as const, series: 'T', prefix: 'FT-TREINO T',lastNumber: 0, isTraining: true },
    // Sangano — série principal
    { tenantId: seasoulTenant.id, resortId: sangano.id,  documentType: 'FT'  as const, series: 'B', prefix: 'FT B',       lastNumber: 0 },
    { tenantId: seasoulTenant.id, resortId: sangano.id,  documentType: 'FR'  as const, series: 'B', prefix: 'FR B',       lastNumber: 0 },
    { tenantId: seasoulTenant.id, resortId: sangano.id,  documentType: 'NC'  as const, series: 'B', prefix: 'NC B',       lastNumber: 0 },
    { tenantId: seasoulTenant.id, resortId: sangano.id,  documentType: 'ORC' as const, series: 'B', prefix: 'ORC B',      lastNumber: 0 },
    { tenantId: seasoulTenant.id, resortId: sangano.id,  documentType: 'FT'  as const, series: 'U', prefix: 'FT-TREINO U',lastNumber: 0, isTraining: true },
  ]

  for (const s of invoiceSeriesData) {
    await prisma.invoiceSeries.upsert({
      where: { tenantId_documentType_series: { tenantId: s.tenantId, documentType: s.documentType, series: s.series } },
      update: {},
      create: s,
    })
  }
  console.log(`✓ ${invoiceSeriesData.length} séries de faturação por resort criadas`)

  // Fatura alojamento — Roberto Almeida (4 noites)
  const inv1 = await prisma.invoice.create({ data: { tenantId: seasoulTenant.id, seriesId: ftSeries.id, documentType: 'FT', number: 1, fullNumber: 'FT A/00001', clientName: 'Roberto Almeida', subtotal: new Decimal('100000'), taxAmount: new Decimal('14000'), totalAmount: new Decimal('114000'), currency: 'AOA', paymentMethod: 'CARD' } })
  await prisma.invoiceItem.create({ data: { invoiceId: inv1.id, description: 'Alojamento — Quarto 101 (4 noites × 25.000 KZ)', quantity: new Decimal('4'), unitPrice: new Decimal('25000'), taxRate: new Decimal('14'), discount: new Decimal('0'), total: new Decimal('100000') } })

  // Fatura alojamento — John Smith (7 noites suite)
  const inv2 = await prisma.invoice.create({ data: { tenantId: seasoulTenant.id, seriesId: ftSeries.id, documentType: 'FT', number: 2, fullNumber: 'FT A/00002', clientName: 'John Smith', subtotal: new Decimal('525000'), taxAmount: new Decimal('73500'), totalAmount: new Decimal('598500'), currency: 'AOA', paymentMethod: 'CARD' } })
  await Promise.all([
    prisma.invoiceItem.create({ data: { invoiceId: inv2.id, description: 'Alojamento — Suite 301 (7 noites × 75.000 KZ)', quantity: new Decimal('7'), unitPrice: new Decimal('75000'), taxRate: new Decimal('14'), discount: new Decimal('0'), total: new Decimal('525000') } }),
  ])

  // Fatura consumos restaurante
  const inv3 = await prisma.invoice.create({ data: { tenantId: seasoulTenant.id, seriesId: ftSeries.id, documentType: 'FT', number: 3, fullNumber: 'FT A/00003', clientName: 'John Smith', subtotal: new Decimal('32600'), taxAmount: new Decimal('4564'), totalAmount: new Decimal('37164'), currency: 'AOA', paymentMethod: 'ROOM_CHARGE' } })
  await Promise.all([
    prisma.invoiceItem.create({ data: { invoiceId: inv3.id, description: 'Lagosta Grelhada', quantity: new Decimal('2'), unitPrice: new Decimal('12000'), taxRate: new Decimal('14'), discount: new Decimal('0'), total: new Decimal('24000') } }),
    prisma.invoiceItem.create({ data: { invoiceId: inv3.id, description: 'Cerveja Cuca', quantity: new Decimal('4'), unitPrice: new Decimal('800'), taxRate: new Decimal('14'), discount: new Decimal('0'), total: new Decimal('3200') } }),
    prisma.invoiceItem.create({ data: { invoiceId: inv3.id, description: 'Caipirinha', quantity: new Decimal('2'), unitPrice: new Decimal('2500'), taxRate: new Decimal('14'), discount: new Decimal('0'), total: new Decimal('5000') } }),
    prisma.invoiceItem.create({ data: { invoiceId: inv3.id, description: 'Pudim', quantity: new Decimal('2'), unitPrice: new Decimal('1500'), taxRate: new Decimal('14'), discount: new Decimal('0'), total: new Decimal('3000') } }),
  ])

  // Fatura spa
  const inv4 = await prisma.invoice.create({ data: { tenantId: seasoulTenant.id, seriesId: ftSeries.id, documentType: 'FT', number: 4, fullNumber: 'FT A/00004', clientName: 'Sofia Fernandes', subtotal: new Decimal('15000'), taxAmount: new Decimal('2100'), totalAmount: new Decimal('17100'), currency: 'AOA', paymentMethod: 'CARD' } })
  await prisma.invoiceItem.create({ data: { invoiceId: inv4.id, description: 'Massagem Relaxante 60min', quantity: new Decimal('1'), unitPrice: new Decimal('15000'), taxRate: new Decimal('14'), discount: new Decimal('0'), total: new Decimal('15000') } })

  // Nota de crédito (cancelamento parcial)
  const nc1 = await prisma.invoice.create({ data: { tenantId: seasoulTenant.id, seriesId: ncSeries.id, documentType: 'NC', number: 1, fullNumber: 'NC A/00001', clientName: 'Roberto Almeida', subtotal: new Decimal('50000'), taxAmount: new Decimal('7000'), totalAmount: new Decimal('57000'), currency: 'AOA', relatedInvoiceId: inv1.id, notes: 'Devolução depósito — alteração de datas' } })
  await prisma.invoiceItem.create({ data: { invoiceId: nc1.id, description: 'Crédito — depósito devolvido', quantity: new Decimal('1'), unitPrice: new Decimal('50000'), taxRate: new Decimal('14'), discount: new Decimal('0'), total: new Decimal('50000') } })

  await prisma.invoiceSeries.update({ where: { id: ftSeries.id }, data: { lastNumber: 4 } })
  await prisma.invoiceSeries.update({ where: { id: ncSeries.id }, data: { lastNumber: 1 } })
  console.log('✅ Faturação: 4 séries, 4 faturas + 1 nota de crédito')

  // ── RESUMO FINAL ──
  console.log('')
  console.log('🎉 Seed ENGERIS ONE completo!')
  console.log('═══════════════════════════════════════')
  console.log(`   Tenants:        2 (ENGERIS + Sea & Soul)`)
  console.log(`   Módulos:        ${MODULE_CATALOG.length} (hotelaria & restauração)`)
  console.log(`   Filiais:        5`)
  console.log(`   Resorts:        2 (Cabo Ledo + Sangano)`)
  console.log(`   Utilizadores:   ${users.length + 3}`)
  console.log(`   Quartos:        ${createdRooms.length}`)
  console.log(`   Tarifas:        ${tariffs.length}`)
  console.log(`   Produtos:       ${products.length}`)
  console.log(`   Fornecedores:   ${suppliers.length}`)
  console.log(`   Stock:          ${stockItems.length}`)
  console.log(`   Colaboradores:  ${employees.length}`)
  console.log(`   Hóspedes:       ${guests.length}`)
  console.log(`   Reservas:       ${reservations.length}`)
  console.log(`   Segurança:      2 incidentes, 2 patrulhas`)
  console.log(`   Spa:            2 serviços, 1 reserva`)
  console.log(`   Atividades:     3 atividades, 3 reservas`)
  console.log(`   Eventos:        2 eventos`)
  console.log(`   Retalho:        2 lojas, 4 vendas`)
  console.log(`   Contabilidade:  8 lançamentos`)
  console.log(`   Faturação:      4 séries globais + 10 séries por resort, 4 faturas + 1 NC`)
  console.log('═══════════════════════════════════════')
  console.log('')
  console.log('Credenciais:')
  console.log('  Super Admin:  admin@engeris.ao')
  console.log('  Admin S&S:    admin@seasoul.ao')
  console.log('  Gestor:       gestor@engeris.ao')
  console.log('  (Passwords placeholder — usar /v1/auth/register)')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
