from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db.models import Q
from .models import TimetableEntry, Course
from .serializers import TimetableEntrySerializer, CourseSerializer
import csv
import io
import datetime
from users.models import User
from venues.models import Venue

# Map program full names to the short codes used in target_class (e.g. BIT_1A)
PROGRAM_CODE_MAP = {
    'BSc IT': 'BIT',
    'BSc CS': 'BCS',
    'BSc NE': 'BNE',
    'BSc SE': 'BSE',
    'ODIT':   'ODIT',
    'ODCS':   'ODCS',
}

@api_view(['GET'])
@permission_classes([AllowAny])
def get_courses(request):
    courses = Course.objects.all()
    serializer = CourseSerializer(courses, many=True)
    return Response(serializer.data)


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer


class TimetableEntryViewSet(viewsets.ModelViewSet):
    serializer_class = TimetableEntrySerializer

    def get_queryset(self):
        user = self.request.user
        queryset = TimetableEntry.objects.all()

        # Support optional ?day= filter for all roles
        day = self.request.query_params.get('day')
        if day:
            queryset = queryset.filter(day=day)

        # Lecturers only see their own entries via the base list endpoint
        if user.role == 'lecturer':
            return queryset.filter(lecturer=user)

        return queryset

    # ------------------------------------------------------------------
    # STUDENT: personalised timetable filtered by program / year / stream
    # ------------------------------------------------------------------
    @action(detail=False, methods=['get'], url_path='student-schedule')
    def student_schedule(self, request):
        """
        Returns timetable entries filtered to the logged-in student's
        program, academic_year, and stream (via target_class matching).
        Each entry is annotated with `active_session_id` when a live
        ClassSession exists for that entry today.
        """
        user = request.user
        if user.role != 'student':
            return Response(
                {'error': 'Only students can access this endpoint.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not user.program or not user.academic_year:
            # Profile incomplete – return all active entries so the student
            # sees something rather than a blank screen
            queryset = TimetableEntry.objects.filter(is_active=True)
        else:
            code = PROGRAM_CODE_MAP.get(user.program, user.program[:3].upper())
            stream = (user.stream or '').upper()
            target = f"{code}_{user.academic_year}{stream}"

            queryset = TimetableEntry.objects.filter(
                Q(target_class__iexact=target) |
                Q(target_class__isnull=True) |
                Q(target_class=''),
                course__program=user.program,
                course__academic_year=user.academic_year,
                is_active=True,
            )

        # Annotate with active session id for today so the frontend can show
        # a "Sign Attendance" button on live classes
        from attendance.models import ClassSession, AttendanceRecord
        from attendance.views import check_and_mark_missed_classes
        check_and_mark_missed_classes()

        today = datetime.date.today()
        sessions = ClassSession.objects.filter(
            timetable_entry__in=queryset,
            date=today,
        ).values('timetable_entry_id', 'id', 'status')
        session_map = {s['timetable_entry_id']: s for s in sessions}

        attended_sessions = AttendanceRecord.objects.filter(
            student=user,
            session_id__in=[s['id'] for s in sessions if s['status'] == 'active'],
            status='present'
        ).values_list('session_id', flat=True)
        attended_set = set(attended_sessions)

        now = datetime.datetime.now()
        current_day = now.strftime('%A')
        current_time = now.time()
        entry_map = {e.id: e for e in queryset}

        serializer = TimetableEntrySerializer(queryset, many=True)
        data = list(serializer.data)
        for entry in data:
            s_info = session_map.get(entry['id'])
            if s_info:
                entry['session_id'] = s_info['id']
                entry['session_status'] = s_info['status']
                if s_info['status'] == 'active':
                    entry['active_session_id'] = s_info['id']
                    entry['is_signed_in'] = s_info['id'] in attended_set
                else:
                    entry['active_session_id'] = None
                    entry['is_signed_in'] = False
            else:
                entry['session_id'] = None
                
                # Check if the class scheduled time has arrived today
                db_entry = entry_map.get(entry['id'])
                if db_entry and db_entry.day == current_day and current_time >= db_entry.start_time:
                    entry['session_status'] = 'ready'
                else:
                    entry['session_status'] = 'upcoming'
                    
                entry['active_session_id'] = None
                entry['is_signed_in'] = False

        return Response(data)

    # ------------------------------------------------------------------
    # LECTURER: their own weekly schedule with today's session status
    # ------------------------------------------------------------------
    @action(detail=False, methods=['get'], url_path='my-schedule')
    def my_schedule(self, request):
        """
        Returns timetable entries assigned to the logged-in lecturer.
        Supports optional ?day=Monday filter.
        Each entry is annotated with `session_id` and `session_status`
        based on whether a ClassSession was created for that entry today.
        """
        user = request.user
        if user.role != 'lecturer':
            return Response(
                {'error': 'Only lecturers can access this endpoint.'},
                status=status.HTTP_403_FORBIDDEN
            )

        day = request.query_params.get('day')
        queryset = TimetableEntry.objects.filter(lecturer=user, is_active=True)
        if day:
            queryset = queryset.filter(day=day)

        # Look up any ClassSessions created today for these entries
        from attendance.models import ClassSession
        from attendance.views import check_and_mark_missed_classes
        check_and_mark_missed_classes()
        
        today = datetime.date.today()
        sessions = ClassSession.objects.filter(
            timetable_entry__in=queryset,
            date=today,
        ).values('timetable_entry_id', 'id', 'status')

        session_map = {
            s['timetable_entry_id']: {
                'session_id': s['id'],
                'session_status': s['status'],
            }
            for s in sessions
        }

        now = datetime.datetime.now()
        current_day = now.strftime('%A')
        current_time = now.time()
        entry_map = {e.id: e for e in queryset}

        serializer = TimetableEntrySerializer(queryset, many=True)
        data = list(serializer.data)
        for entry in data:
            info = session_map.get(entry['id'], {})
            entry['session_id'] = info.get('session_id')        # None if not started
            
            # Determine status: if not started but time reached, show as 'ready'
            session_status = info.get('session_status')
            if not session_status:
                db_entry = entry_map.get(entry['id'])
                if db_entry and db_entry.day == current_day and current_time >= db_entry.start_time:
                    session_status = 'ready'
                else:
                    session_status = 'upcoming'
            entry['session_status'] = session_status

        return Response(data)

    # ------------------------------------------------------------------
    # ADMIN: CSV upload
    # ------------------------------------------------------------------
    @action(detail=False, methods=['post'])
    def upload(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded_file = file.read().decode('utf-8-sig')   # handle BOM
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)

            created_count = 0
            skipped_count = 0
            errors = []

            for i, row in enumerate(reader):
                try:
                    course_code = row.get('course_code', '').strip()
                    if not course_code or course_code == 'Unknown':
                        skipped_count += 1
                        continue

                    course, _ = Course.objects.get_or_create(
                        code=course_code,
                        defaults={
                            'name': row.get('course_name', course_code),
                            'program': row.get('program', 'General'),
                            'academic_year': int(row.get('academic_year') or 1)
                        }
                    )

                    lecturer_email = row.get('lecturer_email', '').strip()
                    lecturer = User.objects.filter(email=lecturer_email, role='lecturer').first()

                    if not lecturer and lecturer_email:
                        lecturer, created = User.objects.get_or_create(
                            email=lecturer_email,
                            defaults={
                                'username': lecturer_email,
                                'role': 'lecturer',
                                'first_name': row.get('lecturer_name', 'Lecturer').split('.')[0].strip(),
                                'last_name': row.get('lecturer_name', 'Staff').split('.')[-1].strip(),
                            }
                        )
                        if created:
                            lecturer.set_password('12345')
                            lecturer.save()

                    if not lecturer:
                        errors.append(f"Row {i+1}: No lecturer found for '{lecturer_email}'")
                        skipped_count += 1
                        continue

                    venue_name = row.get('venue_name', '').strip()
                    venue = None
                    if venue_name and venue_name != 'Unknown':
                        venue, _ = Venue.objects.get_or_create(
                            name=venue_name,
                            defaults={'building': 'Main Campus', 'capacity': 50, 'status': 'free', 'type': 'Classroom'}
                        )

                    entry_type = row.get('type', 'lecture').lower()
                    if 'lab' in entry_type:
                        entry_type = 'lab'
                    elif 'tutorial' in entry_type:
                        entry_type = 'tutorial'
                    else:
                        entry_type = 'lecture'

                    TimetableEntry.objects.create(
                        course=course,
                        lecturer=lecturer,
                        venue=venue,
                        day=row.get('day', 'Monday').strip(),
                        start_time=row.get('start_time', '08:00').strip(),
                        end_time=row.get('end_time', '10:00').strip(),
                        type=entry_type,
                        target_class=row.get('class', '').strip() or row.get('Class', '').strip() or None,
                    )
                    created_count += 1

                except Exception as row_error:
                    errors.append(f"Row {i+1}: {str(row_error)}")
                    skipped_count += 1

            return Response({
                'status': 'Processing complete',
                'created': created_count,
                'skipped': skipped_count,
                'errors': errors[:10]
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
