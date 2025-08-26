# Local Scan Stock Management System

## Installation

1. Install Node.js (https://nodejs.org/)
2. Open a terminal in the `local-scan` folder.
3. Install backend dependencies:
   ```sh
   cd api
   npm install
   ```
4. Install frontend dependencies:
   ```sh
   cd ../frontend
   npm install
   ```

## Running the Project

- Double-click `start-all.bat` in the `local-scan` folder to start both the API and frontend servers.
- The API will run on http://localhost:3001
- The frontend will run on http://localhost:3000

## Notes
- Make sure your Supabase credentials are set in `api/.env`.
- For development, keep both terminals open.
- If you need to install additional dependencies, use `npm install <package>` in the respective folder.
