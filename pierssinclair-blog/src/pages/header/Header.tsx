import React from "react";
import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="py-4">
      <div className="max-w-3xl  mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl text-gray-200 hover:text-gray-400 hover:underline">Piers Sinclair</Link>
        <Link to="/about/2021-07-12-About-Piers-Sinclair" className="text-lg text-gray-200 hover:text-gray-400 hover:underline">About</Link>
      </div>
      <hr className="border-gray-700 mt-4" />
    </header>
  );
}

export default Header;
