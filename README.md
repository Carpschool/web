# Carpschool Web Client

Modern web application for the **Carpschool** federated carpool network, built with:
- **Next.js 15** (App Router & React 19)
- **shadcn/ui** components (`https://ui.shadcn.com/docs/components`)
- **Tailwind CSS**
- **Clerk Authentication** (`@clerk/nextjs`)
- **Socket.io Client** for real-time negotiation chat

---

## Getting Started

1. Copy environment template:
   ```bash
   cp .env.example .env.local
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

---

## Docker Deployment

Build and run using the multi-stage Dockerfile:
```bash
docker compose up --build
```