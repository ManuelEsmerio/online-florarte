-- AddIndex: emailVerificationToken and passwordResetToken on users table
-- Needed for efficient lookup during email verification and password reset flows

CREATE INDEX `users_emailVerificationToken_idx` ON `users`(`emailVerificationToken`);
CREATE INDEX `users_passwordResetToken_idx` ON `users`(`passwordResetToken`);
