# Presentation Setup Guide 🚀
This guide contains step-by-step instructions to set up a brand-new computer from scratch and run the **Smart Venue & Timetable Attendance System**.

---

## 📋 Step 1: Install Required Software 🛠️
Since this is a new laptop, you must download and install the following tools first. Follow the links and run the installers with their default settings:

### 1. Visual Studio Code (Code Editor)
* **Download**: [code.visualstudio.com](https://code.visualstudio.com/)
* Install VS Code. This is where you will run your terminals and edit configuration files.

### 2. Git (Version Control System)
* **Download**: [git-scm.com/download/win](https://git-scm.com/download/win)
* Install Git. 
* *Note: You do NOT need a GitHub account to download/clone the project because it is public!*

### 3. Python (Backend Language)
* **Download**: [python.org/downloads](https://www.python.org/downloads/) (Choose Python 3.10 or newer)
* ⚠️ **CRITICAL STEP**: During installation, on the very first screen, you **MUST check the checkbox at the bottom that says "Add Python to PATH"** before clicking "Install Now". If you miss this, python commands will not work in the terminal!

### 4. Node.js (Frontend Runtime)
* **Download**: [nodejs.org](https://nodejs.org/) (Select the **LTS** version)
* Install with default options.

### 5. PostgreSQL (Database Engine)
* **Download**: [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
* Run the installer. 
* ⚠️ **CRITICAL STEP**: During the installation, it will ask you to set a password for the database. **Write this password down!** (We recommend setting it to `mjtechnologies` to match the default configuration, or use whatever you like).

---

## 📥 Step 2: Clone the Project in VS Code 💻
1. Open **Visual Studio Code**.
2. Open the terminal inside VS Code:
   * Press `Ctrl + ` ` (Ctrl and the backtick key, next to the 1 key) OR go to **Terminal** -> **New Terminal** at the top menu.
3. Paste the following command into the terminal and press **Enter**:
   ```bash
   git clone https://github.com/Mabalazac/Smart-attendance.git
   ```
4. Once it finishes downloading, open the project folder in VS Code:
   * Go to **File** -> **Open Folder...**
   * Navigate to your main folder (usually `C:\Users\YourName\Smart-attendance`) and select the **`Smart-attendance`** folder.

---

## 🗄️ Step 3: Database Setup (PostgreSQL)
1. Open **pgAdmin 4** (it was installed alongside PostgreSQL. Search for it in the Windows Start menu).
2. Connect to your server (it will ask for the password you set during the PostgreSQL installation).
3. Right-click on **Databases** -> **Create** -> **Database...**
4. Name the database **`smart_venue_db`** and click **Save**.
5. Go back to VS Code.
6. Open `backend/smart_venue/settings.py` by clicking on it in the left-side folder list.
7. Scroll down to the `DATABASES` section (around line 85):
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'smart_venue_db',
           'USER': 'postgres',
           'PASSWORD': 'mjtechnologies',  # <-- Change this to your local PostgreSQL password
           'HOST': 'localhost',
           'PORT': '5432',
       }
   }
   ```
8. Change `'PASSWORD'` to match the PostgreSQL password you created during installation, then save the file (`Ctrl + S`).

---

## 🐍 Step 4: Backend Setup (Django)

1. In VS Code, make sure your terminal is open.
2. Go into the backend directory:
   ```bash
   cd backend
   ```
3. Create a Python Virtual Environment:
   ```powershell
   python -m venv venv
   ```
4. Activate the virtual environment:
   ```powershell
   venv\Scripts\activate
   ```
   *(You should see `(venv)` appear at the beginning of your terminal line)*
5. Install the backend Python libraries:
   ```bash
   pip install -r requirements.txt
   ```
6. Run migrations to build the tables in PostgreSQL:
   ```bash
   python manage.py migrate
   ```
7. Create your presentation **Admin** account:
   ```bash
   python manage.py createsuperuser
   ```
   * Follow the terminal prompts to enter your username, email, and password.
   * *Note: When typing the password, characters will not show on the screen. Just type it and hit Enter.*
8. Start the backend server:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```
   *(Keep this terminal open and running!)*

---

## ⚡ Step 5: Frontend Setup (React/Vite)

1. Open a **new separate terminal** in VS Code:
   * Click the **`+`** icon at the top right of your existing terminal window, or go to **Terminal** -> **New Terminal**.
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install frontend packages:
   ```bash
   npm install
   ```
4. Start the frontend developer server on your network:
   ```bash
   npm run dev -- --host
   ```
5. Look at the terminal output. It will show a **Network URL** (for example: `http://192.168.1.15:5173/`).

---

## 📱 Step 6: Accessing on Phone
1. Connect both your laptop and phone to the **same Wi-Fi network**.
2. Open the web browser on your phone and type in the **Network URL** shown in your frontend terminal (e.g. `http://192.168.1.15:5173`).
3. The phone will automatically connect to your laptop's backend server running at port `8000`.

---

## 🎬 Step 7: How to Present the Flow

Since we are starting with a completely empty database, run the demo in this order:

### 1. Log in as Admin & Upload the Timetable
* Go to the web app (`http://localhost:5173`) on the laptop.
* Click **Login** and sign in using the **Admin** account you created in Step 4.
* Go to the **Admin Panel** (or Timetable tab).
* Upload the **`timetable.csv`** file (located in the root folder of the `Smart-attendance` directory).
* *This automatically registers all Lecturers listed in the CSV (default password is `12345`) and creates all venues, courses, and timetables.*

### 2. Register Students
* Click **Register** on the website navigation bar.
* Create a **Student** account. Enter the student's name, email, password, and their target class program/stream (e.g. `BIT_1B` to match the timetable entries).

### 3. Start a Class (as Lecturer)
* Log out of the Admin panel.
* Log in as one of the lecturers listed in the CSV (using the default password **`12345`**).
* Navigate to **My Classes**.
* If a class is scheduled for today and the start time has arrived, you will see a blue pulsing **"Ready"** button.
* Click **Start Class** to generate the attendance QR Code.

### 4. Scan QR Code (as Student)
* Log in as the Student on your phone.
* Navigate to **Scan Attendance**, allow camera permission, and scan the QR Code on the lecturer's screen to check in!

---

## 🔧 Troubleshooting

### 1. "Network request failed" on Phone
* Ensure both devices are on the *same Wi-Fi*.
* **Windows Firewall**: Search for "Windows Defender Firewall" in Windows Search, turn it off temporarily during the presentation, or add rules to allow ports `5173` and `8000`.

### 2. Python command is not recognized
* This means Python was installed without checking "Add Python to PATH".
* **Fix**: Run the Python installer file again, click **Modify**, check **Add Python to PATH**, and finish. Then close and reopen VS Code.
