import { EntitySchema } from "typeorm";

// Dedicated "Contact Us" table — kept separate from Client so every raw
// website inquiry is preserved for analytics, even ones that never convert
// into a client/booking (source, status funnel, response time, etc.)
export const ContactSubmission = new EntitySchema({
    name: "ContactSubmission",
    tableName: "contact_submissions",
    columns: {
        id:        { primary: true, type: "int", generated: true },
        studioId:  { type: "int", nullable: false },

        name:    { type: "varchar", nullable: false },
        email:   { type: "varchar", nullable: false },
        phone:   { type: "varchar", nullable: true },
        message: { type: "text",    nullable: false },

        // Where the message came from — lets analytics break down channels
        source: { type: "varchar", default: "website" }, // website | booking_widget | manual

        // Funnel status, editable by studio staff
        status: { type: "varchar", default: "new" }, // new | contacted | converted | archived

        // Linked once a studio member turns this into a real client/booking
        clientId:  { type: "int", nullable: true },
        bookingId: { type: "int", nullable: true },

        respondedAt: { type: "datetime", nullable: true },

        createdAt: { type: "datetime", createDate: true },
        updatedAt: { type: "datetime", updateDate: true },
    },
    relations: {
        studio: { type: "many-to-one", target: "Studio", joinColumn: { name: "studioId" }, nullable: false },
    },
});
