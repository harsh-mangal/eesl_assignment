import {
  AccountStatus,
  AdditionalServiceType,
  BookingStatus,
  EventStatus,
  InvoiceStatus,
  MembershipStatus,
  NotificationAudience,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  PrismaClient,
  QrStatus,
  QrType,
  RfidStatus,
  Role,
  RoomStatus,
  ServiceType,
  VerificationResult,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const atMidnight = (offsetDays: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
};

async function resetDatabase() {
  await prisma.notificationRecipient.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.qrToken.deleteMany();
  await prisma.eventBooking.deleteMany();
  await prisma.event.deleteMany();
  await prisma.roomBooking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.restaurantBooking.deleteMany();
  await prisma.restaurantSlot.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.additionalServiceAccount.deleteMany();
  await prisma.rfidRecord.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.member.deleteMany();
}

async function main() {
  await resetDatabase();

  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const memberPassword = await bcrypt.hash('Member@123', 12);

  await prisma.user.create({
    data: {
      email: 'admin@memberservices.test',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      status: AccountStatus.ACTIVE,
    },
  });

  const memberSeeds = [
    {
      memberCode: 'MEM-1001',
      fullName: 'Aarav Sharma',
      email: 'aarav@example.com',
      mobileNumber: '9876500001',
      address: 'Sector 70, Mohali, Punjab',
      membershipType: 'Platinum',
      membershipStatus: MembershipStatus.ACTIVE,
      rfidStatus: RfidStatus.ACTIVE,
      profilePhotoUrl: 'https://i.pravatar.cc/300?img=12',
    },
    {
      memberCode: 'MEM-1002',
      fullName: 'Meera Kapoor',
      email: 'meera@example.com',
      mobileNumber: '9876500002',
      address: 'DLF Phase 3, Gurugram, Haryana',
      membershipType: 'Gold',
      membershipStatus: MembershipStatus.ACTIVE,
      rfidStatus: RfidStatus.BLOCKED,
      profilePhotoUrl: 'https://i.pravatar.cc/300?img=47',
    },
    {
      memberCode: 'MEM-1003',
      fullName: 'Kabir Malhotra',
      email: 'kabir@example.com',
      mobileNumber: '9876500003',
      address: 'Model Town, Ludhiana, Punjab',
      membershipType: 'Silver',
      membershipStatus: MembershipStatus.INACTIVE,
      rfidStatus: RfidStatus.INACTIVE,
      profilePhotoUrl: 'https://i.pravatar.cc/300?img=15',
    },
    {
      memberCode: 'MEM-1004',
      fullName: 'Ananya Gupta',
      email: 'ananya@example.com',
      mobileNumber: '9876500004',
      address: 'Civil Lines, Delhi',
      membershipType: 'Gold',
      membershipStatus: MembershipStatus.ACTIVE,
      rfidStatus: RfidStatus.EXPIRED,
      profilePhotoUrl: 'https://i.pravatar.cc/300?img=32',
    },
    {
      memberCode: 'MEM-1005',
      fullName: 'Vihaan Singh',
      email: 'vihaan@example.com',
      mobileNumber: '9876500005',
      address: 'Ranjit Avenue, Amritsar, Punjab',
      membershipType: 'Platinum',
      membershipStatus: MembershipStatus.ACTIVE,
      rfidStatus: RfidStatus.ACTIVE,
      profilePhotoUrl: 'https://i.pravatar.cc/300?img=5',
    },
  ];

  const members = [];
  for (let index = 0; index < memberSeeds.length; index += 1) {
    const seed = memberSeeds[index];
    const member = await prisma.member.create({
      data: {
        memberCode: seed.memberCode,
        fullName: seed.fullName,
        email: seed.email,
        mobileNumber: seed.mobileNumber,
        address: seed.address,
        profilePhotoUrl: seed.profilePhotoUrl,
        user: {
          create: {
            email: seed.email,
            passwordHash: memberPassword,
            role: Role.MEMBER,
            status:
              seed.membershipStatus === MembershipStatus.INACTIVE
                ? AccountStatus.DISABLED
                : AccountStatus.ACTIVE,
          },
        },
        membership: {
          create: {
            membershipType: seed.membershipType,
            status: seed.membershipStatus,
            validFrom: atMidnight(-180),
            validUntil:
              seed.membershipStatus === MembershipStatus.INACTIVE
                ? atMidnight(120)
                : atMidnight(365 - index * 25),
            digitalCardActive: seed.membershipStatus === MembershipStatus.ACTIVE,
            verificationToken: `MEMBERSHIP-${seed.memberCode}-${1000 + index}`,
          },
        },
        rfidRecord: {
          create: {
            referenceNumber: `RFID-REF-${2001 + index}`,
            cardNumber: `CARD-${90001 + index}`,
            status: seed.rfidStatus,
            activationDate: atMidnight(-150),
            expiryDate:
              seed.rfidStatus === RfidStatus.EXPIRED
                ? atMidnight(-5)
                : atMidnight(300 - index * 15),
            accessAllowed: seed.rfidStatus === RfidStatus.ACTIVE,
            lastVerificationDate: atMidnight(-index),
            lastVerificationResult:
              seed.rfidStatus === RfidStatus.ACTIVE
                ? VerificationResult.VALID
                : VerificationResult.INVALID,
          },
        },
        additionalServices: {
          create: {
            serviceType: AdditionalServiceType.LIBRARY,
            status: 'ACTIVE',
            validUntil: atMidnight(365),
            details: {
              booksIssued: index % 3,
              booksDue: index === 1 ? 1 : 0,
              outstandingFine: index === 1 ? 150 : 0,
              borrowingLimit: 5,
            },
          },
        },
      },
      include: { membership: true, rfidRecord: true },
    });
    members.push(member);

    await prisma.qrToken.create({
      data: {
        token: member.membership!.verificationToken,
        type: QrType.MEMBERSHIP,
        status:
          seed.membershipStatus === MembershipStatus.ACTIVE
            ? QrStatus.ACTIVE
            : QrStatus.EXPIRED,
        memberId: member.id,
        referenceId: member.membership!.id,
        expiresAt: member.membership!.validUntil,
      },
    });
  }

  const restaurants = [];
  for (const restaurantSeed of [
    {
      name: 'The Garden Table',
      description: 'Contemporary Indian dining with garden seating.',
      openingTime: '12:00',
      closingTime: '23:00',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c5',
    },
    {
      name: 'Azure Rooftop',
      description: 'Rooftop dining, global cuisine and city views.',
      openingTime: '18:00',
      closingTime: '23:30',
      imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9',
    },
  ]) {
    const restaurant = await prisma.restaurant.create({ data: restaurantSeed });
    restaurants.push(restaurant);

    for (let dayOffset = 1; dayOffset <= 5; dayOffset += 1) {
      const times = restaurantSeed.name === 'The Garden Table'
        ? ['12:00', '14:00', '19:00', '21:00', '22:00']
        : ['18:00', '19:30', '21:00', '22:30', '23:00'];
      for (let slotIndex = 0; slotIndex < times.length; slotIndex += 1) {
        const startHour = Number(times[slotIndex].split(':')[0]);
        await prisma.restaurantSlot.create({
          data: {
            restaurantId: restaurant.id,
            bookingDate: atMidnight(dayOffset),
            startTime: times[slotIndex],
            endTime: `${String((startHour + 1) % 24).padStart(2, '0')}:30`,
            capacity: slotIndex === 4 ? 12 : 20,
            bookedCapacity: 0,
            isAvailable: !(dayOffset === 4 && slotIndex === 4),
          },
        });
      }
    }
  }

  const rooms = [];
  const roomSeeds = [
    ['101', 'Club Deluxe 101', 'Deluxe', 6500, 2, RoomStatus.AVAILABLE],
    ['102', 'Club Deluxe 102', 'Deluxe', 6500, 2, RoomStatus.AVAILABLE],
    ['201', 'Executive Suite', 'Suite', 9800, 3, RoomStatus.AVAILABLE],
    ['202', 'Family Suite', 'Family', 12500, 5, RoomStatus.UNAVAILABLE],
    ['301', 'Presidential Suite', 'Presidential', 22000, 4, RoomStatus.MAINTENANCE],
  ] as const;

  for (const [roomNumber, roomName, roomType, pricePerNight, guestCapacity, status] of roomSeeds) {
    rooms.push(
      await prisma.room.create({
        data: {
          roomNumber,
          roomName,
          roomType,
          pricePerNight,
          guestCapacity,
          status,
          amenities: ['Wi-Fi', 'Breakfast', 'Air conditioning', 'Smart TV'],
          imageUrl: `https://images.unsplash.com/photo-1566665797739-1674de7a421a?room=${roomNumber}`,
        },
      }),
    );
  }

  const events = [];
  const eventSeeds = [
    ['Jazz Under the Stars', 'Music', 5, '19:00', '22:00', 'Club Lawn', 1200, 150],
    ['Sunday Family Carnival', 'Family', 8, '11:00', '17:00', 'Central Grounds', 0, 300],
    ['Wine and Culinary Evening', 'Food', 12, '18:30', '22:30', 'Azure Rooftop', 2500, 80],
    ['Business Leadership Forum', 'Business', 18, '10:00', '16:00', 'Grand Ballroom', 1800, 200],
    ['Members Monsoon Gala', 'Social', 25, '20:00', '23:30', 'Grand Ballroom', 1500, 250],
  ] as const;

  for (let index = 0; index < eventSeeds.length; index += 1) {
    const [title, category, offset, startTime, endTime, venue, ticketPrice, capacity] = eventSeeds[index];
    events.push(
      await prisma.event.create({
        data: {
          title,
          description: `${title} is an exclusive member experience with curated activities and hospitality.`,
          category,
          eventDate: atMidnight(offset),
          startTime,
          endTime,
          venue,
          ticketPrice,
          totalCapacity: capacity,
          availableSeats: capacity,
          status: EventStatus.PUBLISHED,
          bannerUrl: `https://images.unsplash.com/photo-1492684223066-81342ee5ff30?event=${index}`,
        },
      }),
    );
  }

  for (let memberIndex = 0; memberIndex < members.length; memberIndex += 1) {
    const member = members[memberIndex];
    const unpaidInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-2026-${String(memberIndex * 2 + 1).padStart(4, '0')}`,
        memberId: member.id,
        description: 'Annual club membership renewal fee',
        amount: 15000 + memberIndex * 1000,
        issueDate: atMidnight(-10),
        dueDate: atMidnight(20),
        status: InvoiceStatus.UNPAID,
      },
    });

    const paidInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-2026-${String(memberIndex * 2 + 2).padStart(4, '0')}`,
        memberId: member.id,
        description: 'Quarterly facility maintenance contribution',
        amount: 3500,
        issueDate: atMidnight(-45),
        dueDate: atMidnight(-15),
        status: InvoiceStatus.PAID,
      },
    });

    await prisma.payment.create({
      data: {
        transactionId: `TXN-SEED-${5000 + memberIndex}`,
        memberId: member.id,
        invoiceId: paidInvoice.id,
        amount: paidInvoice.amount,
        paymentMethod: memberIndex % 2 === 0 ? PaymentMethod.UPI : PaymentMethod.CARD,
        paymentType: PaymentType.INVOICE,
        status: PaymentStatus.SUCCESS,
        paidAt: atMidnight(-20),
      },
    });

    void unpaidInvoice;
  }

  const firstSlot = await prisma.restaurantSlot.findFirstOrThrow({
    where: { restaurantId: restaurants[0].id, bookingDate: atMidnight(1) },
    orderBy: { startTime: 'asc' },
  });
  const restaurantBooking = await prisma.restaurantBooking.create({
    data: {
      bookingNumber: 'REST-2026-0001',
      memberId: members[0].id,
      restaurantId: restaurants[0].id,
      slotId: firstSlot.id,
      guestCount: 2,
      specialInstructions: 'Window table preferred.',
      status: BookingStatus.COMPLETED,
      qrToken: 'QR-REST-2026-0001',
    },
  });
  await prisma.restaurantSlot.update({
    where: { id: firstSlot.id },
    data: { bookedCapacity: { increment: 2 } },
  });
  await prisma.qrToken.create({
    data: {
      token: restaurantBooking.qrToken,
      type: QrType.RESTAURANT_BOOKING,
      status: QrStatus.USED,
      memberId: members[0].id,
      referenceId: restaurantBooking.id,
      usedAt: new Date(),
    },
  });

  const roomBooking = await prisma.roomBooking.create({
    data: {
      bookingNumber: 'ROOM-2026-0001',
      memberId: members[1].id,
      roomId: rooms[0].id,
      checkInDate: atMidnight(2),
      checkOutDate: atMidnight(4),
      guestCount: 2,
      numberOfNights: 2,
      totalAmount: 13000,
      status: BookingStatus.CONFIRMED,
    },
  });

  const eventBooking = await prisma.eventBooking.create({
    data: {
      bookingNumber: 'EVENT-2026-0001',
      ticketNumber: 'TKT-2026-0001',
      memberId: members[2].id,
      eventId: events[0].id,
      ticketQuantity: 2,
      amount: 2400,
      status: BookingStatus.COMPLETED,
      qrToken: 'QR-EVENT-2026-0001',
      checkedInAt: new Date(),
    },
  });
  await prisma.event.update({
    where: { id: events[0].id },
    data: { availableSeats: { decrement: 2 } },
  });
  await prisma.qrToken.create({
    data: {
      token: eventBooking.qrToken,
      type: QrType.EVENT_TICKET,
      status: QrStatus.USED,
      memberId: members[2].id,
      referenceId: eventBooking.id,
      usedAt: eventBooking.checkedInAt,
    },
  });

  await prisma.feedback.createMany({
    data: [
      {
        memberId: members[0].id,
        serviceType: ServiceType.RESTAURANT,
        restaurantBookingId: restaurantBooking.id,
        rating: 5,
        comments: 'Excellent food and attentive service.',
      },
      {
        memberId: members[1].id,
        serviceType: ServiceType.ROOM,
        roomBookingId: roomBooking.id,
        rating: 4,
        comments: 'Comfortable room and smooth check-in experience.',
      },
      {
        memberId: members[2].id,
        serviceType: ServiceType.EVENT,
        eventBookingId: eventBooking.id,
        rating: 5,
        comments: 'Well-organized event and quick QR entry.',
      },
    ],
  });

  const notificationSeeds = [
    ['Welcome to Member Services', 'Your integrated member services account is ready.', NotificationType.GENERAL],
    ['Upcoming Jazz Evening', 'Bookings are open for Jazz Under the Stars.', NotificationType.EVENT],
    ['Payment Reminder', 'Your annual membership invoice is due soon.', NotificationType.PAYMENT_REMINDER],
    ['Restaurant Booking Tip', 'Reserve weekend dinner slots early to avoid missing out.', NotificationType.GENERAL],
    ['Membership Benefits', 'Explore your library account and other club privileges.', NotificationType.GENERAL],
  ] as const;

  for (const [title, message, type] of notificationSeeds) {
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        audience: NotificationAudience.ALL_MEMBERS,
        publishAt: new Date(),
      },
    });
    await prisma.notificationRecipient.createMany({
      data: members.map((member, index) => ({
        notificationId: notification.id,
        memberId: member.id,
        isRead: index === 4,
        readAt: index === 4 ? new Date() : null,
      })),
    });
  }

  console.log('Seed completed successfully.');
  console.log('Admin: admin@memberservices.test / Admin@123');
  console.log('Member: aarav@example.com or MEM-1001 / Member@123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
