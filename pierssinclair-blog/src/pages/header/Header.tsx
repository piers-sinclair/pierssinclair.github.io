import '../../App.css';
import { Link } from "react-router-dom"; 

function Header() {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto flex justify-between items-center py-4 px-6">
        <Link
          to="/"
          className="text-lg font-semibold text-gray-800 hover:text-gray-600"
        >
          Piers Sinclair
        </Link>

        <Link
          to="/about"
          className="text-lg font-semibold text-gray-800 hover:text-gray-600"
        >
          About
        </Link>
      </div>
    </header>
  );
}

export default Header;
