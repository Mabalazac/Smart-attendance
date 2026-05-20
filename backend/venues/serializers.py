from rest_framework import serializers
from .models import Venue
from attendance.models import ClassSession
from timetable.models import TimetableEntry
import datetime


class VenueSerializer(serializers.ModelSerializer):
    coordinates = serializers.ReadOnlyField()
    status = serializers.SerializerMethodField()
    currentClass = serializers.SerializerMethodField()
    nextAvailable = serializers.SerializerMethodField()

    class Meta:
        model = Venue
        fields = [
            'id', 'name', 'building', 'floor', 'capacity', 'status',
            'type', 'facilities', 'latitude', 'longitude', 'coordinates',
            'currentClass', 'nextAvailable',
        ]

    def get_status(self, obj):
        """
        Return 'occupied' if there is an active ClassSession in this venue,
        otherwise fall back to the stored DB value (free / reserved).
        """
        has_active = ClassSession.objects.filter(
            venue=obj, status='active'
        ).exists()
        if has_active:
            return 'occupied'
        return obj.status  # 'free' or 'reserved'

    def get_currentClass(self, obj):
        """
        If a session is active in this venue, return its details so the
        frontend can show *what* class is occupying the room.
        """
        session = ClassSession.objects.filter(
            venue=obj, status='active'
        ).select_related(
            'timetable_entry__course', 'lecturer'
        ).first()

        if not session:
            return None

        entry = session.timetable_entry
        return {
            'session_id': session.id,
            'course_code': entry.course.code if entry.course else 'N/A',
            'course_name': entry.course.name if entry.course else 'N/A',
            'lecturer': session.lecturer.get_full_name() if session.lecturer else 'N/A',
            'target_class': entry.target_class or '',
            'start_time': str(session.start_time),
        }

    def get_nextAvailable(self, obj):
        """
        Look at today's timetable for this venue and return the next
        scheduled class after now (so the venue page can display it).
        Returns None when there's nothing else scheduled today.
        """
        now = datetime.datetime.now()
        today_name = now.strftime('%A')  # e.g. 'Saturday'
        current_time = now.time()

        next_entry = TimetableEntry.objects.filter(
            venue=obj,
            day=today_name,
            start_time__gt=current_time,
            is_active=True,
        ).select_related('course').order_by('start_time').first()

        if not next_entry:
            return None

        return {
            'course_code': next_entry.course.code if next_entry.course else 'N/A',
            'start_time': str(next_entry.start_time),
            'end_time': str(next_entry.end_time),
        }
