export class DatabaseError extends Error {
  public readonly statusCode = 500;

  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}
