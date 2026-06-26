import { EntitySchema } from "typeorm";

export const Quotation = new EntitySchema({
    name: "Quotation",
    tableName: "quotations",
    columns: {
        id:              { primary: true, type: "int", generated: true },
        studioId:        { type: "int",     nullable: false },
        clientId:        { type: "int",     nullable: false },
        quotationNumber: { type: "varchar", nullable: false, unique: true },
        status:          { type: "varchar", default: "draft" }, // draft|sent|accepted|rejected|converted
        items:           { type: "text",    nullable: true  }, // JSON
        subtotal:        { type: "decimal", precision: 10, scale: 2, default: 0 },
        taxRate:         { type: "decimal", precision: 5,  scale: 2, default: 0 },
        taxAmount:       { type: "decimal", precision: 10, scale: 2, default: 0 },
        discountAmount:  { type: "decimal", precision: 10, scale: 2, default: 0 },
        totalAmount:     { type: "decimal", precision: 10, scale: 2, default: 0 },
        validUntil:      { type: "date",    nullable: true  },
        notes:           { type: "text",    nullable: true  },
        convertedInvoiceId: { type: "int",  nullable: true  },
        createdAt:       { type: "datetime", createDate: true },
        updatedAt:       { type: "datetime", updateDate: true },
    },
    relations: {
        studio:  { type: "many-to-one", target: "Studio", joinColumn: { name: "studioId" }, nullable: false },
        client:  { type: "many-to-one", target: "Client", joinColumn: { name: "clientId" }, nullable: false },
    },
});
