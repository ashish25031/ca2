# Secure File Sharing System

A complete full-stack web application for securely uploading, downloading, and sharing files.

## Tech Stack
- **Frontend**: React.js, React Router, Tailwind CSS, Axios, Vite
- **Backend**: Node.js, Express.js, Multer, bcryptjs, jsonwebtoken, mssql
- **Database**: Azure SQL Database

## Folder Structure
```
secure-file-sharing/
│
├── frontend/ (React UI)
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/ (Express API)
│   ├── config/ (DB config)
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── uploads/ (File storage)
│   ├── .env.example
│   └── server.js
│
└── database/
    └── schema.sql (Azure SQL tables)
```

## Setup Instructions

### 1. Database Setup
1. Create an Azure SQL Database.
2. Run the SQL queries found in `database/schema.sql` to create the `Users`, `Files`, and `SharedLinks` tables.

### 2. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```env
   PORT=5000
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_SERVER=your_db_server.database.windows.net
   DB_DATABASE=your_db_name
   JWT_SECRET=your_super_secret_jwt_key
   FRONTEND_URL=http://localhost:5173
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## API Explanations

### Auth Endpoints
- `POST /api/auth/register`: Registers a new user. Expects `name`, `email`, `password`. Returns JWT token.
- `POST /api/auth/login`: Authenticates user. Expects `email`, `password`. Returns JWT token.

### File Endpoints (Protected by JWT)
- `GET /api/files`: Retrieves a list of files uploaded by the authenticated user.
- `POST /api/files/upload`: Uploads a single file using `multer`. Expects form-data with field `file`.
- `DELETE /api/files/:id`: Deletes a specific file and its physical file on disk.
- `GET /api/files/download/:id`: Downloads the physical file.

### Share Endpoints
- `POST /api/share/create/:fileId` (Protected): Creates a shareable link. Accepts optional `password` and `expiryHours`.
- `POST /api/share/:token` (Public): Validates the share token, checks expiry, and checks the password if set. Returns file info.
- `GET /api/share/download/:token` (Public): Securely downloads the shared file (requires query param `pwd` if protected).

## Deployment Steps for Azure App Service

### Step 1: Push to GitHub
1. Initialize git in the root folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
2. Create a GitHub repository and push your code:
   ```bash
   git branch -M main
   git remote add origin https://github.com/yourusername/secure-file-sharing.git
   git push -u origin main
   ```

### Step 2: Deploy Backend to Azure App Service
1. In Azure Portal, create a new "Web App".
2. **Publish**: Code
3. **Runtime stack**: Node 18 or 20 LTS
4. **OS**: Linux
5. Connect your GitHub repository in the **Deployment Center**. Select the `backend` folder as the Root Directory.
6. Set Environment Variables in **Configuration**:
   - `PORT`, `DB_USER`, `DB_PASSWORD`, `DB_SERVER`, `DB_DATABASE`, `JWT_SECRET`, `FRONTEND_URL`
   - Note: For `uploads/` persistence, consider mounting an Azure Storage File Share, as the default App Service filesystem is ephemeral.

### Step 3: Deploy Frontend to Azure Static Web Apps / App Service
1. Create a new "Static Web App" or another "Web App" in Azure.
2. Connect to the same GitHub repo.
3. Configure build details:
   - **App location**: `/frontend`
   - **Output location**: `dist`
4. Make sure to set `VITE_API_URL` to your deployed backend URL in the deployment environment variables.
