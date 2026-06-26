import { EntitySchema } from "typeorm";

export const Package = new EntitySchema({
    name: "Package",
    tableName: "packages",
    columns: {
        id:          { primary: true, type: "int", generated: true },
        studioId:    { type: "int", nullable: false },
        name:        { type: "varchar", nullable: false },
        description: { type: "text",    nullable: true },
        price:       { type: "decimal", precision: 10, scale: 2, nullable: false },
        duration:    { type: "int",     nullable: true },   // minutes
        includes:    { type: "text",    nullable: true },   // JSON array
        isActive:    { type: "bit",     default: 1 },
        createdAt:   { type: "datetime", createDate: true },
        updatedAt:   { type: "datetime", updateDate: true },
    },
    relations: {
        studio:   { type: "many-to-one", target: "Studio",  joinColumn: { name: "studioId" }, nullable: false },
        bookings: { type: "one-to-many", target: "Booking", inverseSide: "package" },
    },
});
