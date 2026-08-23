import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {error ? <span className="error">{error}</span> : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const { label, error, ...rest } = props;
  return (
    <Field label={label} error={error}>
      <input {...rest} />
    </Field>
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string }) {
  const { label, error, children, ...rest } = props;
  return (
    <Field label={label} error={error}>
      <select {...rest}>{children}</select>
    </Field>
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  const { label, error, ...rest } = props;
  return (
    <Field label={label} error={error}>
      <textarea {...rest} />
    </Field>
  );
}
