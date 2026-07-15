-- Initial MySQL 8 migration for Integrated Member Services.
-- Generated to match prisma/schema.prisma. Apply with: npm run prisma:deploy

CREATE TABLE `User` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(191) NOT NULL,
  `role` ENUM('ADMIN','MEMBER') NOT NULL,
  `status` ENUM('ACTIVE','DISABLED') NOT NULL DEFAULT 'ACTIVE',
  `memberId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `User_email_key`(`email`),
  UNIQUE INDEX `User_memberId_key`(`memberId`),
  INDEX `User_role_status_idx`(`role`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Member` (
  `id` VARCHAR(191) NOT NULL,
  `memberCode` VARCHAR(191) NOT NULL,
  `fullName` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `mobileNumber` VARCHAR(191) NOT NULL,
  `address` TEXT NOT NULL,
  `profilePhotoUrl` TEXT NULL,
  `dateOfBirth` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Member_memberCode_key`(`memberCode`),
  UNIQUE INDEX `Member_email_key`(`email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Membership` (
  `id` VARCHAR(191) NOT NULL,
  `memberId` VARCHAR(191) NOT NULL,
  `membershipType` VARCHAR(191) NOT NULL,
  `status` ENUM('ACTIVE','INACTIVE','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
  `validFrom` DATETIME(3) NOT NULL,
  `validUntil` DATETIME(3) NOT NULL,
  `digitalCardActive` BOOLEAN NOT NULL DEFAULT true,
  `verificationToken` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Membership_memberId_key`(`memberId`),
  UNIQUE INDEX `Membership_verificationToken_key`(`verificationToken`),
  INDEX `Membership_status_validUntil_idx`(`status`, `validUntil`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `RfidRecord` (
  `id` VARCHAR(191) NOT NULL,
  `memberId` VARCHAR(191) NOT NULL,
  `referenceNumber` VARCHAR(191) NOT NULL,
  `cardNumber` VARCHAR(191) NOT NULL,
  `status` ENUM('ACTIVE','INACTIVE','BLOCKED','EXPIRED') NOT NULL,
  `activationDate` DATETIME(3) NULL,
  `expiryDate` DATETIME(3) NOT NULL,
  `accessAllowed` BOOLEAN NOT NULL DEFAULT false,
  `lastVerificationDate` DATETIME(3) NULL,
  `lastVerificationResult` ENUM('VALID','INVALID') NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `RfidRecord_memberId_key`(`memberId`),
  UNIQUE INDEX `RfidRecord_referenceNumber_key`(`referenceNumber`),
  UNIQUE INDEX `RfidRecord_cardNumber_key`(`cardNumber`),
  INDEX `RfidRecord_status_expiryDate_idx`(`status`, `expiryDate`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Restaurant` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `openingTime` VARCHAR(191) NOT NULL,
  `closingTime` VARCHAR(191) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `imageUrl` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `RestaurantSlot` (
  `id` VARCHAR(191) NOT NULL,
  `restaurantId` VARCHAR(191) NOT NULL,
  `bookingDate` DATE NOT NULL,
  `startTime` VARCHAR(191) NOT NULL,
  `endTime` VARCHAR(191) NOT NULL,
  `capacity` INTEGER NOT NULL,
  `bookedCapacity` INTEGER NOT NULL DEFAULT 0,
  `isAvailable` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `RestaurantSlot_restaurantId_bookingDate_startTime_key`(`restaurantId`, `bookingDate`, `startTime`),
  INDEX `RestaurantSlot_bookingDate_isAvailable_idx`(`bookingDate`, `isAvailable`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `RestaurantBooking` (
  `id` VARCHAR(191) NOT NULL,
  `bookingNumber` VARCHAR(191) NOT NULL,
  `memberId` VARCHAR(191) NOT NULL,
  `restaurantId` VARCHAR(191) NOT NULL,
  `slotId` VARCHAR(191) NOT NULL,
  `guestCount` INTEGER NOT NULL,
  `specialInstructions` TEXT NULL,
  `status` ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
  `qrToken` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `RestaurantBooking_bookingNumber_key`(`bookingNumber`),
  UNIQUE INDEX `RestaurantBooking_qrToken_key`(`qrToken`),
  INDEX `RestaurantBooking_memberId_status_idx`(`memberId`, `status`),
  INDEX `RestaurantBooking_slotId_status_idx`(`slotId`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Room` (
  `id` VARCHAR(191) NOT NULL,
  `roomNumber` VARCHAR(191) NOT NULL,
  `roomName` VARCHAR(191) NOT NULL,
  `roomType` VARCHAR(191) NOT NULL,
  `pricePerNight` DECIMAL(10,2) NOT NULL,
  `guestCapacity` INTEGER NOT NULL,
  `amenities` JSON NOT NULL,
  `status` ENUM('AVAILABLE','UNAVAILABLE','MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
  `imageUrl` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Room_roomNumber_key`(`roomNumber`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `RoomBooking` (
  `id` VARCHAR(191) NOT NULL,
  `bookingNumber` VARCHAR(191) NOT NULL,
  `memberId` VARCHAR(191) NOT NULL,
  `roomId` VARCHAR(191) NOT NULL,
  `checkInDate` DATE NOT NULL,
  `checkOutDate` DATE NOT NULL,
  `guestCount` INTEGER NOT NULL,
  `numberOfNights` INTEGER NOT NULL,
  `totalAmount` DECIMAL(10,2) NOT NULL,
  `status` ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `RoomBooking_bookingNumber_key`(`bookingNumber`),
  INDEX `RoomBooking_roomId_checkInDate_checkOutDate_idx`(`roomId`, `checkInDate`, `checkOutDate`),
  INDEX `RoomBooking_memberId_status_idx`(`memberId`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Event` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(191) NOT NULL,
  `eventDate` DATE NOT NULL,
  `startTime` VARCHAR(191) NOT NULL,
  `endTime` VARCHAR(191) NOT NULL,
  `venue` VARCHAR(191) NOT NULL,
  `ticketPrice` DECIMAL(10,2) NOT NULL,
  `totalCapacity` INTEGER NOT NULL,
  `availableSeats` INTEGER NOT NULL,
  `status` ENUM('DRAFT','PUBLISHED','CANCELLED','COMPLETED') NOT NULL DEFAULT 'DRAFT',
  `bannerUrl` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `Event_eventDate_status_idx`(`eventDate`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EventBooking` (
  `id` VARCHAR(191) NOT NULL,
  `bookingNumber` VARCHAR(191) NOT NULL,
  `ticketNumber` VARCHAR(191) NOT NULL,
  `memberId` VARCHAR(191) NOT NULL,
  `eventId` VARCHAR(191) NOT NULL,
  `ticketQuantity` INTEGER NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `status` ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
  `qrToken` VARCHAR(191) NOT NULL,
  `checkedInAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `EventBooking_bookingNumber_key`(`bookingNumber`),
  UNIQUE INDEX `EventBooking_ticketNumber_key`(`ticketNumber`),
  UNIQUE INDEX `EventBooking_qrToken_key`(`qrToken`),
  INDEX `EventBooking_eventId_status_idx`(`eventId`, `status`),
  INDEX `EventBooking_memberId_status_idx`(`memberId`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Invoice` (
  `id` VARCHAR(191) NOT NULL,
  `invoiceNumber` VARCHAR(191) NOT NULL,
  `memberId` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `issueDate` DATE NOT NULL,
  `dueDate` DATE NOT NULL,
  `status` ENUM('UNPAID','PAID','OVERDUE','CANCELLED') NOT NULL DEFAULT 'UNPAID',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Invoice_invoiceNumber_key`(`invoiceNumber`),
  INDEX `Invoice_memberId_status_idx`(`memberId`, `status`),
  INDEX `Invoice_dueDate_status_idx`(`dueDate`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Payment` (
  `id` VARCHAR(191) NOT NULL,
  `transactionId` VARCHAR(191) NOT NULL,
  `memberId` VARCHAR(191) NOT NULL,
  `invoiceId` VARCHAR(191) NULL,
  `roomBookingId` VARCHAR(191) NULL,
  `eventBookingId` VARCHAR(191) NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `paymentMethod` ENUM('SIMULATED','CASH','CARD','UPI') NOT NULL,
  `paymentType` ENUM('INVOICE','ROOM_BOOKING','EVENT_BOOKING') NOT NULL,
  `status` ENUM('PENDING','SUCCESS','FAILED','REFUNDED') NOT NULL DEFAULT 'SUCCESS',
  `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `Payment_transactionId_key`(`transactionId`),
  UNIQUE INDEX `Payment_invoiceId_key`(`invoiceId`),
  INDEX `Payment_memberId_status_paidAt_idx`(`memberId`, `status`, `paidAt`),
  INDEX `Payment_roomBookingId_idx`(`roomBookingId`),
  INDEX `Payment_eventBookingId_idx`(`eventBookingId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Notification` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('GENERAL','EVENT','BOOKING_CONFIRMATION','BOOKING_CANCELLATION','PAYMENT_REMINDER','MEMBERSHIP_EXPIRY') NOT NULL,
  `audience` ENUM('ALL_MEMBERS','ACTIVE_MEMBERS','SELECTED_MEMBER','MEMBERSHIP_TYPE') NOT NULL,
  `membershipType` VARCHAR(191) NULL,
  `publishAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `Notification_publishAt_audience_idx`(`publishAt`, `audience`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `NotificationRecipient` (
  `id` VARCHAR(191) NOT NULL,
  `notificationId` VARCHAR(191) NOT NULL,
  `memberId` VARCHAR(191) NOT NULL,
  `isRead` BOOLEAN NOT NULL DEFAULT false,
  `readAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `NotificationRecipient_notificationId_memberId_key`(`notificationId`, `memberId`),
  INDEX `NotificationRecipient_memberId_isRead_idx`(`memberId`, `isRead`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Feedback` (
  `id` VARCHAR(191) NOT NULL,
  `memberId` VARCHAR(191) NOT NULL,
  `serviceType` ENUM('RESTAURANT','ROOM','EVENT') NOT NULL,
  `restaurantBookingId` VARCHAR(191) NULL,
  `roomBookingId` VARCHAR(191) NULL,
  `eventBookingId` VARCHAR(191) NULL,
  `rating` INTEGER NOT NULL,
  `comments` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `Feedback_restaurantBookingId_key`(`restaurantBookingId`),
  UNIQUE INDEX `Feedback_roomBookingId_key`(`roomBookingId`),
  UNIQUE INDEX `Feedback_eventBookingId_key`(`eventBookingId`),
  INDEX `Feedback_serviceType_rating_idx`(`serviceType`, `rating`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AdditionalServiceAccount` (
  `id` VARCHAR(191) NOT NULL,
  `memberId` VARCHAR(191) NOT NULL,
  `serviceType` ENUM('LIBRARY','GYM','WORKSPACE','PARKING') NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `details` JSON NOT NULL,
  `validUntil` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `AdditionalServiceAccount_memberId_serviceType_key`(`memberId`, `serviceType`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `QrToken` (
  `id` VARCHAR(191) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `type` ENUM('MEMBERSHIP','RESTAURANT_BOOKING','EVENT_TICKET') NOT NULL,
  `status` ENUM('ACTIVE','USED','CANCELLED','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
  `memberId` VARCHAR(191) NOT NULL,
  `referenceId` VARCHAR(191) NOT NULL,
  `usedAt` DATETIME(3) NULL,
  `expiresAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `QrToken_token_key`(`token`),
  INDEX `QrToken_type_status_idx`(`type`, `status`),
  INDEX `QrToken_memberId_type_idx`(`memberId`, `type`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `User` ADD CONSTRAINT `User_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Membership` ADD CONSTRAINT `Membership_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `RfidRecord` ADD CONSTRAINT `RfidRecord_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `RestaurantSlot` ADD CONSTRAINT `RestaurantSlot_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `RestaurantBooking` ADD CONSTRAINT `RestaurantBooking_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `RestaurantBooking` ADD CONSTRAINT `RestaurantBooking_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `RestaurantBooking` ADD CONSTRAINT `RestaurantBooking_slotId_fkey` FOREIGN KEY (`slotId`) REFERENCES `RestaurantSlot`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `RoomBooking` ADD CONSTRAINT `RoomBooking_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `RoomBooking` ADD CONSTRAINT `RoomBooking_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `EventBooking` ADD CONSTRAINT `EventBooking_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `EventBooking` ADD CONSTRAINT `EventBooking_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_roomBookingId_fkey` FOREIGN KEY (`roomBookingId`) REFERENCES `RoomBooking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_eventBookingId_fkey` FOREIGN KEY (`eventBookingId`) REFERENCES `EventBooking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `Notification`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Feedback` ADD CONSTRAINT `Feedback_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Feedback` ADD CONSTRAINT `Feedback_restaurantBookingId_fkey` FOREIGN KEY (`restaurantBookingId`) REFERENCES `RestaurantBooking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Feedback` ADD CONSTRAINT `Feedback_roomBookingId_fkey` FOREIGN KEY (`roomBookingId`) REFERENCES `RoomBooking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Feedback` ADD CONSTRAINT `Feedback_eventBookingId_fkey` FOREIGN KEY (`eventBookingId`) REFERENCES `EventBooking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `AdditionalServiceAccount` ADD CONSTRAINT `AdditionalServiceAccount_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `QrToken` ADD CONSTRAINT `QrToken_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
