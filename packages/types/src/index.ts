// Sea and Soul ERP — Tipos Partilhados
// ENGERIS — engeris.co.ao

// ── ENUMS ─────────────────────────────────────

export type UserRole =
  | 'SUPER_ADMIN'
  | 'RESORT_MANAGER'
  | 'RECEPTIONIST'
  | 'POS_OPERATOR'
  | 'STOCK_MANAGER'
  | 'HR_MANAGER'
  | 'STAFF'

export type ReservationStatus =
  | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW'

export type ReservationPaymentStatus =
  | 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED'

export type BookingSource =
  | 'DIRECT' | 'WEBSITE' | 'PHONE' | 'BOOKING_COM' | 'EXPEDIA' | 'AIRBNB' | 'OTHER'

export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'CLEANING'
export type RoomType   = 'STANDARD' | 'SUPERIOR' | 'SUITE' | 'VILLA'

export type PaymentMethod = 'CASH' | 'CARD' | 'ROOM_CHARGE' | 'TRANSFER'
export type SaleStatus    = 'PENDING' | 'INVOICED' | 'CANCELLED'

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT'

export type AttendanceType = 'ENTRY' | 'EXIT' | 'BREAK_START' | 'BREAK_END'

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TicketStatus   = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export type ServiceOrderType   = 'ROOM_SERVICE' | 'HOUSEKEEPING' | 'SPA' | 'RESTAURANT' | 'ACTIVITY' | 'TRANSPORT' | 'OTHER'
export type ServiceOrderStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type SenderType = 'GUEST' | 'STAFF'

export type NotificationType =
  | 'RESERVATION_CONFIRMED' | 'RESERVATION_REMINDER' | 'CHECKIN_READY'
  | 'PIN_GENERATED' | 'CHECKOUT_REMINDER' | 'INVOICE_READY'
  | 'STOCK_ALERT' | 'ATTENDANCE_MISSING' | 'PAYROLL_PROCESSED' | 'MAINTENANCE_ASSIGNED'

export type NotificationChannel = 'PUSH' | 'SMS' | 'EMAIL' | 'IN_APP'
export type NotificationStatus  = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'

export type DocumentType = 'ID_CARD' | 'PASSPORT' | 'CONTRACT' | 'INVOICE' | 'MEDICAL' | 'VISA' | 'OTHER'

// ── ENTIDADES BASE ────────────────────────────

export type Resort = {
  id: string
  name: string
  slug: string
  lat: number
  lng: number
  geofenceRadius: number
  active: boolean
}

export type Room = {
  id: string
  resortId: string
  number: string
  type: RoomType
  floor: number
  capacity: number
  pricePerNight: number // Decimal serializado como number na API
  seamDeviceId?: string
  status: RoomStatus
  description?: string
  amenities: string[]
}

export type Tariff = {
  id: string
  resortId: string
  name: string
  roomType: RoomType
  pricePerNight: number
  validFrom: string // ISO date
  validUntil: string
  minNights: number
  active: boolean
}

export type Reservation = {
  id: string
  resortId: string
  roomId: string
  guestId?: string
  guestName: string
  guestEmail: string
  guestPhone: string
  checkIn: string // ISO date
  checkOut: string
  nights: number
  adults: number
  children: number
  status: ReservationStatus
  bookingSource: BookingSource
  pinValidFrom?: string
  pinValidUntil?: string
  totalAmount: number
  depositPaid: number
  paymentStatus: ReservationPaymentStatus
  notes?: string
  createdAt: string
}

export type Guest = {
  id: string
  name: string
  email?: string
  phone: string
  countryCode?: string
  language: string
  deviceToken?: string
}

export type Product = {
  id: string
  name: string
  category: string
  department: string
  unitPrice: number
  taxRate: number
  active: boolean
}

export type Sale = {
  id: string
  resortId: string
  reservationId?: string
  operatorId?: string
  totalAmount: number
  taxAmount: number
  paymentMethod: PaymentMethod
  status: SaleStatus
  invoiceNumber?: string
  invoiceSeries?: string
  agtStatus?: string
  agtQrCode?: string
  agtSubmittedAt?: string
  pdfUrl?: string
  createdAt: string
  items: SaleItem[]
}

export type SaleItem = {
  id: string
  productId: string
  productName?: string
  qty: number
  unitPrice: number
  taxRate: number
  total: number
}

export type StockItem = {
  id: string
  resortId: string
  name: string
  department: string
  unit: string
  currentQty: number
  minQty: number
  isLow: boolean // currentQty <= minQty
}

export type Employee = {
  id: string
  resortId: string
  name: string
  nif: string
  role: string
  department: string
  baseSalary: number
  startDate: string
  active: boolean
}

export type Payroll = {
  id: string
  employeeId: string
  month: number
  year: number
  baseSalary: number
  hoursWorked: number
  overtimeHours: number
  overtimePay: number
  absenceDays: number
  absenceDeduct: number
  netSalary: number
  processed: boolean
  processedAt?: string
}

export type MaintenanceTicket = {
  id: string
  resortId: string
  roomId?: string
  location: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  assignedTo?: string
  resolvedAt?: string
  createdAt: string
}

export type GuestReview = {
  id: string
  resortId: string
  reservationId: string
  guestName: string
  overallRating: number
  cleanliness?: number
  service?: number
  location?: number
  valueForMoney?: number
  comment?: string
  language: string
  published: boolean
  reply?: string
  createdAt: string
}

export type RoomServiceOrder = {
  id: string
  resortId: string
  reservationId: string
  guestId?: string
  type: ServiceOrderType
  items: ServiceOrderItem[]
  notes?: string
  status: ServiceOrderStatus
  scheduledAt?: string
  completedAt?: string
  assignedTo?: string
  totalAmount?: number
  createdAt: string
}

export type ServiceOrderItem = {
  name: string
  qty: number
  price?: number
  notes?: string
}

export type ChatMessage = {
  id: string
  reservationId: string
  guestId?: string
  senderType: SenderType
  senderId: string
  senderName?: string
  content: string
  readAt?: string
  createdAt: string
}

export type Notification = {
  id: string
  userId?: string
  guestId?: string
  type: NotificationType
  title: string
  body: string
  data?: Record<string, unknown>
  channel: NotificationChannel
  status: NotificationStatus
  sentAt?: string
  readAt?: string
  createdAt: string
}

// ── RESPOSTAS API ─────────────────────────────

export type ApiResponse<T> = {
  data: T
  message?: string
  error?: string
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ── DASHBOARD ─────────────────────────────────

export type DashboardOverview = {
  resortId: string
  resortName: string
  occupancy: number          // percentagem 0-100
  totalRooms: number
  occupiedRooms: number
  revenueToday: number
  revenueMtd: number         // month-to-date
  checkInsToday: number
  checkOutsToday: number
  pendingMaintenance: number
  lowStockAlerts: number
  pendingServiceOrders: number
  averageRating: number      // média das avaliações
}

export type CentralDashboard = {
  resorts: DashboardOverview[]
  totalRevenueMtd: number
  totalOccupancy: number
  combinedCheckInsToday: number
}

// ── AUTH ──────────────────────────────────────

export type AuthTokens = {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export type AuthUser = {
  id: string
  name: string
  email: string
  role: UserRole
  resortId?: string
  twoFaEnabled: boolean
}

export type LoginResponse = AuthTokens & {
  user: AuthUser
  requiresTwoFa: boolean
}
