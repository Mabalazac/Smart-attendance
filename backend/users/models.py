from django.db import models
from django.contrib.auth.models import AbstractUser
import random

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('lecturer', 'Lecturer'),
        ('admin', 'Admin'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    email = models.EmailField(unique=True)
    avatar = models.URLField(max_length=500, blank=True, null=True)
    profile_picture = models.FileField(upload_to='profile_pics/', blank=True, null=True)

    
    # Student specific fields
    student_id = models.CharField(max_length=50, blank=True, null=True, unique=True)
    academic_year = models.IntegerField(blank=True, null=True, help_text="Year of study (e.g., 1, 2, 3)")
    program = models.CharField(max_length=100, blank=True, null=True, help_text="e.g. BSc IT, BSc CS")
    stream = models.CharField(max_length=10, blank=True, null=True, help_text="e.g. A, B, C")
    
    # Lecturer specific fields
    staff_id = models.CharField(max_length=50, blank=True, null=True, unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = 'admin'
        
        if self.role == 'student' and not self.student_id:
            # Determine program code (e.g., BSc IT -> BIT)
            program_code = 'GEN'
            if self.program:
                # Basic mapping for common programs
                mapping = {
                    'BSc IT': 'BIT',
                    'BSc CS': 'BCS',
                    'BSc NE': 'BNE',
                    'BSc SE': 'BSE',
                    'ODIT': 'ODIT',
                    'ODCS': 'ODCS'
                }
                program_code = mapping.get(self.program, self.program[:3].upper())
            
            # Generate random 5-7 digit number
            random_digits = random.randint(1000000, 9999999)
            self.student_id = f"IMC/{program_code}/22{random_digits}"
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
