import { EntitySchema } from "typeorm";

export const Client = new EntitySchema({
    name: "Client",
    tableName: "clients",
    columns: {
        id:          { primary: true, type: "int", generated: true },
        studioId:    { type: "int", nullable: false },
        firstName:   { type: "varchar", nullable: false },
        lastName:    { type: "varchar", nullable: false },
        email:       { type: "varchar", nullable: true },
        phone:       { type: "varchar", nullable: true },
        address:     { type: "varchar", nullable: true },
        notes:       { type: "text",    nullable: true },
        isActive:    { type: "bit", default: 1 },
        createdAt:   { type: "datetime", createDate: true },
        updatedAt:   { type: "datetime", updateDate: true },
    },
    relations: {
        studio:    { type: "many-to-one", target: "Studio",   joinColumn: { name: "studioId" }, nullable: false },
        bookings:  { type: "one-to-many", target: "Booking",  inverseSide: "client" },
        invoices:  { type: "one-to-many", target: "Invoice",  inverseSide: "client" },
        galleries: { type: "one-to-many", target: "Gallery",  inverseSide: "client" },
    },
});
