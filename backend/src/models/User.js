import { EntitySchema } from "typeorm";

export const User = new EntitySchema({
    name: "User",
    tableName: "users",

    columns: {
        id: {
            primary: true,
            type: "uuid",
            generated: "uuid"
        },

        firstName: {
            type: "varchar",
            nullable: false
        },

        lastName: {
            type: "varchar",
            nullable: false
        },

        email: {
            type: "varchar",
            unique: true,
            nullable: false
        },

        passwordHash: {
            type: "varchar",
            nullable: false
        },

        role: {
            type: "varchar",
            nullable: false,
            default: "user"
        },

        isActive: {
            type: "bit",
            default: 1,
            nullable: false
        },

        studioId: {
            type: "int",
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
        studio: {
            type: "many-to-one",
            target: "Studio",
            joinColumn: {
                name: "studioId"
            },
            inverseSide: "users",
            nullable: false
        }
    }
});