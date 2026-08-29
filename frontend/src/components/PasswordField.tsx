import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../i18n/language';

const labels = {
  fr: { show: 'Afficher le mot de passe', hide: 'Masquer le mot de passe' },
  en: { show: 'Show password', hide: 'Hide password' },
  ar: { show: 'إظهار كلمة المرور', hide: 'إخفاء كلمة المرور' },
};

export default function PasswordField(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);
  const label = visible ? labels[language].hide : labels[language].show;

  return (
    <div className="password-field">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={label}
        title={label}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
  );
}
