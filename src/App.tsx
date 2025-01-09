import Header from "./components/header/Header";

import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";

import Home from "./pages/home/Home";
import Post from "./pages/post/Post";
import Footer from "./components/footer/Footer";
import ReadingList from "./pages/reading-list/ReadingList";

const App: React.FC = () => {
  return (
    <Router>
      <div className="bg-zinc-900 text-gray-300 min-h-screen">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reading-list" element={<ReadingList />} />
          <Route path="/about/:slug" element={<Post />} />
          <Route path="/post/:slug" element={<Post />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
