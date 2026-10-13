// src/components/Footer.js
import React from 'react';

const Footer = () => {
  return (
    <footer className="homepage-footer text-center py-3 mt-5">
      <p className="rh-subtle small mb-0">&copy; {new Date().getFullYear()} RunHer · Run your way, never alone.</p>
    </footer>
  );
};

export default Footer;
