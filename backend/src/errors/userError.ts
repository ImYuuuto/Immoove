export class UserError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly fields?: Record<string, string>
  ) {
    super(message);
    this.name = "UserError";
  }
}
