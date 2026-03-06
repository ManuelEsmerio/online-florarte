-- AddColumn: tokenVersion en users
-- Incrementar este valor invalida todos los JWT activos del usuario.
-- Usado al cambiar contraseña o cambiar rol para forzar re-login.
ALTER TABLE `users`
  ADD COLUMN `tokenVersion` INT NOT NULL DEFAULT 1;
