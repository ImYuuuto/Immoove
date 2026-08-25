import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { formatTranslation, useLanguage } from '../i18n/language';
import { request } from '../utils/request';
import { getCategoryListings } from './api';
import { useCategories } from './useCategories';
import { useCategoryCopy } from './categoryI18n';
import type { CategoryListingsResponse } from './types';
import './category.css';

function initialPage() {
  const page = Number(new URLSearchParams(window.location.search).get('page'));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default function CategoryPage({ slug }: { slug: string }) {
  const copy = useCategoryCopy();
  const { language, text } = useLanguage();
  const categories = useCategories();
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState<CategoryListingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try { setData(await getCategoryListings(slug, page)); }
    catch (cause) { setData(null); setError(cause instanceof Error ? cause.message : copy.unavailable); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [slug, page]);

  const changePage = (nextPage: number) => {
    window.history.replaceState(null, '', `/categories/${slug}?page=${nextPage}`);
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const favorite = async (listingId?: number) => {
    if (!listingId) return;
    try { await request(`/favorites/${listingId}/toggle`, { method: 'POST' }); }
    catch { window.location.assign(`/?login=1&next=${encodeURIComponent(`/categories/${slug}?page=${page}`)}`); }
  };

  const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR';
  const totalPages = data?.pagination.totalPages || 1;

  return <main className="category-page">
    <header className="category-topbar">
      <a className="brand" href="/"><b>B</b>bouzid<span>.</span></a>
      <a href="/categories"><ArrowLeft size={17} />{copy.back}</a>
    </header>
    <nav className="category-navigation" aria-label={text.discover}>
      {categories.map((category) => <a className={category.slug === slug ? 'active' : ''} href={`/categories/${category.slug}`} key={category.categoryId}>{category.name}{category.listingCount !== undefined && <span>{category.listingCount}</span>}</a>)}
    </nav>

    {loading ? <div className="category-state">{copy.loading}</div> : !data ? <div className="category-state"><h1>{copy.unavailable}</h1><p>{error}</p><button onClick={() => void load()}>{copy.retry}</button></div> : <>
      <section className="category-hero">
        <small>{copy.eyebrow}</small>
        <h1>{data.category.name}</h1>
        <p>{data.pagination.total.toLocaleString(locale)} {copy.listings}</p>
      </section>
      <section className="category-results">
        {data.items.length ? <div className="listing-grid">{data.items.map((listing) => <ListingCard listing={listing} onFavorite={favorite} onBook={(item) => item.listingId && window.location.assign(`/listings/${item.listingId}`)} key={listing.listingId} />)}</div> : <div className="category-empty">{copy.empty}</div>}
        {totalPages > 1 && <nav className="category-pagination" aria-label="Pagination">
          <button disabled={page <= 1} onClick={() => changePage(page - 1)}><ArrowLeft size={16} />{copy.previous}</button>
          <span>{formatTranslation(copy.page, { page, total: totalPages })}</span>
          <button disabled={page >= totalPages} onClick={() => changePage(page + 1)}>{copy.next}<ArrowRight size={16} /></button>
        </nav>}
      </section>
    </>}
  </main>;
}
