export class Token {
  private readonly _tokenValue: string;

  constructor(tokenhash: string) {
    this._tokenValue = tokenhash;
  }

  get tokenValue(): string {
    return this._tokenValue;
  }
}
