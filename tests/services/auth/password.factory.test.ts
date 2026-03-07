import { PasswordFactory } from '@/services/auth/password-factory/password.factory';

describe('PasswordFactory', () => {
  it('generates hash and verifies matching password', async () => {
    const hash = await PasswordFactory.generateHashPassword('Passw0rd!');

    expect(hash).not.toBe('Passw0rd!');
    await expect(PasswordFactory.verify('Passw0rd!', hash)).resolves.toBe(true);
    await expect(PasswordFactory.verify('WrongPass1!', hash)).resolves.toBe(false);
  });

  it('throws when plain or hash is missing', async () => {
    await expect(PasswordFactory.verify('', 'hash')).rejects.toThrow(
      'Password and hash are required for verification'
    );
    await expect(PasswordFactory.verify('plain', '')).rejects.toThrow(
      'Password and hash are required for verification'
    );
  });
});
