from django.db import models
from users.models import User
from venues.models import Venue

class Course(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=150)
    program = models.CharField(max_length=150, help_text="The program this course belongs to, e.g. BSc Computer Science")
    academic_year = models.IntegerField(help_text="Year of study e.g. 1, 2, 3")

    def __str__(self):
        return f"{self.code} - {self.name}"

class Enrollment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'student'}, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'course')

    def __str__(self):
        return f"{self.student.email} -> {self.course.code}"

class TimetableEntry(models.Model):
    TYPE_CHOICES = (
        ('lecture', 'Lecture'),
        ('lab', 'Lab'),
        ('tutorial', 'Tutorial'),
    )
    DAY_CHOICES = (
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    )

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='timetable_entries', null=True)
    lecturer = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'lecturer'})
    venue = models.ForeignKey(Venue, on_delete=models.SET_NULL, null=True)
    
    day = models.CharField(max_length=20, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    target_class = models.CharField(max_length=100, blank=True, null=True, help_text="The target class from the timetable, e.g. BIT_1B")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        course_display = self.course.code if self.course else "Unknown Course"
        return f"{course_display} ({self.day})"
