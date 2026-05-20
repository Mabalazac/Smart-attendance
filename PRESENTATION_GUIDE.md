# Presentation Setup Guide 🚀
This guide contains step-by-step instructions to run the **Smart Venue & Timetable Attendance System** on a laptop and access it on a phone.

---

## 📋 System Overview
The application consists of:
1. **Frontend**: A React + TypeScript web app (built with Vite) that runs on port `5173`.
2. **Backend**: A Django REST Framework API that runs on port `8000`.
3. **Database**: **PostgreSQL** database engine.

---

## 🛠️ Prerequisites (For the Partner's Laptop)
Before running the project, make sure the following are installed:
1. **Node.js** (LTS version recommended) -> [Download here](https://nodejs.org/)
2. **Python** (version 3.10 or newer) -> [Download here](https://www.python.org/)
   * *Important:* When installing Python on Windows, make sure to check the box that says **"Add Python to PATH"**.
3. **PostgreSQL** -> [Download here](https://www.postgresql.org/)
   * Ensure the PostgreSQL server is running.

---

## 📥 Getting Started
Clone the repository or extract the project folder to a directory:
* Inside, you will see two main folders:
  * `backend`
  * `frontend`

---

## 1. Database Setup (PostgreSQL) 🗄️
1. Open **pgAdmin** or your PostgreSQL command line.
2. Create a new database named **`smart_venue_db`**.
3. Open `backend/smart_venue/settings.py` in a text editor (like VS Code or Notepad).
4. Locate the `DATABASES` section (around line 85):
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'smart_venue_db',
           'USER': 'postgres',
           'PASSWORD': 'mjtechnologies',  # <-- Change this to your PostgreSQL password
           'HOST': 'localhost',
           'PORT': '5432',
       }
   }
   ```
5. Update the `'PASSWORD'` value to match your local PostgreSQL password, then save the file.

---

## 2. Backend Setup (Django) 🐍

### Step 2.1: Open Terminal and Navigate to Backend
Open your terminal (Command Prompt or PowerShell) and go to the backend folder:
```bash
cd backend
```

### Step 2.2: Create and Activate a Virtual Environment
Create a clean environment for Python packages:
* **Windows**:
  ```powershell
  python -m venv venv
  venv\Scripts\activate
  ```
* **macOS / Linux**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### Step 2.3: Install Dependencies
Install all required Python packages:
```bash
pip install -r requirements.txt
```

### Step 2.4: Database Initialization (Start Clean)
1. **Run migrations** to create tables in PostgreSQL:
   ```bash
   python manage.py migrate
   ```
2. **Create your new Admin account**:
   ```bash
   python manage.py createsuperuser
   ```
   * Follow the terminal prompts to enter your username, email, and password.
   * *Note: When typing the password, characters will not be displayed on the screen. Just type it and press Enter.*

### Step 2.5: Start the Backend Server
Start the development server:
```bash
python manage.py runserver 0.0.0.0:8000
```
Keep this terminal running.

---

## 3. Frontend Setup (React/Vite) ⚡

### Step 3.1: Open a NEW Terminal and Navigate to Frontend
Open a separate terminal window and go to the frontend directory:
```bash
cd frontend
```

### Step 3.2: Install Node Packages
Install the required frontend packages:
```bash
npm install
```

### Step 3.3: Start the Frontend Dev Server
Run the frontend server with the `--host` flag to make it visible on your network:
```bash
npm run dev -- --host
```
Keep this terminal window running. Note the **Network URL** output (e.g., `http://192.168.1.15:5173/`).

---

## 4. Running on a Mobile Phone 📱
To access the app from your phone:
1. **Connect to the Same Network**: Ensure both your laptop and phone are connected to the exact same Wi-Fi network (or connect your phone to your laptop's mobile hotspot).
2. **Open on Phone**: Open the browser on your phone and go to:
   `http://<laptop-ip>:5173` (e.g., `http://192.168.1.15:5173`).
3. The app automatically detects the server URL and will connect to your laptop's backend at port `8000`.

---

## 🎬 How to Run the Presentation Flow (Step-by-Step)

Since we are starting from scratch without demo data, follow this sequence:

### 1. Log in as Admin & Populate the Timetable
* Go to the web app (`http://localhost:5173`) on your laptop.
* Click **Login** and sign in using the **Admin** account you created in Step 2.4.
* Go to the **Admin Panel** (or Timetable tab).
* Upload the **`timetable.csv`** file (located in the root folder of the project).
* **What happens behind the scenes**:
  * This automatically registers all **Lecturers** listed in the CSV.
  * Their accounts are created with a default password: **`12345`**.
  * It also automatically creates all **Venues**, **Courses**, and **Timetable entries**.

### 2. Register Students
* Click **Register** on the navigation bar.
* Create a **Student** account. Enter the student's name, email, password, and their target class program/stream (e.g. `BIT_1B` to match the timetable entries).

### 3. Log in as a Lecturer (To Start Class)
* Log out of the Admin panel.
* Log in as one of the lecturers listed in the CSV (e.g. search the CSV for a lecturer email, or check the admin console list) using the default password **`12345`**.
* Navigate to **My Classes**.
* If a class is scheduled for today and the start time has arrived, you will see a blue pulsing **"Ready"** badge.
* Click **Start Class** to generate the attendance QR Code.

### 4. Scan QR Code as Student
* Log in as the Student on your phone.
* Navigate to **Scan Attendance** and grant camera permissions.
* Scan the QR Code on the lecturer's screen to check in successfully!

---

## 🔧 Troubleshooting

### 1. "Network request failed" on Phone
* Ensure both laptop and phone are on the *same Wi-Fi*.
* **Windows Firewall**: Windows Defender might block ports `5173` and `8000`. Temporarily turn off public network firewall during the presentation, or allow incoming connections for those ports.

### 2. Database Error on Migrate
* Make sure PostgreSQL is running and you created the `smart_venue_db` database first.
* Verify your password in `backend/smart_venue/settings.py`.
