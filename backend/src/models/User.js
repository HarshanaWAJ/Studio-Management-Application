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

        // ── Staff / HR fields ──────────────────────────────────────────
        phone: {
            type: "varchar",
            nullable: true
        },

        jobTitle: {
            type: "varchar",
            nullable: true
        },

        department: {
            type: "varchar",
            nullable: true
        },

        employeeId: {
            type: "varchar",
            nullable: true
        },

        hireDate: {
            type: "date",
            nullable: true
        },

        // active | on_leave | suspended | inactive
        status: {
            type: "varchar",
            default: "active",
            nullable: false
        },

        // JSON string: { grant: string[], revoke: string[] } — per-user overrides
        // layered on top of the role's default permission set.
        permissions: {
            type: "text",
            nullable: true
        },

        invitedBy: {
            type: "uuid",
            nullable: true
        },

        // ── Email verification ─────────────────────────────────────────
        isEmailVerified: {
            type: "bit",
            default: 0,
            nullable: false
        },

        emailVerificationToken: {
            type: "varchar",
            nullable: true
        },

        emailVerificationExpires: {
            type: "datetime",
            nullable: true
        },

        // ── Password reset ─────────────────────────────────────────────
        passwordResetToken: {
            type: "varchar",
            nullable: true
        },

        passwordResetExpires: {
            type: "datetime",
            nullable: true
        },

        // Set when a staff account is invited but hasn't set a password yet
        mustSetPassword: {
            type: "bit",
            default: 0,
            nullable: false
        },

        // ── OTP (email register / password reset) ───────────────────────
        // A single OTP "slot" per user — only one purpose can be pending at
        // a time. otpCodeHash stores a bcrypt hash of the 6-digit code, never
        // the raw code itself.
        otpCodeHash: {
            type: "varchar",
            nullable: true
        },

        // "email_verification" | "password_reset"
        otpPurpose: {
            type: "varchar",
            nullable: true
        },

        otpExpires: {
            type: "datetime",
            nullable: true
        },

        otpAttempts: {
            type: "int",
            default: 0,
            nullable: false
        },

        // Short-lived proof token issued after a password-reset OTP is
        // successfully verified — required by the final "set new password"
        // step so the OTP itself can't be replayed.
        otpResetProofToken: {
            type: "varchar",
            nullable: true
        },

        otpResetProofExpires: {
            type: "datetime",
            nullable: true
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