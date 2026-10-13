import React from "react";
import 'animate.css';
import { Routes, Route } from "react-router-dom"; // ❌ Remove Router from here
import "bootstrap/dist/css/bootstrap.min.css";
import Header from "./components/header";
import Footer from "./components/footer";
import Homepage from "./pages/homepage";
import About from "./pages/about";
import Register from "./pages/register";
import Login from "./pages/login";
import Profile from "./pages/profile";
import Friends from "./pages/friends";
import Notifications from "./pages/notifications";
import StartRun from "./pages/startRun";
import UserPosts from "./pages/userPosts";
import Feed from "./pages/feed";
import Calender from "./pages/calender";
import TrackRun from "./pages/trackRun";
import WatchingBanner from "./components/watchingBanner";
import NotificationToaster from "./components/notificationToaster";



import "./App.css";

function App() {
  console.log("🔹 App.js is rendering!"); // Debugging

  return (
    <>
      <Header />
      <NotificationToaster />
      <WatchingBanner />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/about" element={<About />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<Profile />} /> {/* Add this */}
          <Route path="/friends" element={<Friends />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/start-run" element={<StartRun/>} />
          <Route path="/posts" element={<UserPosts/>} />
          <Route path="/posts/:id" element={<UserPosts/>} />
          <Route path="/feed" element={<Feed/>} />
          <Route path="/calender" element={<Calender/>} />
          <Route path="/track/:id" element={<TrackRun/>} />
        </Routes>
      </div>
      <Footer />
    </>
  );
}

export default App;

