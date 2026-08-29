import { ArrowLeft } from 'lucide-react';
import CategoryGrid from '../components/CategoryGrid';
import { useCategoryCopy } from './categoryI18n';
import './category.css';

export default function CategoriesPage() {
  const copy = useCategoryCopy();

  return (
    <main className="category-page category-directory-page">
      <header className="category-topbar">
        <a className="brand" href="/">
          <b>B</b>bouzid<span>.</span>
        </a>
        <a href="/">
          <ArrowLeft size={17} />
          {copy.back}
        </a>
      </header>
      <CategoryGrid
        onAnnouncement={() => window.location.assign('/?login=1')}
        showAnnouncement={false}
      />
    </main>
  );
}
