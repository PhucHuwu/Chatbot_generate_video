import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ["query"],
        datasources: {
            db: {
                url: process.env.MONGODB_URI?.includes(".mongodb.net/?")
                    ? process.env.MONGODB_URI.replace(".mongodb.net/?", ".mongodb.net/chatbot-db?")
                    : process.env.MONGODB_URI,
            },
        },
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
