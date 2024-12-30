import Header from "./pages/header/Header";

import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";

import Home from "./pages/home/Home";
import Post from "./pages/post/Post";

const App: React.FC = () => {
  const [redirects, setRedirects] = useState<{ from: string; to: string }[]>([]);

  useEffect(() => {
    fetch("/posts/post-redirects.json")
      .then((response) => response.json())
      .then((data) => setRedirects(data));
  }, []);
  return (
    <Router>
      <div className="bg-zinc-900 text-gray-300 min-h-screen">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about/:slug" element={<Post />} />
          <Route path="/post/:slug" element={<Post />} />
          {redirects.map((redirect) => (
            <Route key={redirect.from} path={redirect.from} element={<Navigate to={redirect.to} />} />
          ))}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
