import { EntitySchema } from "typeorm";

export const Studio = new EntitySchema({
    name: "Studio",
    tableName: "studios",

    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },

        studioName: {
            type: "varchar",
            nullable: false
        },

        email: {
            type: "varchar",
            unique: true,
            nullable: false
        },

        phone: {
            type: "varchar",
            unique: true,
            nullable: false
        },

        address: {
            type: "varchar",
            nullable: false
        },

        // e.g. "Wedding & Portrait Photography" — feeds the AI website builder
        category: {
            type: "varchar",
            nullable: true
        },

        description: {
            type: "text",
            nullable: true
        },

        isActive: {
            type: "bit",
            default: 1,
            nullable: false
        },

        createdAt: {
            type: "datetime",
            createDate: true
        },

        updatedAt: {
            type: "datetime",
            updateDate: true
        }
    },

    relations: {
        users: {
            type: "one-to-many",
            target: "User",
            inverseSide: "studio"
        }
    }
});