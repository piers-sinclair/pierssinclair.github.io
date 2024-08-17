import Header from "./pages/header/Header";


import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Home from "./pages/home/Home";
import About from "./pages/about/About";
import Post from "./pages/post/Post";

const App: React.FC = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />        
        <Route path="/post/:slug" element={<Post />} />

      </Routes>
    </Router>
  );
};

export default App;
