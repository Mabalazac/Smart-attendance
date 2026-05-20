from rest_framework import serializers
from .models import ClassSession, AttendanceRecord


class ClassSessionSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='timetable_entry.course.name', read_only=True)
    course_code = serializers.CharField(source='timetable_entry.course.code', read_only=True)
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    target_class = serializers.CharField(source='timetable_entry.target_class', read_only=True)
    lecturer_name = serializers.CharField(source='lecturer.get_full_name', read_only=True)

    # Expose venue coordinates so the frontend can do a client-side
    # distance preview before sending the check-in request.
    venue_latitude = serializers.FloatField(source='venue.latitude', read_only=True)
    venue_longitude = serializers.FloatField(source='venue.longitude', read_only=True)

    class Meta:
        model = ClassSession
        fields = [
            'id', 'timetable_entry', 'course_code', 'course_name',
            'venue', 'venue_name', 'lecturer', 'lecturer_name',
            'date', 'start_time', 'end_time', 'status', 'target_class',
            'venue_latitude', 'venue_longitude',
        ]
        extra_kwargs = {
            'lecturer': {'read_only': True}
        }


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_id_num = serializers.CharField(source='student.student_id', read_only=True)
    course_name = serializers.CharField(source='session.timetable_entry.course.name', read_only=True)
    course_code = serializers.CharField(source='session.timetable_entry.course.code', read_only=True)
    venue_name = serializers.CharField(source='session.venue.name', read_only=True)
    date = serializers.DateField(source='session.date', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'session', 'student', 'student_name', 'student_id_num',
            'timestamp', 'status', 'recorded_latitude', 'recorded_longitude',
            'course_name', 'course_code', 'venue_name', 'date',
        ]


class CheckInSerializer(serializers.Serializer):
    """
    Unified check-in payload for the GPS → QR → Check-in pipeline.
    - session_id: required — identifies the active class session
    - qr_venue_id: required — the venue_id extracted from the scanned QR code
    - latitude / longitude: required — student's GPS coordinates
    """
    session_id = serializers.IntegerField(required=True)
    qr_venue_id = serializers.IntegerField(required=True)
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
