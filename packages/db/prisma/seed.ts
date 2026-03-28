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
    // Bar
    prisma.product.create({ data: { name: 'Cerveja Cuca', category: 'Bebidas', department: 'BAR', unitPrice: new Decimal('800'), taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Cerveja Nocal', category: 'Bebidas', department: 'BAR', unitPrice: new Decimal('800'), taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Água Mineral 0.5L', category: 'Bebidas', department: 'BAR', unitPrice: new Decimal('300'), taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Sumo Natural', category: 'Bebidas', department: 'BAR', unitPrice: new Decimal('1200'), taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Caipirinha', category: 'Cocktails', department: 'BAR', unitPrice: new Decimal('2500'), taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Mojito', category: 'Cocktails', department: 'BAR', unitPrice: new Decimal('2800'), taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Whisky Dose', category: 'Bebidas Espirituosas', department: 'BAR', unitPrice: new Decimal('3500'), taxRate: new Decimal('14') } }),
    // Restaurante
    prisma.product.create({ data: { name: 'Peixe Grelhado', category: 'Pratos Principais', department: 'RESTAURANTE', unitPrice: new Decimal('5500'), taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Lagosta', category: 'Pratos Principais', department: 'RESTAURANTE', unitPrice: new Decimal('12000'), taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Muamba de Galinha', category: 'Pratos Principais', department: 'RESTAURANTE', unitPrice: new Decimal('4500'), taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Calulu de Peixe', category: 'Pratos Principais', department: 'RESTAURANTE', unitPrice: new Decimal('4800'), taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Bife com Batatas', category: 'Pratos Principais', department: 'RESTAURANTE', unitPrice: new Decimal('6000'), taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Salada Mista', category: 'Entradas', department: 'RESTAURANTE', unitPrice: new Decimal('1800'), taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Sopa do Dia', category: 'Entradas', department: 'RESTAURANTE', unitPrice: new Decimal('1200'), taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Pudim', category: 'Sobremesas', department: 'RESTAURANTE', unitPrice: new Decimal('1500'), taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Gelado 2 Bolas', category: 'Sobremesas', department: 'RESTAURANTE', unitPrice: new Decimal('1200'), taxRate: new Decimal('14') } }),
    // SPA
    prisma.product.create({ data: { name: 'Massagem Relaxante 60min', category: 'Massagens', department: 'SPA', unitPrice: new Decimal('15000'), taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Massagem Desportiva 45min', category: 'Massagens', department: 'SPA', unitPrice: new Decimal('12000'), taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Tratamento Facial', category: 'Tratamentos', department: 'SPA', unitPrice: new Decimal('10000'), taxRate: new Decimal('14') } }),
    // Atividades
    prisma.product.create({ data: { name: 'Aula de Surf 1h', category: 'Desportos Aquáticos', department: 'ATIVIDADES', unitPrice: new Decimal('8000'), taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Aluguer Kayak 1h', category: 'Desportos Aquáticos', department: 'ATIVIDADES', unitPrice: new Decimal('5000'), taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Passeio de Barco', category: 'Excursões', department: 'ATIVIDADES', unitPrice: new Decimal('20000'), taxRate: new Decimal('14') } }),
    // Loja
    prisma.product.create({ data: { name: 'T-shirt Sea and Soul', category: 'Merchandising', department: 'LOJA', unitPrice: new Decimal('3500'), taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Protetor Solar SPF50', category: 'Utilidades', department: 'LOJA', unitPrice: new Decimal('4000'), taxRate: new Decimal('14') } }),
    prisma.product.create({ data: { name: 'Chapéu de Praia', category: 'Merchandising', department: 'LOJA', unitPrice: new Decimal('2500'), taxRate: new Decimal('14') } }),
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

  // ── SEGURANÇA ELETRÓNICA ──
  const t = engeris.id
  await Promise.all([
    prisma.securityContract.create({ data: { tenantId: t, clientName: 'Banco BAI', contractType: 'MONITORING', monthlyValue: new Decimal('450000'), startDate: new Date('2025-01-01'), endDate: new Date('2027-12-31'), status: 'ACTIVE', notes: 'Monitorização 24/7 — Agência Talatona' } }),
    prisma.securityContract.create({ data: { tenantId: t, clientName: 'Sonangol EP', contractType: 'MIXED', monthlyValue: new Decimal('1200000'), startDate: new Date('2025-03-01'), status: 'ACTIVE', notes: 'CCTV + Controlo de Acesso — Terminal Luanda' } }),
    prisma.securityContract.create({ data: { tenantId: t, clientName: 'Condomínio Talatona', contractType: 'PATROL', monthlyValue: new Decimal('280000'), startDate: new Date('2024-06-01'), endDate: new Date('2025-05-31'), status: 'EXPIRED', notes: 'Patrulha Noturna' } }),
  ])
  await Promise.all([
    prisma.securityIncident.create({ data: { tenantId: t, title: 'Alarme disparado — Zona B', type: 'ALARM_TRIGGER', severity: 'MEDIUM', status: 'RESOLVED', location: 'Agência Talatona, Zona B', description: 'Falso alarme causado por animal' } }),
    prisma.securityIncident.create({ data: { tenantId: t, title: 'Tentativa de intrusão', type: 'INTRUSION', severity: 'HIGH', status: 'INVESTIGATING', location: 'Terminal Luanda, Portão 3', description: 'Detetado indivíduo não autorizado no perímetro' } }),
  ])
  // Instalações de segurança
  const secContracts = await prisma.securityContract.findMany({ where: { tenantId: t }, take: 2 })
  if (secContracts.length > 0) {
    await Promise.all([
      prisma.securityInstallation.create({ data: { tenantId: t, contractId: secContracts[0].id, clientName: 'Banco BAI', address: 'Agência Talatona, Luanda', installationType: 'CCTV', scheduledDate: new Date('2025-02-15'), status: 'COMPLETED', notes: 'Câmara PTZ exterior — entrada principal', equipmentList: [{ name: 'Câmara Hikvision PTZ', qty: 4 }, { name: 'NVR 16ch', qty: 1 }] } }),
      prisma.securityInstallation.create({ data: { tenantId: t, contractId: secContracts[0].id, clientName: 'Banco BAI', address: 'Agência Talatona — Zona Cofre', installationType: 'ALARM', scheduledDate: new Date('2025-03-01'), status: 'COMPLETED', notes: 'Central de alarme wireless', equipmentList: [{ name: 'Central Ajax Hub', qty: 1 }, { name: 'Sensor PIR', qty: 8 }] } }),
      prisma.securityInstallation.create({ data: { tenantId: t, contractId: secContracts[1].id, clientName: 'Sonangol EP', address: 'Terminal Luanda — Portão Principal', installationType: 'ACCESS_CONTROL', scheduledDate: new Date('2025-04-01'), status: 'IN_PROGRESS', notes: 'Controlo de acesso biométrico', equipmentList: [{ name: 'Leitor Biométrico ZKTeco', qty: 6 }, { name: 'Torniquete', qty: 2 }] } }),
    ])
  }
  // Patrulhas
  await Promise.all([
    prisma.securityPatrol.create({ data: { tenantId: t, guardName: 'Eduardo Fonseca', guardId: 'EF-001', route: 'Rota A — Perímetro Norte', startedAt: new Date('2026-03-26T20:00:00'), endedAt: new Date('2026-03-27T04:00:00'), status: 'COMPLETED', checkpoints: [{ point: 'Portão Norte', time: '20:15', ok: true }, { point: 'Estacionamento', time: '21:00', ok: true }, { point: 'Edifício B', time: '22:30', ok: true }] } }),
    prisma.securityPatrol.create({ data: { tenantId: t, guardName: 'Manuel Segurança', guardId: 'MS-002', route: 'Rota B — Perímetro Sul', startedAt: new Date('2026-03-27T20:00:00'), status: 'IN_PROGRESS', checkpoints: [{ point: 'Portão Sul', time: '20:10', ok: true }] } }),
  ])
  console.log('✅ Segurança: 3 contratos, 2 incidentes, 3 instalações, 2 patrulhas')

  // ── ENGENHARIA ──
  const engProject = await prisma.engineeringProject.create({ data: { tenantId: t, name: 'Edifício Comercial Talatona', clientName: 'Imobiliária Angola', projectType: 'CONSTRUCTION', budget: new Decimal('85000000'), startDate: new Date('2025-02-01'), estimatedEnd: new Date('2026-08-01'), status: 'IN_PROGRESS', address: 'Talatona, Luanda' } })
  await prisma.engineeringProject.create({ data: { tenantId: t, name: 'Renovação Hotel Marginal', clientName: 'Hotel Marginal SA', projectType: 'RENOVATION', budget: new Decimal('12000000'), startDate: new Date('2025-06-01'), estimatedEnd: new Date('2025-12-01'), status: 'PLANNING', address: 'Marginal de Luanda' } })
  await prisma.constructionWork.create({ data: { tenantId: t, projectId: engProject.id, name: 'Fundações', description: 'Escavação e fundações profundas', startDate: new Date('2025-02-15'), status: 'COMPLETED', progress: 100 } })
  await prisma.constructionWork.create({ data: { tenantId: t, projectId: engProject.id, name: 'Estrutura Piso 1-5', description: 'Betão armado pisos 1 a 5', startDate: new Date('2025-05-01'), status: 'IN_PROGRESS', progress: 65 } })
  await prisma.budgetItem.create({ data: { tenantId: t, projectId: engProject.id, description: 'Betão C30/37', unit: 'm³', quantity: new Decimal('450'), unitPrice: new Decimal('35000'), total: new Decimal('15750000') } })
  // Mais orçamentos e autos de medição
  await Promise.all([
    prisma.budgetItem.create({ data: { tenantId: t, projectId: engProject.id, description: 'Aço A500', unit: 'kg', quantity: new Decimal('12000'), unitPrice: new Decimal('650'), total: new Decimal('7800000') } }),
    prisma.budgetItem.create({ data: { tenantId: t, projectId: engProject.id, description: 'Cofragem', unit: 'm²', quantity: new Decimal('800'), unitPrice: new Decimal('4500'), total: new Decimal('3600000') } }),
    prisma.budgetItem.create({ data: { tenantId: t, projectId: engProject.id, description: 'Mão de Obra — Pedreiros', unit: 'dia', quantity: new Decimal('200'), unitPrice: new Decimal('8000'), total: new Decimal('1600000') } }),
  ])
  await prisma.workMeasurement.create({ data: { tenantId: t, projectId: engProject.id, number: 1, period: 'Maio 2025', items: [{ description: 'Escavação', qty: 150, unit: 'm³', unitPrice: 3500, total: 525000 }, { description: 'Betão fundações', qty: 80, unit: 'm³', unitPrice: 35000, total: 2800000 }], subtotal: new Decimal('3325000'), taxAmount: new Decimal('465500'), totalAmount: new Decimal('3790500'), approvedBy: 'Eng. Paulo Gestor', approvedAt: new Date('2025-06-01') } })
  await prisma.workMeasurement.create({ data: { tenantId: t, projectId: engProject.id, number: 2, period: 'Julho 2025', items: [{ description: 'Betão pisos 1-3', qty: 200, unit: 'm³', unitPrice: 35000, total: 7000000 }, { description: 'Aço', qty: 8000, unit: 'kg', unitPrice: 650, total: 5200000 }], subtotal: new Decimal('12200000'), taxAmount: new Decimal('1708000'), totalAmount: new Decimal('13908000') } })
  console.log('✅ Engenharia: 2 projetos, 2 obras, 4 orçamentos, 2 medições')

  // ── ELETRICIDADE ──
  const elecProject = await prisma.electricalProject.create({ data: { tenantId: t, name: 'Instalação Elétrica — Edifício Talatona', clientName: 'Imobiliária Angola', projectType: 'NEW_INSTALLATION', voltageLevel: 'LOW', budget: new Decimal('8500000'), startDate: new Date('2025-04-01'), status: 'IN_PROGRESS', address: 'Talatona, Luanda' } })
  await prisma.electricalInspection.create({ data: { tenantId: t, projectId: elecProject.id, address: 'Talatona, Luanda — Piso 3', clientName: 'Imobiliária Angola', inspectionType: 'INITIAL', scheduledDate: new Date('2025-07-15'), inspectorName: 'Eng. Fernando Dias', status: 'SCHEDULED' } })
  await prisma.electricalCertification.create({ data: { tenantId: t, projectId: elecProject.id, clientName: 'Imobiliária Angola', address: 'Talatona, Luanda', certType: 'INSTALLATION_CERT', status: 'PENDING' } })
  console.log('✅ Eletricidade: 1 projeto, 1 inspeção, 1 certificação')

  // ── CRM ──
  const client1 = await prisma.client.create({ data: { tenantId: t, name: 'Banco BAI', nif: '5401234567', type: 'COMPANY', email: 'contratos@bai.ao', phone: '+244 222 111 222', address: 'Largo do Kinaxixi, Luanda' } })
  const client2 = await prisma.client.create({ data: { tenantId: t, name: 'Sonangol EP', nif: '5409876543', type: 'COMPANY', email: 'procurement@sonangol.co.ao', phone: '+244 222 333 444' } })
  await prisma.client.create({ data: { tenantId: t, name: 'João Almeida', nif: '0012345678', type: 'INDIVIDUAL', phone: '+244 923 555 111', email: 'joao.almeida@gmail.com' } })
  await prisma.client.create({ data: { tenantId: t, name: 'Governo Provincial Benguela', type: 'GOVERNMENT', phone: '+244 272 222 333' } })
  await Promise.all([
    prisma.deal.create({ data: { tenantId: t, clientId: client1.id, title: 'CCTV Agências Norte', stage: 'PROPOSAL', value: new Decimal('15000000'), probability: 60, assignedTo: 'Paulo Gestor' } }),
    prisma.deal.create({ data: { tenantId: t, clientId: client2.id, title: 'Manutenção Elétrica Refinaria', stage: 'NEGOTIATION', value: new Decimal('45000000'), probability: 75, assignedTo: 'Paulo Gestor' } }),
    prisma.deal.create({ data: { tenantId: t, clientId: client1.id, title: 'Upgrade Alarmes Sede', stage: 'WON', value: new Decimal('3500000'), probability: 100 } }),
  ])
  console.log('✅ CRM: 4 clientes, 3 deals')

  // ── FROTAS ──
  const v1 = await prisma.vehicle.create({ data: { tenantId: t, plate: 'LD-45-89-AB', brand: 'Toyota', model: 'Hilux', year: 2023, type: 'VAN', fuelType: 'DIESEL', mileage: 45200, status: 'AVAILABLE' } })
  await prisma.vehicle.create({ data: { tenantId: t, plate: 'LD-78-12-CD', brand: 'Mitsubishi', model: 'L200', year: 2024, type: 'VAN', fuelType: 'DIESEL', mileage: 12300, status: 'AVAILABLE' } })
  await prisma.vehicle.create({ data: { tenantId: t, plate: 'LD-22-33-EF', brand: 'Toyota', model: 'Corolla', year: 2022, type: 'CAR', fuelType: 'GASOLINE', mileage: 67800, status: 'MAINTENANCE' } })
  await prisma.fuelLog.create({ data: { tenantId: t, vehicleId: v1.id, date: new Date('2026-03-20'), liters: new Decimal('65'), pricePerLiter: new Decimal('350'), totalCost: new Decimal('22750'), mileage: 45200 } })
  await Promise.all([
    prisma.fuelLog.create({ data: { tenantId: t, vehicleId: v1.id, date: new Date('2026-03-10'), liters: new Decimal('70'), pricePerLiter: new Decimal('350'), totalCost: new Decimal('24500'), mileage: 44500 } }),
    prisma.fuelLog.create({ data: { tenantId: t, vehicleId: v1.id, date: new Date('2026-02-28'), liters: new Decimal('60'), pricePerLiter: new Decimal('350'), totalCost: new Decimal('21000'), mileage: 43800 } }),
    prisma.fuelLog.create({ data: { tenantId: t, vehicleId: v1.id, date: new Date('2026-02-15'), liters: new Decimal('68'), pricePerLiter: new Decimal('350'), totalCost: new Decimal('23800'), mileage: 43000 } }),
  ])
  console.log('✅ Frotas: 3 veículos, 4 abastecimentos')

  // ── CONTRATOS DE SERVIÇO ──
  await Promise.all([
    prisma.serviceContract.create({ data: { tenantId: t, clientName: 'Banco BAI', title: 'Manutenção Preventiva AVAC', contractType: 'MAINTENANCE', monthlyValue: new Decimal('350000'), startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), status: 'ACTIVE' } }),
    prisma.serviceContract.create({ data: { tenantId: t, clientName: 'UNITEL', title: 'Suporte Técnico Infraestrutura', contractType: 'SUPPORT', monthlyValue: new Decimal('520000'), startDate: new Date('2025-03-01'), status: 'ACTIVE' } }),
  ])
  console.log('✅ Contratos: 2 contratos de serviço')

  // ── SPA ──
  const spaService = await prisma.spaService.create({ data: { tenantId: t, name: 'Massagem Relaxante', category: 'MASSAGE', duration: 60, price: new Decimal('15000'), description: 'Massagem completa com óleos essenciais' } })
  await prisma.spaService.create({ data: { tenantId: t, name: 'Tratamento Facial Premium', category: 'FACIAL', duration: 45, price: new Decimal('12000') } })
  await prisma.spaBooking.create({ data: { tenantId: t, serviceId: spaService.id, clientName: 'Sofia Fernandes', clientPhone: '+244 923 100 002', date: new Date('2026-04-01T10:00:00'), totalPrice: new Decimal('15000'), status: 'CONFIRMED' } })
  console.log('✅ Spa: 2 serviços, 1 reserva')

  // ── EVENTOS ──
  await Promise.all([
    prisma.event.create({ data: { tenantId: t, title: 'Conferência ENGERIS 2026', eventType: 'CONFERENCE', location: 'Hotel EPIC Sana, Luanda', startDate: new Date('2026-06-15'), endDate: new Date('2026-06-16'), maxCapacity: 200, price: new Decimal('25000'), status: 'PLANNED', organizer: 'Marketing ENGERIS' } }),
    prisma.event.create({ data: { tenantId: t, title: 'Workshop Segurança Eletrónica', eventType: 'WORKSHOP', location: 'Sede ENGERIS', startDate: new Date('2026-05-10'), maxCapacity: 30, status: 'CONFIRMED' } }),
  ])
  console.log('✅ Eventos: 2 eventos')

  // ── IMOBILIÁRIO ──
  await Promise.all([
    prisma.property.create({ data: { tenantId: t, title: 'Apartamento T3 Talatona', propertyType: 'APARTMENT', purpose: 'SALE', address: 'Condomínio Vida Pacífica', city: 'Luanda', area: new Decimal('120'), bedrooms: 3, bathrooms: 2, price: new Decimal('45000000'), status: 'AVAILABLE', ownerName: 'Imobiliária Angola' } }),
    prisma.property.create({ data: { tenantId: t, title: 'Armazém Industrial Viana', propertyType: 'WAREHOUSE', purpose: 'RENT', address: 'Zona Industrial Viana', city: 'Luanda', area: new Decimal('500'), rentPrice: new Decimal('800000'), status: 'AVAILABLE' } }),
    prisma.property.create({ data: { tenantId: t, title: 'Terreno Kilamba', propertyType: 'LAND', purpose: 'SALE', city: 'Luanda', area: new Decimal('1000'), price: new Decimal('25000000'), status: 'RESERVED' } }),
  ])
  console.log('✅ Imobiliário: 3 imóveis')

  // ── LOGÍSTICA ──
  await Promise.all([
    prisma.shipment.create({ data: { tenantId: t, trackingCode: 'ENG-2026-001', origin: 'Luanda', destination: 'Benguela', clientName: 'Ferro Angola', shipmentType: 'PALLET', weight: new Decimal('1200'), status: 'IN_TRANSIT', estimatedDelivery: new Date('2026-04-02'), cost: new Decimal('180000') } }),
    prisma.shipment.create({ data: { tenantId: t, trackingCode: 'ENG-2026-002', origin: 'Luanda', destination: 'Cabinda', clientName: 'SONANGOL', shipmentType: 'CONTAINER', weight: new Decimal('5000'), status: 'PENDING', cost: new Decimal('750000') } }),
  ])
  console.log('✅ Logística: 2 envios')

  // ── EDUCAÇÃO ──
  const course = await prisma.course.create({ data: { tenantId: t, name: 'Segurança em Instalações Elétricas', code: 'SEG-ELEC-01', category: 'SAFETY', instructor: 'Eng. Fernando Dias', duration: 40, maxStudents: 20, price: new Decimal('75000'), status: 'ACTIVE' } })
  await prisma.course.create({ data: { tenantId: t, name: 'Gestão de Projetos', code: 'GP-01', category: 'MANAGEMENT', instructor: 'Dr. Ana Mendes', duration: 60, price: new Decimal('120000') } })
  await prisma.enrollment.create({ data: { tenantId: t, courseId: course.id, studentName: 'Marco Técnico', studentEmail: 'tecnico@engeris.ao', status: 'IN_PROGRESS' } })
  await Promise.all([
    prisma.enrollment.create({ data: { tenantId: t, courseId: course.id, studentName: 'Eduardo Fonseca', studentEmail: 'seguranca@engeris.ao', status: 'ENROLLED' } }),
    prisma.enrollment.create({ data: { tenantId: t, courseId: course.id, studentName: 'Ana Instaladora', studentEmail: 'ana@engeris.ao', status: 'COMPLETED', completedAt: new Date('2026-02-28'), grade: new Decimal('16.5') } }),
    prisma.enrollment.create({ data: { tenantId: t, courseId: course.id, studentName: 'Pedro Eletricista', status: 'IN_PROGRESS' } }),
  ])
  console.log('✅ Educação: 2 cursos, 4 inscrições')

  // ── SAÚDE ──
  const patient = await prisma.patient.create({ data: { tenantId: t, name: 'António Luís', phone: '+244 923 456 789', gender: 'M', bloodType: 'A+' } })
  await prisma.appointment.create({ data: { tenantId: t, patientId: patient.id, doctorName: 'Dr. Maria Santos', specialty: 'GENERAL', date: new Date('2026-04-05T09:00:00'), duration: 30, status: 'SCHEDULED', cost: new Decimal('8000') } })
  const patient2 = await prisma.patient.create({ data: { tenantId: t, name: 'Beatriz Martins', phone: '+244 923 111 222', email: 'beatriz@email.com', gender: 'F', bloodType: 'O+', allergies: 'Penicilina' } })
  const patient3 = await prisma.patient.create({ data: { tenantId: t, name: 'Carlos Mendes', phone: '+244 923 333 444', gender: 'M', bloodType: 'B-' } })
  await Promise.all([
    prisma.appointment.create({ data: { tenantId: t, patientId: patient.id, doctorName: 'Dr. Maria Santos', specialty: 'CARDIOLOGY', date: new Date('2026-04-12T10:00:00'), duration: 45, status: 'SCHEDULED', cost: new Decimal('15000') } }),
    prisma.appointment.create({ data: { tenantId: t, patientId: patient2.id, doctorName: 'Dr. José Lima', specialty: 'DENTAL', date: new Date('2026-04-08T14:00:00'), duration: 30, status: 'CONFIRMED', cost: new Decimal('12000') } }),
    prisma.appointment.create({ data: { tenantId: t, patientId: patient2.id, doctorName: 'Dr. Maria Santos', specialty: 'GENERAL', date: new Date('2026-03-20T09:00:00'), duration: 30, status: 'COMPLETED', cost: new Decimal('8000'), diagnosis: 'Gripe sazonal', prescription: 'Paracetamol 1g 3x/dia' } }),
    prisma.appointment.create({ data: { tenantId: t, patientId: patient3.id, doctorName: 'Dra. Ana Fisio', specialty: 'PHYSIOTHERAPY', date: new Date('2026-04-15T11:00:00'), duration: 60, status: 'SCHEDULED', cost: new Decimal('18000') } }),
  ])
  console.log('✅ Saúde: 3 pacientes, 5 consultas')

  // ── AGRICULTURA ──
  const farm = await prisma.farm.create({ data: { tenantId: t, name: 'Fazenda Bengo', location: 'Bengo', totalArea: new Decimal('150') } })
  await prisma.crop.create({ data: { tenantId: t, farmId: farm.id, name: 'Milho', variety: 'Híbrido', area: new Decimal('50'), plantedDate: new Date('2026-01-15'), status: 'GROWING' } })
  await prisma.crop.create({ data: { tenantId: t, farmId: farm.id, name: 'Mandioca', area: new Decimal('30'), plantedDate: new Date('2025-11-01'), status: 'READY' } })
  await prisma.harvest.create({ data: { tenantId: t, farmId: farm.id, cropName: 'Café', quantity: new Decimal('2500'), unit: 'kg', quality: 'A', harvestDate: new Date('2026-02-20'), revenue: new Decimal('3750000') } })
  console.log('✅ Agricultura: 1 fazenda, 2 culturas, 1 colheita')

  // ── MANUFATURA ──
  await prisma.productionOrder.create({ data: { tenantId: t, orderNumber: 'OP-2026-001', productName: 'Quadro Elétrico 400V', quantity: new Decimal('25'), priority: 'HIGH', status: 'IN_PRODUCTION', startDate: new Date('2026-03-15'), expectedEnd: new Date('2026-04-15'), cost: new Decimal('2500000'), supervisor: 'Carlos Mendes' } })
  console.log('✅ Manufatura: 1 ordem de produção')

  // ── CONSULTORIA ──
  const consulting = await prisma.consultingProject.create({ data: { tenantId: t, title: 'Auditoria Energética — Sonangol', clientName: 'Sonangol EP', projectType: 'AUDIT', startDate: new Date('2026-02-01'), budget: new Decimal('8000000'), hourlyRate: new Decimal('50000'), status: 'ACTIVE', teamLead: 'Eng. Paulo Gestor' } })
  await prisma.timeLog.create({ data: { tenantId: t, projectId: consulting.id, userName: 'Paulo Gestor', date: new Date('2026-03-25'), hours: new Decimal('6'), description: 'Análise de consumo energético — refinaria', billable: true } })
  const consulting2 = await prisma.consultingProject.create({ data: { tenantId: t, title: 'Plano Diretor TI — UNITEL', clientName: 'UNITEL', projectType: 'TECHNOLOGY', startDate: new Date('2026-01-15'), budget: new Decimal('12000000'), hourlyRate: new Decimal('65000'), status: 'ACTIVE', teamLead: 'Dr. Ana Mendes' } })
  await Promise.all([
    prisma.timeLog.create({ data: { tenantId: t, projectId: consulting.id, userName: 'Marco Técnico', date: new Date('2026-03-26'), hours: new Decimal('8'), description: 'Levantamento equipamentos — subestação', billable: true } }),
    prisma.timeLog.create({ data: { tenantId: t, projectId: consulting.id, userName: 'Paulo Gestor', date: new Date('2026-03-20'), hours: new Decimal('4'), description: 'Reunião com cliente — relatório intercalar', billable: true } }),
    prisma.timeLog.create({ data: { tenantId: t, projectId: consulting2.id, userName: 'Dr. Ana Mendes', date: new Date('2026-03-22'), hours: new Decimal('7'), description: 'Análise infraestrutura de rede', billable: true } }),
    prisma.timeLog.create({ data: { tenantId: t, projectId: consulting2.id, userName: 'Marco Técnico', date: new Date('2026-03-24'), hours: new Decimal('3'), description: 'Documentação — arquitetura proposta', billable: false } }),
  ])
  console.log('✅ Consultoria: 2 projetos, 5 registos de horas')

  // ── TELECOMUNICAÇÕES ──
  await prisma.telecomSubscription.create({ data: { tenantId: t, clientName: 'ENGERIS — Sede', planName: 'Empresarial 100Mbps', planType: 'INTERNET', monthlyValue: new Decimal('85000'), startDate: new Date('2025-01-01'), status: 'ACTIVE' } })
  await Promise.all([
    prisma.telecomSubscription.create({ data: { tenantId: t, clientName: 'ENGERIS — Benguela', planName: 'Empresarial 50Mbps', planType: 'INTERNET', monthlyValue: new Decimal('55000'), startDate: new Date('2025-03-01'), status: 'ACTIVE' } }),
    prisma.telecomSubscription.create({ data: { tenantId: t, clientName: 'Banco BAI — Voz', planName: 'Centralex 20 Extensões', planType: 'FIXED', monthlyValue: new Decimal('120000'), startDate: new Date('2025-06-01'), endDate: new Date('2026-05-31'), status: 'ACTIVE' } }),
    prisma.telecomSubscription.create({ data: { tenantId: t, clientName: 'Staff ENGERIS', planName: 'Frota Móvel 15 linhas', planType: 'MOBILE', monthlyValue: new Decimal('95000'), startDate: new Date('2025-01-01'), status: 'ACTIVE' } }),
  ])
  console.log('✅ Telecom: 4 subscrições')

  // ── JURÍDICO ──
  await prisma.legalCase.create({ data: { tenantId: t, caseNumber: 'PROC-2026-042', title: 'Disputa Contratual — Fornecedor XYZ', caseType: 'CONTRACT', clientName: 'ENGERIS', lawyer: 'Dr. Ricardo Nunes', status: 'IN_PROGRESS', priority: 'HIGH', filingDate: new Date('2026-01-15'), fees: new Decimal('2500000') } })
  await prisma.legalCase.create({ data: { tenantId: t, caseNumber: 'PROC-2025-118', title: 'Cobrança Judicial — Cliente Moroso', caseType: 'COMMERCIAL', clientName: 'ENGERIS', lawyer: 'Dr. Ricardo Nunes', status: 'HEARING', priority: 'NORMAL', filingDate: new Date('2025-08-20'), nextHearing: new Date('2026-04-10'), fees: new Decimal('1200000') } })
  await prisma.legalCase.create({ data: { tenantId: t, caseNumber: 'PROC-2026-015', title: 'Licenciamento Atividade — Cabinda', caseType: 'ADMINISTRATIVE', clientName: 'ENGERIS', lawyer: 'Dra. Teresa Faria', status: 'OPEN', priority: 'LOW', filingDate: new Date('2026-02-01'), fees: new Decimal('500000') } })
  console.log('✅ Jurídico: 3 processos')

  // ── CONTABILIDADE ──
  await Promise.all([
    prisma.accountingEntry.create({ data: { tenantId: t, entryNumber: 'LC-2026-001', date: new Date('2026-03-01'), description: 'Receita Contrato BAI — Março', account: '71.1.1', debit: new Decimal('0'), credit: new Decimal('450000'), category: 'REVENUE', reference: 'FT' } }),
    prisma.accountingEntry.create({ data: { tenantId: t, entryNumber: 'LC-2026-002', date: new Date('2026-03-01'), description: 'Salários — Março', account: '63.1.1', debit: new Decimal('1850000'), credit: new Decimal('0'), category: 'EXPENSE' } }),
    prisma.accountingEntry.create({ data: { tenantId: t, entryNumber: 'LC-2026-003', date: new Date('2026-03-15'), description: 'Receita Projeto Talatona', account: '71.2.1', debit: new Decimal('0'), credit: new Decimal('8500000'), category: 'REVENUE', reference: 'FT' } }),
  ])
  await Promise.all([
    prisma.accountingEntry.create({ data: { tenantId: t, entryNumber: 'LC-2026-004', date: new Date('2026-03-20'), description: 'Combustível Frotas — Março', account: '62.3.1', debit: new Decimal('67300'), credit: new Decimal('0'), category: 'EXPENSE' } }),
    prisma.accountingEntry.create({ data: { tenantId: t, entryNumber: 'LC-2026-005', date: new Date('2026-03-25'), description: 'Receita Consultoria Sonangol', account: '71.3.1', debit: new Decimal('0'), credit: new Decimal('3000000'), category: 'REVENUE', reference: 'FT' } }),
    prisma.accountingEntry.create({ data: { tenantId: t, entryNumber: 'LC-2026-006', date: new Date('2026-03-10'), description: 'Renda Escritório Benguela', account: '62.2.1', debit: new Decimal('250000'), credit: new Decimal('0'), category: 'EXPENSE' } }),
    prisma.accountingEntry.create({ data: { tenantId: t, entryNumber: 'LC-2026-007', date: new Date('2026-03-28'), description: 'Venda Loja Talatona', account: '71.1.2', debit: new Decimal('0'), credit: new Decimal('84930'), category: 'REVENUE', reference: 'FT' } }),
    prisma.accountingEntry.create({ data: { tenantId: t, entryNumber: 'LC-2026-008', date: new Date('2026-03-05'), description: 'Seguro Veículos', account: '62.6.1', debit: new Decimal('180000'), credit: new Decimal('0'), category: 'EXPENSE' } }),
  ])
  console.log('✅ Contabilidade: 8 lançamentos')

  // ── ATIVIDADES ──
  const activity = await prisma.activity.create({ data: { tenantId: t, name: 'Surf em Cabo Ledo', category: 'WATER', duration: 120, maxParticipants: 8, price: new Decimal('12000'), difficulty: 'MODERATE', status: 'ACTIVE', location: 'Praia de Cabo Ledo' } })
  await prisma.activity.create({ data: { tenantId: t, name: 'Trilho do Miradouro', category: 'NATURE', duration: 180, maxParticipants: 15, price: new Decimal('8000'), difficulty: 'EASY', status: 'ACTIVE' } })
  await prisma.activityBooking.create({ data: { tenantId: t, activityId: activity.id, clientName: 'John Smith', clientEmail: 'john@email.com', participants: 3, date: new Date('2026-04-10T08:00:00'), totalPrice: new Decimal('36000'), status: 'CONFIRMED' } })
  await prisma.activity.create({ data: { tenantId: t, name: 'Passeio de Barco ao Pôr do Sol', category: 'WATER', duration: 150, maxParticipants: 12, price: new Decimal('20000'), difficulty: 'EASY', status: 'ACTIVE', location: 'Marina de Luanda' } })
  await Promise.all([
    prisma.activityBooking.create({ data: { tenantId: t, activityId: activity.id, clientName: 'Sofia Fernandes', clientPhone: '+244 923 100 002', participants: 2, date: new Date('2026-04-12T07:00:00'), totalPrice: new Decimal('24000'), status: 'BOOKED' } }),
    prisma.activityBooking.create({ data: { tenantId: t, activityId: activity.id, clientName: 'Roberto Almeida', participants: 1, date: new Date('2026-04-15T09:00:00'), totalPrice: new Decimal('12000'), status: 'CONFIRMED' } }),
  ])
  console.log('✅ Atividades: 3 atividades, 3 reservas')

  // ── RETALHO ──
  const store = await prisma.retailStore.create({ data: { tenantId: t, name: 'Loja ENGERIS — Talatona', code: 'LJ-TAL-01', address: 'Centro Comercial Xyami', city: 'Luanda', manager: 'Ana Loja', openTime: '09:00', closeTime: '21:00' } })
  await prisma.retailSale.create({ data: { tenantId: t, storeId: store.id, saleNumber: 'VND-001', clientName: 'Cliente Balcão', items: [{ name: 'Cabo Elétrico 2.5mm 100m', qty: 5, price: 8500, total: 42500 }, { name: 'Disjuntor 32A', qty: 10, price: 3200, total: 32000 }], subtotal: new Decimal('74500'), taxAmount: new Decimal('10430'), discount: new Decimal('0'), totalAmount: new Decimal('84930'), paymentMethod: 'CARD' } })
  const store2 = await prisma.retailStore.create({ data: { tenantId: t, name: 'Loja ENGERIS — Benguela', code: 'LJ-BEN-01', address: 'Av. Norton de Matos, 120', city: 'Benguela', manager: 'Pedro Loja', openTime: '08:30', closeTime: '18:30' } })
  await Promise.all([
    prisma.retailSale.create({ data: { tenantId: t, storeId: store.id, saleNumber: 'VND-002', clientName: 'Eletricista João', clientNif: '0023456789', items: [{ name: 'Fio Elétrico 4mm 100m', qty: 3, price: 12500, total: 37500 }], subtotal: new Decimal('37500'), taxAmount: new Decimal('5250'), discount: new Decimal('0'), totalAmount: new Decimal('42750'), paymentMethod: 'CASH' } }),
    prisma.retailSale.create({ data: { tenantId: t, storeId: store.id, saleNumber: 'VND-003', clientName: 'Condomínio ABC', items: [{ name: 'Lâmpada LED 12W', qty: 50, price: 1200, total: 60000 }, { name: 'Interruptor duplo', qty: 20, price: 800, total: 16000 }], subtotal: new Decimal('76000'), taxAmount: new Decimal('10640'), discount: new Decimal('0'), totalAmount: new Decimal('86640'), paymentMethod: 'TRANSFER' } }),
    prisma.retailSale.create({ data: { tenantId: t, storeId: store2.id, saleNumber: 'VND-004', clientName: 'Cliente Balcão', items: [{ name: 'Tomada tripla', qty: 10, price: 2500, total: 25000 }], subtotal: new Decimal('25000'), taxAmount: new Decimal('3500'), discount: new Decimal('0'), totalAmount: new Decimal('28500'), paymentMethod: 'CARD' } }),
  ])
  console.log('✅ Retalho: 2 lojas, 4 vendas')

  // ── FATURAÇÃO ──
  const ftSeries = await prisma.invoiceSeries.create({ data: { tenantId: t, documentType: 'FT', series: 'A', prefix: 'FT A', lastNumber: 0 } })
  await prisma.invoiceSeries.create({ data: { tenantId: t, documentType: 'FR', series: 'A', prefix: 'FR A', lastNumber: 0 } })
  await prisma.invoiceSeries.create({ data: { tenantId: t, documentType: 'NC', series: 'A', prefix: 'NC A', lastNumber: 0 } })
  // Série TREINO para Sea & Soul
  await prisma.invoiceSeries.create({ data: { tenantId: seaSoul.id, documentType: 'FT', series: 'A', prefix: 'FT A', lastNumber: 0 } })
  await prisma.invoiceSeries.create({ data: { tenantId: seaSoul.id, documentType: 'FT', series: 'TREINO', prefix: 'FT-TREINO', lastNumber: 0, isTraining: true } })

  // Fatura exemplo
  const invoice = await prisma.invoice.create({ data: { tenantId: t, seriesId: ftSeries.id, documentType: 'FT', number: 1, fullNumber: 'FT A/00001', clientName: 'Banco BAI', clientNif: '5401234567', subtotal: new Decimal('450000'), taxAmount: new Decimal('63000'), totalAmount: new Decimal('513000'), currency: 'AOA' } })
  await prisma.invoiceSeries.update({ where: { id: ftSeries.id }, data: { lastNumber: 1 } })
  await prisma.invoiceItem.create({ data: { invoiceId: invoice.id, description: 'Serviço de Monitorização — Março 2026', quantity: new Decimal('1'), unitPrice: new Decimal('450000'), taxRate: new Decimal('14'), discount: new Decimal('0'), total: new Decimal('450000') } })

  // Mais faturas
  const inv2 = await prisma.invoice.create({ data: { tenantId: t, seriesId: ftSeries.id, documentType: 'FT', number: 2, fullNumber: 'FT A/00002', clientName: 'Sonangol EP', clientNif: '5409876543', subtotal: new Decimal('1200000'), taxAmount: new Decimal('168000'), totalAmount: new Decimal('1368000'), currency: 'AOA' } })
  await Promise.all([
    prisma.invoiceItem.create({ data: { invoiceId: inv2.id, description: 'CCTV — Manutenção Mensal', quantity: new Decimal('1'), unitPrice: new Decimal('800000'), taxRate: new Decimal('14'), discount: new Decimal('0'), total: new Decimal('800000') } }),
    prisma.invoiceItem.create({ data: { invoiceId: inv2.id, description: 'Controlo de Acesso — Manutenção', quantity: new Decimal('1'), unitPrice: new Decimal('400000'), taxRate: new Decimal('14'), discount: new Decimal('0'), total: new Decimal('400000') } }),
  ])

  const inv3 = await prisma.invoice.create({ data: { tenantId: t, seriesId: ftSeries.id, documentType: 'FT', number: 3, fullNumber: 'FT A/00003', clientName: 'Imobiliária Angola', clientNif: '5415678901', subtotal: new Decimal('3790500'), taxAmount: new Decimal('530670'), totalAmount: new Decimal('4321170'), currency: 'AOA' } })
  await prisma.invoiceItem.create({ data: { invoiceId: inv3.id, description: 'Auto de Medição #1 — Fundações Edifício Talatona', quantity: new Decimal('1'), unitPrice: new Decimal('3790500'), taxRate: new Decimal('14'), discount: new Decimal('0'), total: new Decimal('3790500') } })

  const inv4 = await prisma.invoice.create({ data: { tenantId: t, seriesId: ftSeries.id, documentType: 'FT', number: 4, fullNumber: 'FT A/00004', clientName: 'João Almeida', subtotal: new Decimal('75000'), taxAmount: new Decimal('10500'), totalAmount: new Decimal('85500'), currency: 'AOA', paymentMethod: 'CARD' } })
  await prisma.invoiceItem.create({ data: { invoiceId: inv4.id, description: 'Curso Segurança em Instalações Elétricas', quantity: new Decimal('1'), unitPrice: new Decimal('75000'), taxRate: new Decimal('14'), discount: new Decimal('0'), total: new Decimal('75000') } })

  // Nota de crédito
  const ncSeries = await prisma.invoiceSeries.findFirst({ where: { tenantId: t, documentType: 'NC', series: 'A' } })
  if (ncSeries) {
    await prisma.invoice.create({ data: { tenantId: t, seriesId: ncSeries.id, documentType: 'NC', number: 1, fullNumber: 'NC A/00001', clientName: 'Condomínio Talatona', subtotal: new Decimal('280000'), taxAmount: new Decimal('39200'), totalAmount: new Decimal('319200'), currency: 'AOA', relatedInvoiceId: invoice.id, notes: 'Crédito referente a contrato expirado' } })
    await prisma.invoiceSeries.update({ where: { id: ncSeries.id }, data: { lastNumber: 1 } })
  }

  await prisma.invoiceSeries.update({ where: { id: ftSeries.id }, data: { lastNumber: 4 } })
  console.log('✅ Faturação: 5 séries, 5 faturas + 1 nota de crédito')

  // ── RESUMO FINAL ──
  console.log('')
  console.log('🎉 Seed ENGERIS ONE completo!')
  console.log('═══════════════════════════════════════')
  console.log(`   Tenants:        2 (ENGERIS + Sea & Soul)`)
  console.log(`   Módulos:        ${allModules.length + seaSoulModules.length}`)
  console.log(`   Filiais:        5`)
  console.log(`   Resorts:        2`)
  console.log(`   Utilizadores:   ${users.length + 3}`)
  console.log(`   Quartos:        ${createdRooms.length}`)
  console.log(`   Tarifas:        ${tariffs.length}`)
  console.log(`   Produtos:       ${products.length}`)
  console.log(`   Fornecedores:   ${suppliers.length}`)
  console.log(`   Stock:          ${stockItems.length}`)
  console.log(`   Colaboradores:  ${employees.length}`)
  console.log(`   Segurança:      3 contratos, 2 incidentes, 3 instalações, 2 patrulhas`)
  console.log(`   Engenharia:     2 projetos, 2 obras, 4 orçamentos, 2 medições`)
  console.log(`   Eletricidade:   1 projeto, 1 inspeção, 1 certificação`)
  console.log(`   CRM:            4 clientes, 3 deals`)
  console.log(`   Frotas:         3 veículos, 4 abastecimentos`)
  console.log(`   Contratos:      2 contratos de serviço`)
  console.log(`   Spa:            2 serviços, 1 reserva`)
  console.log(`   Eventos:        2 eventos`)
  console.log(`   Imobiliário:    3 imóveis`)
  console.log(`   Logística:      2 envios`)
  console.log(`   Educação:       2 cursos, 4 inscrições`)
  console.log(`   Saúde:          3 pacientes, 5 consultas`)
  console.log(`   Agricultura:    1 fazenda, 2 culturas, 1 colheita`)
  console.log(`   Manufatura:     1 ordem de produção`)
  console.log(`   Consultoria:    2 projetos, 5 registos de horas`)
  console.log(`   Telecom:        4 subscrições`)
  console.log(`   Jurídico:       3 processos`)
  console.log(`   Contabilidade:  8 lançamentos`)
  console.log(`   Atividades:     3 atividades, 3 reservas`)
  console.log(`   Retalho:        2 lojas, 4 vendas`)
  console.log(`   Faturação:      5 séries, 6 faturas`)
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
