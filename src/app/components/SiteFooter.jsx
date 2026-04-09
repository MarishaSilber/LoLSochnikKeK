import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <span className="site-footer-copy">VuzHub</span>
        <div className="site-footer-links">
          <Link to="/privacy-policy" className="site-footer-link">
            Политика конфиденциальности
          </Link>
          <Link to="/terms" className="site-footer-link">
            Пользовательское соглашение
          </Link>
        </div>
      </div>
    </footer>
  );
}
