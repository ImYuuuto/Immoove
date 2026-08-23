import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { isStaff, useAuth } from "../../context/AuthContext";
import "./layout.css";

const discoverLinks = [
  { to: "/decouvrir/vacances", label: "Lieux de vacances" },
  { to: "/decouvrir/restaurants", label: "Restaurants & cafés" },
  { to: "/decouvrir/activites", label: "Activités & loisirs" },
];

const aboutLinks = [
  { to: "/a-propos", label: "À propos de Sidi Bouzid" },
  { to: "/notre-histoire", label: "Derrière le projet" },
  { to: "/entreprise", label: "L'entreprise" },
  { to: "/confidentialite", label: "Politique de confidentialité" },
  { to: "/conditions", label: "Conditions d'utilisation" },
];

const serviceLinks = [
  { to: "/services/maisons", label: "Maisons & appartements à vendre" },
  { to: "/services/voitures", label: "Location de voitures" },
  { to: "/services/sejours", label: "Séjours courts" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <div className="nav-inner">
        <Link to="/" className="logo" onClick={() => setOpen(false)}>
          <span className="logo-mark">SB</span>
          Sidi Bouzid
        </Link>

        <button className="btn btn-ghost btn-sm burger" onClick={() => setOpen((v) => !v)} type="button">
          Menu
        </button>

        <nav className={`nav-links ${open ? "open" : ""}`} onClick={() => setOpen(false)}>
          <div className="nav-item">
            <button type="button" className="nav-drop-btn">Découvrir</button>
            <div className="dropdown">
              {discoverLinks.map((l) => (
                <Link key={l.to} to={l.to}>{l.label}</Link>
              ))}
            </div>
          </div>
          <div className="nav-item">
            <button type="button" className="nav-drop-btn">À propos</button>
            <div className="dropdown">
              {aboutLinks.map((l) => (
                <Link key={l.to} to={l.to}>{l.label}</Link>
              ))}
            </div>
          </div>
          <div className="nav-item">
            <button type="button" className="nav-drop-btn">Nos services</button>
            <div className="dropdown">
              {serviceLinks.map((l) => (
                <Link key={l.to} to={l.to}>{l.label}</Link>
              ))}
            </div>
          </div>
          <NavLink to="/decouvrir" className="nav-link">Toutes les annonces</NavLink>
        </nav>

        <div className="nav-cta">
          {user ? (
            <div className="profile-menu">
              <button type="button" className="btn btn-primary btn-sm">
                {user.firstName}
              </button>
              <div className="profile-panel">
                <Link to="/profil">Mon profil</Link>
                <Link to="/proposer">Proposer une annonce</Link>
                {isStaff(user.role) ? <Link to="/admin">Espace admin</Link> : null}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={async () => {
                    await logout();
                    navigate("/");
                  }}
                >
                  Déconnexion
                </button>
              </div>
            </div>
          ) : (
            <Link to="/connexion" className="btn btn-primary btn-sm">Connexion</Link>
          )}
        </div>
      </div>
    </header>
  );
}
