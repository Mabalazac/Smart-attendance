import math
import datetime
from rest_framework import viewsets, status, views
from rest_framework.response import Response
from .models import ClassSession, AttendanceRecord
from venues.models import Venue
from .serializers import ClassSessionSerializer, AttendanceRecordSerializer, CheckInSerializer
import csv
from django.http import HttpResponse
from django.db.models import Count, Q
from rest_framework.exceptions import ValidationError

def check_and_mark_missed_classes():
    from timetable.models import TimetableEntry
    now = datetime.datetime.now()
    current_day = now.strftime('%A')
    
    # Check entries for today
    entries_today = TimetableEntry.objects.filter(day=current_day, is_active=True)
    for entry in entries_today:
        start_datetime = datetime.datetime.combine(now.date(), entry.start_time)
        safe_waiting_time = datetime.timedelta(minutes=30)
        max_start_datetime = start_datetime + safe_waiting_time
        
        if now > max_start_datetime:
            session_exists = ClassSession.objects.filter(
                timetable_entry=entry,
                date=now.date()
            ).exists()
            
            if not session_exists:
                ClassSession.objects.create(
                    timetable_entry=entry,
                    venue=entry.venue,
                    lecturer=entry.lecturer,
                    date=now.date(),
                    start_time=entry.start_time,
                    end_time=entry.end_time,
                    status='missed'
                )

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000 # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

class ClassSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ClassSessionSerializer

    def get_queryset(self):
        check_and_mark_missed_classes()
        return ClassSession.objects.all()

    def perform_create(self, serializer):
        """
        When a lecturer starts a class:
        - Set lecturer from the logged-in user (no need to pass it from frontend)
        - Inherit venue from the timetable entry if not explicitly provided
        - Always start as 'active'
        - Mark venue as 'occupied'
        """
        timetable_entry = serializer.validated_data.get('timetable_entry')
        venue = serializer.validated_data.get('venue')
        if venue is None and timetable_entry and timetable_entry.venue:
            venue = timetable_entry.venue

        if timetable_entry:
            now = datetime.datetime.now()
            current_day = now.strftime('%A')
            if timetable_entry.day != current_day:
                raise ValidationError({"detail": f"Cannot start class today. It is scheduled for {timetable_entry.day}."})
            
            start_datetime = datetime.datetime.combine(now.date(), timetable_entry.start_time)
            end_datetime = datetime.datetime.combine(now.date(), timetable_entry.end_time)
            safe_waiting_time = datetime.timedelta(minutes=30)
            max_start_datetime = start_datetime + safe_waiting_time

            if now < start_datetime:
                raise ValidationError({"detail": f"Cannot start class yet. Class is scheduled for {timetable_entry.start_time.strftime('%H:%M')}."})
            
            if now > max_start_datetime:
                check_and_mark_missed_classes()
                raise ValidationError({"detail": "Safe waiting time (30 mins) to start the class has passed. The class is now marked as missed."})


        if venue:
            # End any existing active session in this venue
            ClassSession.objects.filter(venue=venue, status='active').update(
                status='ended',
                end_time=datetime.datetime.now().time()
            )
            venue.status = 'occupied'
            venue.save(update_fields=['status'])

        serializer.save(
            lecturer=self.request.user,
            venue=venue,
            status='active',
        )

    def partial_update(self, request, *args, **kwargs):
        """When a session is ended, free up the venue and mark missing students as absent."""
        response = super().partial_update(request, *args, **kwargs)
        session = self.get_object()
        if session.status == 'ended':
            if session.venue:
                session.venue.status = 'free'
                session.venue.save(update_fields=['status'])
            
            # Find expected students and mark them absent if they have no record
            course = session.timetable_entry.course
            if course:
                from users.models import User
                expected_students = User.objects.filter(
                    Q(role='student') &
                    (Q(enrollments__course=course) | Q(program=course.program, academic_year=course.academic_year))
                ).distinct()
                
                existing_records = AttendanceRecord.objects.filter(session=session).values_list('student_id', flat=True)
                missing_students = expected_students.exclude(id__in=existing_records)
                
                absent_records = [
                    AttendanceRecord(
                        session=session,
                        student=student,
                        status='absent'
                    )
                    for student in missing_students
                ]
                if absent_records:
                    AttendanceRecord.objects.bulk_create(absent_records)

        return response

class AttendanceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceRecordSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return AttendanceRecord.objects.filter(student=user)
        return AttendanceRecord.objects.all()

class CheckInView(views.APIView):
    """
    Unified check-in endpoint for the GPS → QR → Check-in pipeline.

    Required payload:
        session_id   – the active ClassSession id (from timetable card URL)
        qr_venue_id  – the venue_id decoded from the scanned QR code
        latitude     – student GPS latitude
        longitude    – student GPS longitude

    Validation order:
        1. Student role check
        2. Session exists and is active
        3. QR venue_id matches the session's actual venue
        4. Enrollment / profile match
        5. GPS proximity (≤ 30 m)
        6. Duplicate check
    """

    def post(self, request):
        serializer = CheckInSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if user.role != 'student':
            return Response({'error': 'Only students can check in'}, status=status.HTTP_403_FORBIDDEN)

        session_id  = serializer.validated_data['session_id']
        qr_venue_id = serializer.validated_data['qr_venue_id']
        lat         = serializer.validated_data['latitude']
        lon         = serializer.validated_data['longitude']

        # 1. Find the active session
        try:
            session = ClassSession.objects.get(id=session_id, status='active')
        except ClassSession.DoesNotExist:
            return Response(
                {'error': 'No active session found. The class time has ended or the lecturer closed the session.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # 2. QR venue must match the session's venue
        if session.venue_id is None:
            return Response(
                {'error': 'This session has no venue assigned. Contact your lecturer.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if session.venue_id != qr_venue_id:
            return Response(
                {'error': 'QR code does not match this classroom. Make sure you are scanning the correct venue QR code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. Enrollment / profile check
        course = session.timetable_entry.course
        is_enrolled = user.enrollments.filter(course=course).exists()
        is_matching_profile = (
            user.program == course.program and
            user.academic_year == course.academic_year
        )

        if not (is_enrolled or is_matching_profile):
            return Response(
                {'error': 'You are not enrolled in this course.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # 4. GPS proximity check
        if session.venue.latitude is not None and session.venue.longitude is not None:
            distance = haversine(lat, lon, session.venue.latitude, session.venue.longitude)
            if distance > 5:  # 5 metres radius
                return Response(
                    {'error': f'You are {int(distance)}m away from the venue. Move closer and try again.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # 5. Create attendance record (idempotent)
        record, created = AttendanceRecord.objects.get_or_create(
            session=session,
            student=user,
            defaults={
                'status': 'present',
                'recorded_latitude': lat,
                'recorded_longitude': lon,
            },
        )

        if not created:
            return Response(
                {'error': 'You have already signed attendance for this class.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {'success': True, 'message': 'Attendance marked successfully!'},
            status=status.HTTP_201_CREATED,
        )

class ActiveSessionView(views.APIView):
    def get(self, request):
        check_and_mark_missed_classes()
        user = request.user
        from timetable.models import Course

        # Match by explicit enrollment
        enrolled_course_ids = set(
            user.enrollments.values_list('course', flat=True)
        )

        # Match by program + academic_year profile (how most students are linked)
        if user.program and user.academic_year:
            profile_course_ids = set(
                Course.objects.filter(
                    program=user.program,
                    academic_year=user.academic_year,
                ).values_list('id', flat=True)
            )
        else:
            profile_course_ids = set()

        all_course_ids = enrolled_course_ids | profile_course_ids

        sessions = ClassSession.objects.filter(
            status='active',
            timetable_entry__course__in=all_course_ids,
        )

        if sessions.exists():
            # Return all active sessions so the student sees every live class
            return Response(ClassSessionSerializer(sessions, many=True).data)
        return Response(None, status=status.HTTP_204_NO_CONTENT)

class ReportGenerationView(views.APIView):
    def get(self, request):
        if not request.user.is_authenticated or request.user.role != 'admin':
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        report_type = request.query_params.get('type')
        if not report_type:
            return Response({'error': 'Report type is required'}, status=status.HTTP_400_BAD_REQUEST)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{report_type}_report.csv"'
        writer = csv.writer(response)

        if report_type == 'venue_usage':
            writer.writerow(['Venue Name', 'Building', 'Total Sessions Hosted', 'Total Recorded Attendances'])
            venues = Venue.objects.all()
            for venue in venues:
                sessions = ClassSession.objects.filter(venue=venue)
                total_sessions = sessions.count()
                total_attendance = AttendanceRecord.objects.filter(session__in=sessions, status='present').count()
                writer.writerow([venue.name, venue.building, total_sessions, total_attendance])

        elif report_type == 'attendance_summary':
            writer.writerow(['Course Code', 'Course Name', 'Lecturer', 'Total Sessions', 'Total Present', 'Total Enrolled'])
            from timetable.models import Course, Enrollment
            courses = Course.objects.all()
            for course in courses:
                sessions = ClassSession.objects.filter(timetable_entry__course=course)
                total_sessions = sessions.count()
                total_present = AttendanceRecord.objects.filter(session__in=sessions, status='present').count()
                total_enrolled = Enrollment.objects.filter(course=course).count()
                lecturers = set()
                for s in sessions:
                    if s.lecturer:
                        lecturers.add(f"{s.lecturer.first_name} {s.lecturer.last_name}")
                lecturer_names = ", ".join(lecturers) if lecturers else "N/A"
                writer.writerow([course.code, course.name, lecturer_names, total_sessions, total_present, total_enrolled])

        elif report_type == 'peak_hours':
            writer.writerow(['Time Slot', 'Total Sessions Active'])
            sessions = ClassSession.objects.values('start_time', 'end_time').annotate(count=Count('id'))
            for s in sessions:
                writer.writerow([f"{s['start_time']} - {s['end_time']}", s['count']])

        elif report_type == 'student_attendance':
            writer.writerow(['Student Name', 'Student Email', 'Course Code', 'Present Count', 'Absent Count', 'Late Count'])
            from users.models import User
            students = User.objects.filter(role='student')
            for student in students:
                records = AttendanceRecord.objects.filter(student=student)
                courses = records.values('session__timetable_entry__course__code').annotate(
                    present=Count('id', filter=Q(status='present')),
                    absent=Count('id', filter=Q(status='absent')),
                    late=Count('id', filter=Q(status='late'))
                )
                for c in courses:
                    writer.writerow([
                        student.get_full_name(),
                        student.email,
                        c['session__timetable_entry__course__code'] or 'Unknown Course',
                        c['present'],
                        c['absent'],
                        c['late']
                    ])

        else:
            return Response({'error': 'Invalid report type'}, status=status.HTTP_400_BAD_REQUEST)

        return response
