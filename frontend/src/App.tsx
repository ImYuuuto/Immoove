import { useState, useEffect } from 'react';

interface User {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'client' | 'provider' | 'admin';
  phone?: string;
}

interface Category {
  categoryId: number;
  name: string;
  slug: string;
  description?: string;
}

interface Location {
  locationId: number;
  cityName: string;
  country: string;
}

interface Listing {
  listingId: number;
  providerId: number;
  categoryId: number;
  locationId: number;
  title: string;
  description?: string;
  basePrice: string | number;
  pricingUnit: 'per_night' | 'per_day' | 'per_hour' | 'per_service';
  isActive: boolean;
  category?: Category;
  location?: Location;
}

function App() {
  // --- STATE ---
  const [health, setHealth] = useState<{ status: string; timestamp: string } | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('youssef.mansouri@example.tn'); // Default seeded client
  const [authPassword, setAuthPassword] = useState('Password123!'); // Default seeded password
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<'client' | 'provider'>('client');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catError, setCatError] = useState<string | null>(null);

  // Listing Form State
  const [listTitle, setListTitle] = useState('');
  const [listDesc, setListDesc] = useState('');
  const [listPrice, setListPrice] = useState('50');
  const [listUnit, setListUnit] = useState<'per_night' | 'per_day' | 'per_hour' | 'per_service'>('per_day');
  const [listCatId, setListCatId] = useState('');
  const [listLocId, setListLocId] = useState('1'); // Default to Sidi Bouzid (id: 1)
  const [listError, setListError] = useState<string | null>(null);

  // Static list of locations corresponding to seeded data
  const locations: Location[] = [
    { locationId: 1, cityName: 'Sidi Bouzid', country: 'Tunisia' },
    { locationId: 2, cityName: 'Regueb', country: 'Tunisia' },
    { locationId: 3, cityName: 'Meknassy', country: 'Tunisia' },
    { locationId: 4, cityName: 'Sfax', country: 'Tunisia' },
  ];

  // --- API CALLS ---

  // Check backend health
  const checkHealth = async () => {
    try {
      setHealthError(null);
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json();
      setHealth(data);
    } catch (err: any) {
      setHealth(null);
      setHealthError(err.message || 'Could not connect to backend');
    }
  };

  // Fetch current user profile
  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/users/profile');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (data.length > 0 && !listCatId) {
          setListCatId(data[0].categoryId.toString());
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch Listings
  const fetchListings = async () => {
    try {
      const res = await fetch('/api/listings');
      if (res.ok) {
        const data = await res.json();
        // The API returns paginated listings in shape { items: Listing[], pagination: ... }
        setListings(data.items || data);
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
    }
  };

  // Initial load
  useEffect(() => {
    checkHealth();
    fetchProfile();
    fetchCategories();
    fetchListings();
  }, []);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      setUser(data);
      setAuthSuccess('Logged in successfully!');
      fetchListings(); // Refresh listings list since auth role might affect it or enable delete
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
          firstName: regFirstName,
          lastName: regLastName,
          phone: regPhone || undefined,
          role: regRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      setUser(data);
      setAuthSuccess('Registered & Logged in successfully!');
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST' });
      setUser(null);
      setAuthSuccess('Logged out successfully');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Handle Category Creation
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError(null);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: catName,
          slug: catSlug,
          description: catDesc || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create category');
      }
      setCatName('');
      setCatSlug('');
      setCatDesc('');
      fetchCategories();
    } catch (err: any) {
      setCatError(err.message);
    }
  };

  // Handle Listing Creation
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setListError(null);
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: listTitle,
          description: listDesc || undefined,
          basePrice: parseFloat(listPrice),
          pricingUnit: listUnit,
          categoryId: parseInt(listCatId),
          locationId: parseInt(listLocId),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create listing');
      }
      setListTitle('');
      setListDesc('');
      setListPrice('50');
      fetchListings();
    } catch (err: any) {
      setListError(err.message);
    }
  };

  // Handle Listing Deletion
  const handleDeleteListing = async (listingId: number) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      const res = await fetch(`/api/listings/${listingId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete listing');
      }
      fetchListings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={styles.container}>
      {/* Dynamic Style Injection */}
      <style dangerouslySetInnerHTML={{ __html: globalCSS }} />

      <header style={styles.header}>
        <h1 style={styles.title}>Sidi Bouzid Marketplace - Test Dashboard</h1>
        <p style={styles.subtitle}>Minimal Frontend Verification UI for Backend Integration</p>
      </header>

      {/* Health check section */}
      <section style={styles.section}>
        <div style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Backend Connection Status</h2>
            {health ? (
              <p style={{ margin: '5px 0 0 0', color: '#2e7d32' }}>
                🟢 <strong>Online</strong> (Timestamp: {new Date(health.timestamp).toLocaleString()})
              </p>
            ) : healthError ? (
              <p style={{ margin: '5px 0 0 0', color: '#c62828' }}>
                🔴 <strong>Offline:</strong> {healthError}
              </p>
            ) : (
              <p style={{ margin: '5px 0 0 0', color: '#ff8f00' }}>🟡 Checking connection...</p>
            )}
          </div>
          <button style={styles.buttonSecondary} onClick={checkHealth}>
            Recheck Connection
          </button>
        </div>
      </section>

      <div style={styles.grid}>
        {/* COLUMN 1: AUTHENTICATION */}
        <div style={styles.column}>
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>🔑 User Authentication</h2>
            
            {user ? (
              <div style={styles.profileBox}>
                <p style={{ margin: '0 0 8px 0' }}>Logged in as:</p>
                <div style={styles.badge}>{user.role.toUpperCase()}</div>
                <h3 style={{ margin: '5px 0' }}>{user.firstName} {user.lastName}</h3>
                <p style={{ margin: '3px 0', fontSize: '0.9rem', color: '#555' }}>📧 {user.email}</p>
                {user.phone && <p style={{ margin: '3px 0', fontSize: '0.9rem', color: '#555' }}>📞 {user.phone}</p>}
                
                <div style={{ marginTop: '15px' }}>
                  <button style={styles.buttonDanger} onClick={handleLogout}>
                    Log Out
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={styles.tabs}>
                  <button 
                    style={authMode === 'login' ? styles.tabActive : styles.tab} 
                    onClick={() => { setAuthMode('login'); setAuthError(null); }}
                  >
                    Login
                  </button>
                  <button 
                    style={authMode === 'register' ? styles.tabActive : styles.tab} 
                    onClick={() => { setAuthMode('register'); setAuthError(null); }}
                  >
                    Register
                  </button>
                </div>

                <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} style={styles.form}>
                  {authMode === 'register' && (
                    <>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>First Name</label>
                        <input 
                          type="text" 
                          style={styles.input} 
                          value={regFirstName} 
                          onChange={(e) => setRegFirstName(e.target.value)} 
                          required 
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Last Name</label>
                        <input 
                          type="text" 
                          style={styles.input} 
                          value={regLastName} 
                          onChange={(e) => setRegLastName(e.target.value)} 
                          required 
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Phone (optional)</label>
                        <input 
                          type="text" 
                          style={styles.input} 
                          value={regPhone} 
                          onChange={(e) => setRegPhone(e.target.value)} 
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Role</label>
                        <select 
                          style={styles.select} 
                          value={regRole} 
                          onChange={(e: any) => setRegRole(e.target.value)}
                        >
                          <option value="client">Client</option>
                          <option value="provider">Provider</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email Address</label>
                    <input 
                      type="email" 
                      style={styles.input} 
                      value={authEmail} 
                      onChange={(e) => setAuthEmail(e.target.value)} 
                      required 
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Password</label>
                    <input 
                      type="password" 
                      style={styles.input} 
                      value={authPassword} 
                      onChange={(e) => setAuthPassword(e.target.value)} 
                      required 
                    />
                  </div>

                  {authError && <p style={styles.errorMessage}>{authError}</p>}
                  {authSuccess && <p style={styles.successMessage}>{authSuccess}</p>}

                  <button type="submit" style={styles.buttonPrimary}>
                    {authMode === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                </form>

                <div style={styles.infoBox}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '0.85rem' }}>Demo Seed Accounts (Password: Password123!):</p>
                  <code style={{ fontSize: '0.8rem', display: 'block' }}>Client: youssef.mansouri@example.tn</code>
                  <code style={{ fontSize: '0.8rem', display: 'block' }}>Provider: fatma.gharbi@example.tn</code>
                  <code style={{ fontSize: '0.8rem', display: 'block' }}>Admin: admin@sidi-bouzid.tn</code>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* COLUMN 2: CATEGORIES */}
        <div style={styles.column}>
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>📂 Categories</h2>
            
            {/* Create Category Form */}
            {user ? (
              <form onSubmit={handleCreateCategory} style={{ ...styles.form, marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Add New Category</h3>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Services Médicaux" 
                    style={styles.input}
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Slug (URL friendly)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. medical-services" 
                    style={styles.input}
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Description</label>
                  <textarea 
                    placeholder="Brief description..." 
                    style={styles.textarea}
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                  />
                </div>
                {catError && <p style={styles.errorMessage}>{catError}</p>}
                <button type="submit" style={styles.buttonSecondary}>Create Category</button>
              </form>
            ) : (
              <p style={styles.infoText}>Log in to add new categories.</p>
            )}

            {/* Categories List */}
            <div style={styles.list}>
              {categories.length === 0 ? (
                <p style={{ color: '#888' }}>No categories found.</p>
              ) : (
                categories.map((cat) => (
                  <div key={cat.categoryId} style={styles.listItem}>
                    <div style={{ fontWeight: 'bold' }}>{cat.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Slug: {cat.slug}</div>
                    {cat.description && <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>{cat.description}</div>}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* COLUMN 3: LISTINGS */}
        <div style={styles.column}>
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>🏷️ Listings</h2>

            {/* Create Listing Form */}
            {user ? (
              <form onSubmit={handleCreateListing} style={{ ...styles.form, marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Create New Listing</h3>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Luxury Apartment" 
                    style={styles.input}
                    value={listTitle}
                    onChange={(e) => setListTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Category</label>
                  <select 
                    style={styles.select} 
                    value={listCatId} 
                    onChange={(e) => setListCatId(e.target.value)}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Location</label>
                  <select 
                    style={styles.select} 
                    value={listLocId} 
                    onChange={(e) => setListLocId(e.target.value)}
                    required
                  >
                    {locations.map((loc) => (
                      <option key={loc.locationId} value={loc.locationId}>{loc.cityName}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.label}>Price (TND)</label>
                    <input 
                      type="number" 
                      style={styles.input}
                      value={listPrice}
                      onChange={(e) => setListPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.label}>Unit</label>
                    <select 
                      style={styles.select} 
                      value={listUnit} 
                      onChange={(e: any) => setListUnit(e.target.value)}
                    >
                      <option value="per_night">Per Night</option>
                      <option value="per_day">Per Day</option>
                      <option value="per_hour">Per Hour</option>
                      <option value="per_service">Per Service</option>
                    </select>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Description</label>
                  <textarea 
                    placeholder="Describe listing..." 
                    style={styles.textarea}
                    value={listDesc}
                    onChange={(e) => setListDesc(e.target.value)}
                  />
                </div>

                {listError && <p style={styles.errorMessage}>{listError}</p>}
                <button type="submit" style={styles.buttonSecondary}>Publish Listing</button>
              </form>
            ) : (
              <p style={styles.infoText}>Log in to publish new listings.</p>
            )}

            {/* Listings List */}
            <div style={styles.list}>
              {listings.length === 0 ? (
                <p style={{ color: '#888' }}>No listings found.</p>
              ) : (
                listings.map((item) => (
                  <div key={item.listingId} style={styles.listItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 'bold' }}>{item.title}</span>
                      <span style={styles.priceTag}>
                        {Number(item.basePrice).toFixed(0)} TND / {item.pricingUnit.replace('per_', '')}
                      </span>
                    </div>
                    {item.description && <p style={{ fontSize: '0.85rem', margin: '5px 0' }}>{item.description}</p>}
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {item.category && <span style={styles.miniBadge}>{item.category.name}</span>}
                      {item.location && <span style={styles.miniBadge}>📍 {item.location.cityName}</span>}
                    </div>

                    {user && (user.role === 'admin' || user.userId === item.providerId) && (
                      <button 
                        style={styles.deleteBtn}
                        onClick={() => handleDeleteListing(item.listingId)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// --- CSS STYLING ---
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    color: '#333',
    backgroundColor: '#fafafa',
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '20px',
    borderBottom: '2px solid #e0e0e0',
  },
  title: {
    margin: 0,
    fontSize: '2rem',
    color: '#0d47a1',
  },
  subtitle: {
    margin: '8px 0 0 0',
    color: '#666',
  },
  section: {
    marginBottom: '30px',
  },
  grid: {
    display: 'flex',
    flexDirection: 'row',
    gap: '20px',
    flexWrap: 'wrap',
  },
  column: {
    flex: '1 1 350px',
  },
  card: {
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  cardTitle: {
    margin: '0 0 15px 0',
    fontSize: '1.25rem',
    color: '#1565c0',
    borderBottom: '2px solid #1565c0',
    paddingBottom: '8px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#555',
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '0.95rem',
  },
  textarea: {
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '0.95rem',
    minHeight: '60px',
    resize: 'vertical',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '0.95rem',
    backgroundColor: '#fff',
  },
  buttonPrimary: {
    backgroundColor: '#1565c0',
    color: '#fff',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.95rem',
  },
  buttonSecondary: {
    backgroundColor: '#37474f',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  buttonDanger: {
    backgroundColor: '#c62828',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  deleteBtn: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    border: '1px solid #ffcdd2',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    marginTop: '10px',
    float: 'right',
  },
  profileBox: {
    backgroundColor: '#e3f2fd',
    border: '1px solid #bbdefb',
    borderRadius: '6px',
    padding: '15px',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    backgroundColor: '#1565c0',
    color: '#fff',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #ddd',
    marginBottom: '15px',
  },
  tab: {
    flex: 1,
    padding: '8px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#666',
  },
  tabActive: {
    flex: 1,
    padding: '8px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#1565c0',
    borderBottom: '2px solid #1565c0',
    fontWeight: 'bold',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '400px',
    overflowY: 'auto',
    marginTop: '10px',
  },
  listItem: {
    backgroundColor: '#f5f5f5',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    padding: '12px',
    position: 'relative',
    overflow: 'hidden',
  },
  priceTag: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
  },
  miniBadge: {
    backgroundColor: '#e0e0e0',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    color: '#444',
  },
  errorMessage: {
    color: '#c62828',
    fontSize: '0.85rem',
    margin: '5px 0',
  },
  successMessage: {
    color: '#2e7d32',
    fontSize: '0.85rem',
    margin: '5px 0',
  },
  infoBox: {
    marginTop: '15px',
    backgroundColor: '#fffde7',
    border: '1px solid #fff59d',
    borderRadius: '4px',
    padding: '10px',
  },
  infoText: {
    color: '#666',
    fontSize: '0.9rem',
    fontStyle: 'italic',
  },
};

const globalCSS = `
  button:hover {
    opacity: 0.9;
  }
  input:focus, select:focus, textarea:focus {
    outline: 2px solid #1565c0;
  }
`;

export default App;
