// src/app/api/users/change-password/route.ts

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getDecodedToken } from "@/utils/auth";
import { successResponse, errorHandler } from "@/utils/api-utils";
import * as z from "zod";

/* ===============================
   Validation
=================================*/

const schema = z.object({
  currentPassword: z
    .string()
    .min(1, "La contraseña actual es requerida"),

  newPassword: z
    .string()
    .min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
});

/* ===============================
   Handler
=================================*/

export async function PUT(req: NextRequest) {
  try {
    /* ===============================
       Auth
    ================================*/

    const session = await getDecodedToken(req);

    if (!session?.dbId) {
      return errorHandler(new Error("No autorizado"), 401);
    }

    /* ===============================
       Body
    ================================*/

    const body = await req.json();

    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return errorHandler(
        new Error("Datos inválidos"),
        400
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    /* ===============================
       Get User
    ================================*/

    const user = await prisma.user.findUnique({
      where: { id: session.dbId },
      select: {
        passwordHash: true,
        isDeleted: true,
      },
    });

    if (!user || user.isDeleted || !user.passwordHash) {
      return errorHandler(
        new Error("Usuario no válido"),
        401
      );
    }

    /* ===============================
       Verify Current Password
    ================================*/

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isValidPassword) {
      return errorHandler(
        new Error("La contraseña actual es incorrecta"),
        400
      );
    }

    /* ===============================
       Hash New Password
    ================================*/

    const newHash = await bcrypt.hash(newPassword, 12);

    /* ===============================
       Update
    ================================*/

    await prisma.user.update({
      where: { id: session.dbId },
      data: {
        passwordHash: newHash,
      },
    });

    /* ===============================
       Response
    ================================*/

    return successResponse({
      message: "Contraseña actualizada correctamente",
    });

  } catch (error) {

    console.error("[CHANGE_PASSWORD]", error);

    return errorHandler(
      new Error("No se pudo cambiar la contraseña"),
      500
    );
  }
}