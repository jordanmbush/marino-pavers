import type React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hero Section */}
      <div className="relative">
        <img
          src="/path/to/hero-image.jpg" // Replace with your actual image path
          alt="Marino Pavers Hero"
          className="h-96 w-full object-cover"
        />
        <div className="absolute left-0 top-0 h-full w-full bg-black opacity-50" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform text-center text-white">
          <h1 className="mb-4 text-4xl font-bold">Marino Pavers</h1>
          <Link
            to="/gallery"
            className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
          >
            Gallery
          </Link>
        </div>
      </div>

      {/* About Section */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="mb-6 text-3xl font-bold">About Us</h2>
        <p className="text-gray-700">
          Marino Pavers is a Phoenix-based construction company specializing in
          the installation of high-quality pavers and artificial grass. We serve
          the greater Phoenix area and are committed to providing exceptional
          customer service and craftsmanship.
        </p>
      </div>

      {/* Services Section */}
      <div className="bg-gray-200 px-4 py-12">
        <div className="container mx-auto">
          <h2 className="mb-6 text-3xl font-bold">Our Services</h2>
          <ul className="list-inside list-disc text-gray-700">
            <li>Paver Installation (patios, walkways, driveways)</li>
            <li>Artificial Grass Installation</li>
            <li>Outdoor Living Space Design and Construction</li>
          </ul>
        </div>
      </div>

      {/* Contact Section */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="mb-6 text-3xl font-bold">Contact Us</h2>
        <p className="text-gray-700">
          Call us at (123) 456-7890 or email us at info@marinopavers.com to
          schedule a free consultation.
        </p>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 py-4 text-center text-white">
        <p>&copy; 2023 Marino Pavers</p>
      </footer>
    </div>
  );
};

export default Home;
