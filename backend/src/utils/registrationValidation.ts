import { UserError } from "../errors/userError.js";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 50;

const REGISTERABLE_ROLES = ["client", "provider"] as const;
export type RegisterableRole = (typeof REGISTERABLE_ROLES)[number];

/** Practical RFC 5322–inspired email pattern (not full spec). */
const EMAIL_REGEX =
  /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;

const NAME_REGEX = /^[\p{L}\s'-]+$/u;

/** E.164: leading +, country code 1–9, total 2–15 digits after +. */
const E164_REGEX = /^\+[1-9]\d{1,14}$/;

const PASSWORD_UPPERCASE = /[A-Z]/;
const PASSWORD_LOWERCASE = /[a-z]/;
const PASSWORD_DIGIT = /\d/;
const PASSWORD_SPECIAL = /[!@#$%^&*()_+\-=[\]{}|;:'",.<>/?\\`~]/;

const PASSWORD_BLACKLIST = new Set(
  [
    "123456",
    "12345678",
    "123456789",
    "1234567890",
    "password",
    "password1",
    "password123",
    "qwerty",
    "qwerty123",
    "abc123",
    "111111",
    "123123",
    "admin",
    "admin123",
    "letmein",
    "welcome",
    "monkey",
    "dragon",
    "master",
    "login",
    "passw0rd",
    "iloveyou",
    "sunshine",
    "princess",
    "football",
    "shadow",
    "superman",
    "trustno1",
  ].map((p) => p.toLowerCase())
);

export interface RegistrationInput {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
  phone?: unknown;
  role?: unknown;
  termsAccepted?: unknown;
}

export interface ValidatedRegistration {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: RegisterableRole;
}

function asTrimmedString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function validateFirstName(value: unknown): string | undefined {
  const name = asTrimmedString(value);
  if (!name) return "First name is required";
  if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
    return `First name must be between ${MIN_NAME_LENGTH} and ${MAX_NAME_LENGTH} characters`;
  }
  if (!NAME_REGEX.test(name)) {
    return "First name may only contain letters, spaces, hyphens, and apostrophes";
  }
  return undefined;
}

function validateLastName(value: unknown): string | undefined {
  const name = asTrimmedString(value);
  if (!name) return "Last name is required";
  if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
    return `Last name must be between ${MIN_NAME_LENGTH} and ${MAX_NAME_LENGTH} characters`;
  }
  if (!NAME_REGEX.test(name)) {
    return "Last name may only contain letters, spaces, hyphens, and apostrophes";
  }
  return undefined;
}

function validateEmail(value: unknown): { error?: string; normalized?: string } {
  const email = asTrimmedString(value);
  if (!email) return { error: "Email is required" };
  if (email.length > 150) return { error: "Email must not exceed 150 characters" };
  if (!EMAIL_REGEX.test(email)) return { error: "Email format is invalid" };
  return { normalized: email.toLowerCase() };
}

function validatePassword(value: unknown): string | undefined {
  if (typeof value !== "string" || !value) {
    return "Password is required";
  }

  const byteLength = Buffer.byteLength(value, "utf8");
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (byteLength > MAX_PASSWORD_LENGTH) {
    return `Password must not exceed ${MAX_PASSWORD_LENGTH} characters (bcrypt limit)`;
  }
  if (!PASSWORD_UPPERCASE.test(value)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!PASSWORD_LOWERCASE.test(value)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!PASSWORD_DIGIT.test(value)) {
    return "Password must contain at least one number";
  }
  if (!PASSWORD_SPECIAL.test(value)) {
    return "Password must contain at least one special character";
  }
  if (PASSWORD_BLACKLIST.has(value.toLowerCase())) {
    return "Password is too common; please choose a stronger password";
  }
  return undefined;
}

function validateConfirmPassword(password: string, confirmPassword: unknown): string | undefined {
  if (typeof confirmPassword !== "string" || !confirmPassword) {
    return "Password confirmation is required";
  }
  if (confirmPassword !== password) {
    return "Passwords do not match";
  }
  return undefined;
}

function validatePhone(value: unknown): { error?: string; normalized?: string } {
  if (value === undefined || value === null || value === "") {
    return {};
  }

  const phone = asTrimmedString(value);
  if (!phone) return {};

  if (!E164_REGEX.test(phone)) {
    return { error: "Phone number must be in E.164 format (e.g. +21612345678)" };
  }
  return { normalized: phone };
}

function validateRole(value: unknown): { error?: string; role?: RegisterableRole } {
  if (value === undefined || value === null || value === "") {
    return { role: "client" };
  }

  if (typeof value !== "string") {
    return { error: "Role must be a string" };
  }

  const role = value.trim().toLowerCase();
  if (!REGISTERABLE_ROLES.includes(role as RegisterableRole)) {
    return { error: "Role must be either client or provider" };
  }
  return { role: role as RegisterableRole };
}

function validateTermsAccepted(value: unknown): string | undefined {
  if (value !== true) {
    return "You must accept the terms and privacy policy";
  }
  return undefined;
}

export function validateRegistrationInput(input: RegistrationInput): ValidatedRegistration {
  const fieldErrors: Record<string, string> = {};

  const firstNameError = validateFirstName(input.firstName);
  if (firstNameError) fieldErrors.firstName = firstNameError;

  const lastNameError = validateLastName(input.lastName);
  if (lastNameError) fieldErrors.lastName = lastNameError;

  const emailResult = validateEmail(input.email);
  if (emailResult.error) fieldErrors.email = emailResult.error;

  const password =
    typeof input.password === "string" && input.password ? input.password : "";
  const passwordError = validatePassword(input.password);
  if (passwordError) fieldErrors.password = passwordError;

  const confirmError = validateConfirmPassword(password, input.confirmPassword);
  if (confirmError) fieldErrors.confirmPassword = confirmError;

  const phoneResult = validatePhone(input.phone);
  if (phoneResult.error) fieldErrors.phone = phoneResult.error;

  const roleResult = validateRole(input.role);
  if (roleResult.error) fieldErrors.role = roleResult.error;

  const termsError = validateTermsAccepted(input.termsAccepted);
  if (termsError) fieldErrors.termsAccepted = termsError;

  if (Object.keys(fieldErrors).length > 0) {
    throw new UserError("Validation failed", 400, fieldErrors);
  }

  return {
    firstName: asTrimmedString(input.firstName),
    lastName: asTrimmedString(input.lastName),
    email: emailResult.normalized!,
    password,
    ...(phoneResult.normalized !== undefined && { phone: phoneResult.normalized }),
    role: roleResult.role!,
  };
}
