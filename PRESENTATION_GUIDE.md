# Presentation Setup Guide 🚀
This guide contains step-by-step instructions to run the **Smart Venue & Timetable Attendance System** on a laptop and access it on a phone.

---

## 📋 System Overview
The application consists of:
1. **Frontend**: A React + TypeScript web app (built with Vite) that runs on port `5173`.
2. **Backend**: A Django REST Framework API that runs on port `8000`.
3. **Database**: Supports either **PostgreSQL** (Default) or **SQLite** (Zero-setup option).

---

## 🛠️ Prerequisites (For the Partner's Laptop)
Before running the project, make sure the following are installed:
1. **Node.js** (LTS version recommended) -> [Download here](https://nodejs.org/)
2. **Python** (version 3.10 or newer) -> [Download here](https://www.python.org/)
   * *Important:* When installing Python on Windows, make sure to check the box that says **"Add Python to PATH"**.
3. **PostgreSQL** (Optional) -> Only required if you choose to use PostgreSQL. If you want a quick setup without installing PostgreSQL, follow the **SQLite** instructions below.

---

## 📥 Getting Started
1. Extract `presentation_project.zip` to a folder of your choice.
2. Inside, you will see two main folders:
   * `backend`
   * `frontend`

---

## 1. Backend Setup (Django) 🐍

### Step 1.1: Open Terminal and Navigate to Backend
Open your terminal (Command Prompt, PowerShell, or macOS Terminal) and navigate to the backend folder:
```bash
cd backend
```

### Step 1.2: Create and Activate a Virtual Environment
Create a clean environment to install Python packages:
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

### Step 1.3: Install Dependencies
Install all required Python packages using `requirements.txt`:
```bash
pip install -r requirements.txt
```

### Step 1.4: Configure the Database 🗄️
You have two options for the database:

#### Option A: SQLite (Quickest, Zero Setup - Recommended for Presentation)
You don't need to install anything. The app will use the single-file database `db.sqlite3` included in the project.
1. Open `backend/smart_venue/settings.py` in a text editor (like VS Code, Notepad, etc.).
2. Go to line **88** (the `DATABASES` section).
3. **Comment out** the PostgreSQL block by adding `#` to the lines, and **uncomment** the SQLite block. It should look like this:
   ```python
   # PostgreSQL configuration (Default)
   # DATABASES = {
   #     'default': {
   #         'ENGINE': 'django.db.backends.postgresql',
   #         'NAME': 'smart_venue_db',
   #         'USER': 'postgres',
   #         'PASSWORD': 'mjtechnologies',
   #         'HOST': 'localhost',
   #         'PORT': '5432',
   #     }
   # }

   # SQLite configuration (Alternative: uncomment below and comment out PostgreSQL above to use SQLite)
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.sqlite3',
           'NAME': BASE_DIR / 'db.sqlite3',
       }
   }
   ```

#### Option B: PostgreSQL
If you already have PostgreSQL installed and running:
1. Open pgAdmin or terminal and create a database named `smart_venue_db`.
2. Ensure settings in `backend/smart_venue/settings.py` match your PostgreSQL password:
   ```python
   'PASSWORD': 'your_postgres_password',
   ```

### Step 1.5: Database Initialization (Choose Option A or Option B)

#### Option A: Start Completely Fresh (From Scratch - No Data)
1. **Delete Existing SQLite File (Only if using SQLite)**:
   * Go to the `backend` folder and delete `db.sqlite3` if it exists. This ensures you start with a 100% empty database.
2. **Run migrations** to construct clean database tables:
   ```bash
   python manage.py migrate
   ```
3. **Create your fresh Admin account**:
   ```bash
   python manage.py createsuperuser
   ```
   * Follow the terminal prompts to enter your username, email, and password.
   * *Note: When typing your password, the letters will not appear on the screen (this is a security feature). Just type it and hit Enter.*

#### Option B: Use Pre-populated Demo Data
If you want to use the pre-loaded data (users, venues, timetables), run:
```bash
python manage.py migrate
python manage.py loaddata data_dump.json
```


### Step 1.6: Start the Backend Server
Start the Django development server using `0.0.0.0` so other devices (like a phone) can access it:
```bash
python manage.py runserver 0.0.0.0:8000
```
Keep this terminal window running.

---

## 2. Frontend Setup (React/Vite) ⚡

### Step 2.1: Open a NEW Terminal and Navigate to Frontend
Open a separate terminal window and go to the frontend directory:
```bash
cd frontend
```

### Step 2.2: Install Node Packages
Download and install the required frontend packages:
```bash
npm install
```

### Step 2.3: Start the Frontend Dev Server
Run the frontend server with the `--host` flag to make it visible on the local network:
```bash
npm run dev -- --host
```
Keep this terminal window running. It will output lines like this:
```text
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.15:5173/
```
Take note of the **Network URL** (e.g., `http://192.168.1.15:5173/`).

---

## 3. Running and Presenting on a Mobile Phone 📱
To access the app from your mobile phone:

1. **Connect to the Same Network**: Ensure both your laptop and phone are connected to the exact same Wi-Fi network (or connect your phone to your laptop's mobile hotspot).
2. **Get the Laptop IP**: Look at the Network URL shown in the frontend terminal (e.g., `192.168.1.15`) or run `ipconfig` (Windows) / `ifconfig` (Mac) in a terminal.
3. **Open on Phone**:
   * Open the web browser on your phone.
   * Type in the network URL: `http://<laptop-ip>:5173` (e.g., `http://192.168.1.15:5173`).
4. **Network Auto-Linking**: The application is designed to automatically detect the IP address. When you load the page on your phone, it will seamlessly communicate with the backend server running at `http://<laptop-ip>:8000` without any extra configurations!

---

## 🔑 Login Credentials for Presentation

### Scenario 1: If you chose Option A (Start Fresh)
* **Admin Access**: Log in using the **username** and **password** you created during the `python manage.py createsuperuser` step.
* **Adding Users/Venues**: Once logged in as Admin, you can add Lecturers, Students, and Venues via the admin interface, or upload the included `timetable.csv` file to populate the timetables.

### Scenario 2: If you chose Option B (Pre-populated Demo Data)
Use these accounts to show the system's different views:
* **Admin Role (Full Access)**:
  * **Username**: `Nancy`
  * **Password**: `Nancy@123`
* **Lecturer Role (Start Session / QR Code / Take Attendance)**:
  * **Username**: `nancy1@gmail.com`
  * **Password**: `12345`
* **Student Role (Check-in / View Personal Attendance)**:
  * **Username**: `nancy123@gmail.com`
  * **Password**: `12345`


---

## 🔧 Troubleshooting

### 1. "Network request failed" or Phone cannot connect to Laptop
* **Check Wi-Fi Network**: Ensure both devices are connected to the *same Wi-Fi router*. Some public/university Wi-Fi networks block device-to-device communication. If it doesn't work, set up a **Mobile Hotspot** from the laptop and connect the phone to it.
* **Firewall blocks**: Windows Defender Firewall might block external traffic.
  * *Fix*: Disable the firewall temporarily during the presentation, or add an inbound rule for ports `5173` and `8000`.

### 2. Database Error or Missing Tables
* Ensure you ran `python manage.py migrate`.
* If you want the demo data loaded, ensure you ran `python manage.py loaddata data_dump.json`.
* If using SQLite, verify that the `db.sqlite3` file is generated inside the `backend` directory after running migrations.


### 3. Vite Server Not Opening
* If port `5173` is busy, Vite will automatically select `5174` or another port. Make sure to check the URL output in the terminal and use that port (e.g., `http://<laptop-ip>:5174`).
