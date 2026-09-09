import { Link } from "react-router-dom";
import { FiArrowUpRight, FiGithub, FiLinkedin, FiMail } from "react-icons/fi";
import "../../css/Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-shell">
        <div className="footer-brand-block">
          <div className="footer-brand-row"><span className="brand-mark">M</span><strong>MiniShop</strong></div>
          <p>A clean full-stack storefront built for real product images, smarter inventory and simple order management.</p>
        </div>
        <div className="footer-links">
          <div><span className="footer-kicker">Browse</span><Link to="/products">Shop products</Link><Link to="/login">Customer login</Link><Link to="/secret">Admin portal</Link></div>
          <div><span className="footer-kicker">Connect</span><a href="mailto:tahmidshams19@gmail.com"><FiMail /> Email</a><a href="https://github.com/optimas009" target="_blank" rel="noreferrer"><FiGithub /> GitHub</a><a href="https://www.linkedin.com/in/tahmid-shams-665b49233/" target="_blank" rel="noreferrer"><FiLinkedin /> LinkedIn</a></div>
        </div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} MiniShop</span><span>Designed & built by Mohammad Tahmid Shams <FiArrowUpRight /></span></div>
    </footer>
  );
}
