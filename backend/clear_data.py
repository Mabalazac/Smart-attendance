import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smart_venue.settings')
django.setup()

from attendance.models import ClassSession, AttendanceRecord
from timetable.models import TimetableEntry, Course
from venues.models import Venue
from users.models import User

def clear_db():
    print("Starting database clean up of CSV-imported data...")
    
    # 1. Clear attendance records (dependent on sessions)
    att_count, _ = AttendanceRecord.objects.all().delete()
    print(f"Deleted {att_count} Attendance Records.")
    
    # 2. Clear class sessions (dependent on timetable entries)
    session_count, _ = ClassSession.objects.all().delete()
    print(f"Deleted {session_count} Class Sessions.")
    
    # 3. Clear timetable entries
    timetable_count, _ = TimetableEntry.objects.all().delete()
    print(f"Deleted {timetable_count} Timetable Entries.")
    
    # 4. Clear venues
    venue_count, _ = Venue.objects.all().delete()
    print(f"Deleted {venue_count} Venues.")
    
    # 5. Clear courses
    course_count, _ = Course.objects.all().delete()
    print(f"Deleted {course_count} Courses.")
    
    # 6. Clear all Users (Admins, Lecturers, and Students)
    user_count, _ = User.objects.all().delete()
    print(f"Deleted {user_count} User accounts (Admins, Lecturers, and Students).")
    
    print("\nClean-up complete! Database is now empty. You can now run 'python manage.py createsuperuser' to create your admin.")

if __name__ == "__main__":
    # Ask for confirmation if run interactively
    confirm = input("Are you sure you want to delete all timetable data, venues, courses, and ALL USER ACCOUNTS (Admins, Lecturers, Students)? (y/n): ")
    if confirm.lower() == 'y':
        clear_db()
    else:
        print("Wipe cancelled.")

