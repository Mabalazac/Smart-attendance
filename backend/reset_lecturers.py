import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smart_venue.settings')
django.setup()

from users.models import User

def reset_lecturers():
    lecturers = User.objects.filter(role='lecturer')
    count = 0
    for u in lecturers:
        u.set_password('12345')
        u.save()
        count += 1
    print(f"Successfully reset passwords for {count} lecturers.")

if __name__ == "__main__":
    reset_lecturers()
