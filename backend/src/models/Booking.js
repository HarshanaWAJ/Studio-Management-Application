import { EntitySchema } from "typeorm";

export const Booking = new EntitySchema({
    name: "Booking",
    tableName: "bookings",
    columns: {
        id:           { primary: true, type: "int", generated: true },
        studioId:     { type: "int",     nullable: false },
        clientId:     { type: "int",     nullable: false },
        packageId:    { type: "int",     nullable: true  },
        assignedStaffId: { type: "uuid", nullable: true }, // optional staff/photographer assigned to this booking
        title:        { type: "varchar", nullable: false },
        description:  { type: "text",    nullable: true  },
        startTime:    { type: "datetime",nullable: false },
        endTime:      { type: "datetime",nullable: false },
        status:       { type: "varchar", default: "pending" }, // pending|confirmed|completed|cancelled
        totalAmount:  { type: "decimal", precision: 10, scale: 2, nullable: true },
        depositPaid:  { type: "decimal", precision: 10, scale: 2, default: 0 },
        notes:        { type: "text",    nullable: true  },
        reminderSent: { type: "bit",     default: 0 },
        createdAt:    { type: "datetime", createDate: true },
        updatedAt:    { type: "datetime", updateDate: true },
    },
    relations: {
        studio:  { type: "many-to-one", target: "Studio",  joinColumn: { name: "studioId" }, nullable: false },
        client:  { type: "many-to-one", target: "Client",  joinColumn: { name: "clientId" }, nullable: false },
        package: { type: "many-to-one", target: "Package", joinColumn: { name: "packageId" }, nullable: true },
        assignedStaff: { type: "many-to-one", target: "User", joinColumn: { name: "assignedStaffId" }, nullable: true },
    },
});
