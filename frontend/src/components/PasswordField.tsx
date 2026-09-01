import type { InputHTMLAttributes } from 'react';

export default function PasswordField(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return <input {...props} type="password" spellCheck={false} />;
}
