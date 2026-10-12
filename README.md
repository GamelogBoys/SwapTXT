# Real-Time Secure Messenger

A fully-featured, responsive real-time web messenger application built with Node.js, Express, Socket.io, MongoDB, and Tailwind CSS. It features secure user authentication via OTP, real-time status and chat updates, file attachments with auto-expiry, image lightboxes, and automatic 10-day message retention powered by MongoDB TTL indexes.

Live Demo: [swaptxt.onrender.com](https://swaptxt.onrender.com)

---

## ✨ Features

- **Secure Authentication:** User registration, login, and OTP verification via email.
- **Real-Time Communication:** Instant messaging and live online/offline user status updates powered by Socket.io.
- **Contact Management:** Add new contacts easily by email with invitation accept/decline flows.
- **File & Image Sharing:** Send attachments and view images with a full-screen lightbox zoom modal.
- **Auto-Expiring Attachments:** Uploaded server files automatically delete after 60 seconds to save storage.
- **10-Day Message Retention:** Database messages automatically expire and purge every 10 days using MongoDB TTL indexes.
- **Modern UI/UX:** Clean and responsive interface styled with Tailwind CSS, featuring success/error toast notifications.

---

## 🛠️ Tech Stack

- **Frontend:** EJS (Embedded JavaScript), Tailwind CSS, Socket.io Client
- **Backend:** Node.js, Express.js, Socket.io
- **Database:** MongoDB & Mongoose
- **File Uploads:** Multer

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js installed on your machine
- A MongoDB connection string (MongoDB Atlas or local)
- An email service setup (if using OTP email verification)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and configure your environment variables:
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_connection_string_here
   SESSION_SECRET=your_super_secret_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   ```

4. Start the application:
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`.

---

## 📂 Project Structure

```text
├── controllers/          # Business logic for auth and chat
├── models/               # Mongoose schemas (User, Message, OTP)
├── routes/               # Express routing configuration
├── views/                # EJS templates (index, login, register, OTP)
├── public/               # Static assets & uploaded files directory
├── server.js             # Main server entry point & Socket.io setup
└── README.md
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).