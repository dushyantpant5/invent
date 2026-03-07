describe('lib/crypto/encryption', () => {
  const originalSecret = process.env.USER_PAYLOAD_SECRET;

  afterAll(() => {
    process.env.USER_PAYLOAD_SECRET = originalSecret;
  });

  async function loadModule() {
    vi.resetModules();
    return import('@/lib/crypto/encryption');
  }

  it('encrypts and decrypts signup payload', async () => {
    process.env.USER_PAYLOAD_SECRET = 'a-very-strong-secret';
    const encryption = await loadModule();

    const encrypted = await encryption.encryptSignupPayload({
      email: 'user@example.com',
      password: 'Passw0rd!',
    });
    const decrypted = await encryption.decryptSignUpPayload(encrypted);

    expect(encrypted).not.toContain('user@example.com');
    expect(decrypted).toEqual({ email: 'user@example.com', password: 'Passw0rd!' });
  });

  it('encrypts and decrypts inventory data', async () => {
    process.env.USER_PAYLOAD_SECRET = 'a-very-strong-secret';
    const encryption = await loadModule();

    const encrypted = await encryption.encryptInventoryData('inv-123');
    const decrypted = await encryption.decryptInventoryData(encrypted);

    expect(decrypted).toBe('inv-123');
  });

  it('fails if USER_PAYLOAD_SECRET is missing', async () => {
    delete process.env.USER_PAYLOAD_SECRET;
    const encryption = await loadModule();

    await expect(encryption.encryptInventoryData('inv-123')).rejects.toThrow(
      'USER_PAYLOAD_SECRET environment variable is missing'
    );
  });

  it('fails when ciphertext is too short', async () => {
    process.env.USER_PAYLOAD_SECRET = 'a-very-strong-secret';
    const encryption = await loadModule();

    await expect(encryption.decryptInventoryData('AQI=')).rejects.toThrow('Ciphertext too short');
  });
});
