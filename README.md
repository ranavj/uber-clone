<h1>🚖 Uber Clone — Full Stack (Nx Monorepo)</h1>

<table>
  <tr><th align="left">Field</th><th align="left">Details</th></tr>
  <tr><td>Project Type</td><td>Full-Stack Uber Clone</td></tr>
  <tr><td>Architecture</td><td>Microservices + Real-time</td></tr>
  <tr><td>Monorepo</td><td>Nx</td></tr>
  <tr><td>Frontend</td><td>Angular (Latest, Signals, Standalone) + Tailwind CSS</td></tr>
  <tr><td>Backend</td><td>NestJS (Express)</td></tr>
  <tr><td>Database</td><td>PostgreSQL + Prisma ORM</td></tr>
  <tr><td>Real-time</td><td>Socket.io</td></tr>
  <tr><td>Authentication</td><td>Passport JWT + BCrypt</td></tr>
  <tr><td>Maps</td><td>Google Maps JavaScript API</td></tr>
</table>

<hr/>

<h2>🚀 Key Features</h2>

<h3>📱 Rider App (Frontend)</h3>
<table>
  <tr><th align="left">Feature</th><th align="left">Description</th></tr>
  <tr><td>Interactive Map</td><td>Pickup/Drop selection via Google Maps</td></tr>
  <tr><td>Real-time Booking</td><td>Live driver search & ride status via WebSockets</td></tr>
  <tr><td>Ride Estimation</td><td>Price & ETA based on distance/routing</td></tr>
  <tr><td>Smart UI</td><td>Modular bottom sheets (Ride, Driver, Bill)</td></tr>
  <tr><td>Ride History</td><td>Past trips with details</td></tr>
  <tr><td>Cancellation Flow</td><td>Server-synced cancellation logic</td></tr>
  <tr><td>State Management</td><td>Angular Signals (reactive performance)</td></tr>
</table>

<h3>🛠️ Backend Services (NestJS)</h3>
<table>
  <tr><th align="left">Service</th><th align="left">Responsibility</th></tr>
  <tr><td>Auth Service</td><td>JWT Login/Signup, shared strategies</td></tr>
  <tr><td>Ride Service</td><td>Booking, pricing, DB transactions</td></tr>
  <tr><td>Socket Gateway</td><td>Real-time events: ride-request, driver-location, trip-updates</td></tr>
  <tr><td>Database</td><td>PostgreSQL with Prisma for type-safe queries</td></tr>
</table>

<hr/>

<h2>📂 Project Structure</h2>
<table>
  <tr><th align="left">Path</th><th align="left">Description</th></tr>
  <tr><td><code>apps/rider-app</code></td><td>Angular frontend for riders</td></tr>
  <tr><td><code>apps/driver-app</code></td><td>(Coming Soon) Driver interface</td></tr>
  <tr><td><code>apps/services/auth</code></td><td>Authentication microservice</td></tr>
  <tr><td><code>apps/services/ride</code></td><td>Core ride logic microservice</td></tr>
  <tr><td><code>apps/services/payment</code></td><td>(Planned) Payment service</td></tr>
  <tr><td><code>libs/common</code></td><td>Shared DTOs, guards, interfaces</td></tr>
  <tr><td><code>libs/db</code></td><td>Shared Prisma client & schema</td></tr>
  <tr><td><code>libs/ui</code></td><td>Reusable UI components</td></tr>
  <tr><td><code>libs/util-types</code></td><td>Shared TypeScript types</td></tr>
</table>

<hr/>

<h2>⚡ Getting Started</h2>

<h3>1) Prerequisites</h3>
<table>
  <tr><th align="left">Requirement</th><th align="left">Notes</th></tr>
  <tr><td>Node.js</td><td>v18+</td></tr>
  <tr><td>PostgreSQL</td><td>Local or Docker</td></tr>
  <tr><td>Google Maps API Key</td><td>Required</td></tr>
</table>

<h3>2) Installation</h3>
<pre><code>git clone https://github.com/ranavj/uber-clone.git
cd uber-clone
npm install</code></pre>

<h3>3) Environment Setup</h3>
<pre><code># Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/uber_db?schema=public"

# Auth
JWT_SECRET="your-super-secret-key"

# Frontend
NX_GOOGLE_MAPS_KEY="YOUR_GOOGLE_MAPS_API_KEY"</code></pre>

<h3>4) Database Migration</h3>
<pre><code>npx prisma generate
npx prisma db push</code></pre>

<h3>5) Run the Application</h3>
<table>
  <tr><th align="left">Mode</th><th align="left">Command</th></tr>
  <tr><td>Run all services</td><td><code>npm run start:all</code></td></tr>
  <tr><td>Auth service</td><td><code>npx nx serve services-auth</code></td></tr>
  <tr><td>Ride service</td><td><code>npx nx serve services-ride</code></td></tr>
  <tr><td>Frontend</td><td><code>npx nx serve rider-app</code></td></tr>
</table>

<p><b>Rider App URL:</b> <code>http://localhost:4200</code></p>

<hr/>

<h2>🛣️ Roadmap</h2>
<table>
  <tr><th align="left">Item</th><th align="left">Status</th></tr>
  <tr><td>Authentication (JWT)</td><td>✅</td></tr>
  <tr><td>Map Integration & Routing</td><td>✅</td></tr>
  <tr><td>Socket.io Real-time Setup</td><td>✅</td></tr>
  <tr><td>Ride Request & Matching Logic</td><td>✅</td></tr>
  <tr><td>Ride History & Cancellation</td><td>✅</td></tr>
  <tr><td>Global Error Handling (Interceptors)</td><td>⏳ Next</td></tr>
  <tr><td>Driver App Navigation</td><td>⏳</td></tr>
  <tr><td>Payment Integration (Stripe/Razorpay)</td><td>⏳</td></tr>
</table>

<hr/>

<h2>🤝 Contributing</h2>
<table>
  <tr><th align="left">Step</th><th align="left">Action</th></tr>
  <tr><td>1</td><td>Fork the repo</td></tr>
  <tr><td>2</td><td>Create a feature branch</td></tr>
  <tr><td>3</td><td>Open a Pull Request</td></tr>
</table>

<hr/>

<h2>📄 License</h2>
<table>
  <tr><th align="left">Type</th></tr>
  <tr><td>MIT License</td></tr>
</table>
