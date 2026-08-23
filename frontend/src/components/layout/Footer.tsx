import { Link } from "react-router-dom";
import "./layout.css";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h3>Sidi Bouzid</h3>
          <p>Là où l’été vous attend — marketplace locale pour séjours, tables, activités et services de la côte atlantique.</p>
          <p>hello@sidi-bouzid.ma<br />+212 523 00 00 00</p>
        </div>
        <div>
          <h3>Explorer</h3>
          <p><Link to="/decouvrir">Découvrir</Link></p>
          <p><Link to="/decouvrir/restaurants">Restaurants</Link></p>
          <p><Link to="/services/sejours">Séjours</Link></p>
          <p><Link to="/services/voitures">Voitures</Link></p>
        </div>
        <div>
          <h3>Maison</h3>
          <p><Link to="/a-propos">À propos</Link></p>
          <p><Link to="/notre-histoire">Notre histoire</Link></p>
          <p><Link to="/entreprise">Entreprise</Link></p>
        </div>
        <div>
          <h3>Légal & réseaux</h3>
          <p><Link to="/confidentialite">Confidentialité</Link></p>
          <p><Link to="/conditions">Conditions</Link></p>
          <p><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a></p>
          <p><a href="https://facebook.com" target="_blank" rel="noreferrer">Facebook</a></p>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Sidi Bouzid Marketplace. Tous droits réservés.</span>
        <span>Prix affichés en DH</span>
      </div>
    </footer>
  );
}
