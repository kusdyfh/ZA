/**
 * `resetToken` is only ever populated outside production — ADR 0017
 * §4's disclosed dev-mode stand-in for a real emailed reset link.
 */
export class PasswordResetResponseDto {
  message!: string;
  resetToken?: string;

  static create(resetToken?: string): PasswordResetResponseDto {
    const dto = new PasswordResetResponseDto();
    dto.message = 'If that email is registered, a password reset link has been sent.';
    dto.resetToken = resetToken;
    return dto;
  }
}
