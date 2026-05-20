from rest_framework import serializers
from .models import TimetableEntry, Course, Enrollment

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'

class TimetableEntrySerializer(serializers.ModelSerializer):
    lecturer_name = serializers.CharField(source='lecturer.get_full_name', read_only=True)
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    program = serializers.CharField(source='course.program', read_only=True)

    class Meta:
        model = TimetableEntry
        fields = ['id', 'course', 'course_code', 'course_name', 'program', 'lecturer', 'lecturer_name', 'venue', 'venue_name', 'day', 'start_time', 'end_time', 'type', 'target_class', 'is_active']
