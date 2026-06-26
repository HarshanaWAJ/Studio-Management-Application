import { EntitySchema } from "typeorm";

export const Gallery = new EntitySchema({
    name: "Gallery",
    tableName: "galleries",
    columns: {
        id:          { primary: true, type: "int", generated: true },
        studioId:    { type: "int",     nullable: false },
        clientId:    { type: "int",     nullable: false },
        bookingId:   { type: "int",     nullable: true  },
        title:       { type: "varchar", nullable: false },
        description: { type: "text",    nullable: true  },
        shareToken:  { type: "varchar", nullable: true, unique: true },
        isPublic:    { type: "bit",     default: 0 },
        photos:      { type: "text",    nullable: true  }, // JSON array of photo URLs/metadata
        coverPhoto:  { type: "varchar", nullable: true  },
        expiresAt:   { type: "datetime",nullable: true  },
        createdAt:   { type: "datetime", createDate: true },
        updatedAt:   { type: "datetime", updateDate: true },
    },
    relations: {
        studio:  { type: "many-to-one", target: "Studio",  joinColumn: { name: "studioId" }, nullable: false },
        client:  { type: "many-to-one", target: "Client",  joinColumn: { name: "clientId" }, nullable: false },
        booking: { type: "many-to-one", target: "Booking", joinColumn: { name: "bookingId" }, nullable: true },
    },
});
