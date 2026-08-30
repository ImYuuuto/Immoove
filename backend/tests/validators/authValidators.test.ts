import { registerSchema } from '../../src/validators/authValidators';

const registration = {
  first_name: 'Yassine',
  last_name: 'Example',
  email: 'yassine@example.com',
  password: 'a-secure-password',
  acceptTerms: true as const,
  language: 'en' as const,
};

describe('registration legal consent', () => {
  test('accepts an explicit Terms acceptance', () => {
    expect(registerSchema.parse(registration).acceptTerms).toBe(true);
  });

  test.each([undefined, false])('rejects registration when acceptTerms is %s', (acceptTerms) => {
    expect(() => registerSchema.parse({ ...registration, acceptTerms })).toThrow();
  });
});
