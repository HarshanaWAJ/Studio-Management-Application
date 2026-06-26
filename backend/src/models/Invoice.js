import { EntitySchema } from "typeorm";

export const Invoice = new EntitySchema({
    name: "Invoice",
    tableName: "invoices",
    columns: {
        id:            { primary: true, type: "int", generated: true },
        studioId:      { type: "int",     nullable: false },
        clientId:      { type: "int",     nullable: false },
        bookingId:     { type: "int",     nullable: true  },
        invoiceNumber: { type: "varchar", nullable: false, unique: true },
        status:        { type: "varchar", default: "draft" }, // draft|sent|paid|overdue|cancelled
        items:         { type: "text",    nullable: true  }, // JSON
        subtotal:      { type: "decimal", precision: 10, scale: 2, default: 0 },
        taxRate:       { type: "decimal", precision: 5,  scale: 2, default: 0 },
        taxAmount:     { type: "decimal", precision: 10, scale: 2, default: 0 },
        discountAmount:{ type: "decimal", precision: 10, scale: 2, default: 0 },
        totalAmount:   { type: "decimal", precision: 10, scale: 2, default: 0 },
        depositAmount: { type: "decimal", precision: 10, scale: 2, default: 0 },
        dueDate:       { type: "date",    nullable: true  },
        paidDate:      { type: "date",    nullable: true  },
        notes:         { type: "text",    nullable: true  },
        createdAt:     { type: "datetime", createDate: true },
        updatedAt:     { type: "datetime", updateDate: true },
    },
    relations: {
        studio:  { type: "many-to-one", target: "Studio",  joinColumn: { name: "studioId" }, nullable: false },
        client:  { type: "many-to-one", target: "Client",  joinColumn: { name: "clientId" }, nullable: false },
        booking: { type: "many-to-one", target: "Booking", joinColumn: { name: "bookingId" }, nullable: true },
    },
});
