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
    prisma.supplier.create({ data: { name: 'Distribuidora Luanda', nif: '5417123456', contact: 'Manuel Sousa', phone: '+244 923 111 222', email: 'vendas@distluanda.ao' } }),
    prisma.supplier.create({ data: { name: 'Pescador Cabo Ledo', nif: '5417654321', contact: 'António Pescador', phone: '+244 923 333 444' } }),
    prisma.supplier.create({ data: { name: 'Fazenda Orgânica Bengo', nif: '5417111222', contact: 'Rosa Campos', phone: '+244 923 555 666', email: 'encomendas@fazendabengo.ao' } }),
    prisma.supplier.create({ data: { name: 'Bebidas Angola Lda', nif: '5417999888', contact: 'Carlos Bebidas', phone: '+244 923 777 888' } }),
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
    prisma.employee.create({ data: { resortId: caboLedo.id, name: 'António Luís', nif: '000111222AA', role: 'Rececionista', department: 'RECEÇÃO', baseSalary: new Decimal('180000'), startDate: new Date('2024-01-15') } }),
    prisma.employee.create({ data: { resortId: caboLedo.id, name: 'Beatriz Martins', nif: '000222333BB', role: 'Chef de Cozinha', department: 'COZINHA', baseSalary: new Decimal('350000'), startDate: new Date('2023-06-01') } }),
    prisma.employee.create({ data: { resortId: caboLedo.id, name: 'Carlos Neto', nif: '000333444CC', role: 'Barman', department: 'BAR', baseSalary: new Decimal('150000'), startDate: new Date('2024-03-01') } }),
    prisma.employee.create({ data: { resortId: caboLedo.id, name: 'Diana Sousa', nif: '000444555DD', role: 'Governanta', department: 'HOUSEKEEPING', baseSalary: new Decimal('200000'), startDate: new Date('2023-09-15') } }),
    prisma.employee.create({ data: { resortId: caboLedo.id, name: 'Eduardo Fonseca', nif: '000555666EE', role: 'Segurança', department: 'SEGURANÇA', baseSalary: new Decimal('120000'), startDate: new Date('2024-06-01') } }),
    prisma.employee.create({ data: { resortId: caboLedo.id, name: 'Fernanda Lima', nif: '000666777FF', role: 'Terapeuta SPA', department: 'SPA', baseSalary: new Decimal('200000'), startDate: new Date('2024-01-01') } }),
    prisma.employee.create({ data: { resortId: sangano.id, name: 'Gabriel Santos', nif: '000777888GG', role: 'Rececionista', department: 'RECEÇÃO', baseSalary: new Decimal('180000'), startDate: new Date('2024-02-01') } }),
    prisma.employee.create({ data: { resortId: sangano.id, name: 'Helena Costa', nif: '000888999HH', role: 'Chef de Cozinha', department: 'COZINHA', baseSalary: new Decimal('320000'), startDate: new Date('2023-08-15') } }),
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

  console.log('')
  console.log('🎉 Seed completo!')
  console.log('─────────────────────────────────────────')
  console.log(`   Resorts:       2`)
  console.log(`   Utilizadores:  ${users.length}`)
  console.log(`   Quartos:       ${createdRooms.length}`)
  console.log(`   Tarifas:       ${tariffs.length}`)
  console.log(`   Produtos:      ${products.length}`)
  console.log(`   Fornecedores:  ${suppliers.length}`)
  console.log(`   Stock:         ${stockItems.length}`)
  console.log(`   Colaboradores: ${employees.length}`)
  console.log(`   Hóspedes:      ${guests.length}`)
  console.log(`   Reservas:      ${reservations.length}`)
  console.log('─────────────────────────────────────────')
  console.log('')
  console.log('Credenciais de teste:')
  console.log('  Admin: admin@seasoul.ao')
  console.log('  Manager CL: manager.cl@seasoul.ao')
  console.log('  Manager SG: manager.sg@seasoul.ao')
  console.log('  (Passwords placeholder — usar /v1/auth/register para criar novas)')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
