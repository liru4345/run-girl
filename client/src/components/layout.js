// src/components/Layout.js
import React from 'react';
import Header from './header';
import Footer from './footer';

const Layout = ({ children }) => {
  return (
    <div className="layout-container">
      <Header />
      <main className="container mt-4">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
