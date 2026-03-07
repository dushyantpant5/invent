describe('helpers/encryption', () => {
  const originalSecret = process.env.USER_PAYLOAD_SECRET;

  afterAll(() => {
    process.env.USER_PAYLOAD_SECRET = originalSecret;
  });

  async function loadModule() {
    vi.resetModules();
    return import('@/helpers/encryption');
  }

  it('round-trips signup payload', async () => {
    process.env.USER_PAYLOAD_SECRET = 'another-strong-secret';
    const encryption = await loadModule();

    const encrypted = await encryption.encryptSignupPayload({
      email: 'legacy@example.com',
      password: 'Passw0rd!',
    });
    const decrypted = await encryption.decryptSignUpPayload(encrypted);

    expect(decrypted).toEqual({ email: 'legacy@example.com', password: 'Passw0rd!' });
  });

  it('round-trips inventory data', async () => {
    process.env.USER_PAYLOAD_SECRET = 'another-strong-secret';
    const encryption = await loadModule();

    const encrypted = await encryption.encryptInventoryData('legacy-inv');
    const decrypted = await encryption.decryptInventoryData(encrypted);

    expect(decrypted).toBe('legacy-inv');
  });
});
