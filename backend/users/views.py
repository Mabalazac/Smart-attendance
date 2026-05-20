from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import User
from venues.models import Venue
from attendance.models import AttendanceRecord, ClassSession
from timetable.models import TimetableEntry
from .serializers import StudentRegistrationSerializer, CustomTokenObtainPairSerializer, UserSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from datetime import date
import datetime


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class StudentRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = StudentRegistrationSerializer
    permission_classes = [AllowAny]


class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        user = serializer.save()
        if 'password' in self.request.data and self.request.data['password']:
            user.set_password(self.request.data['password'])
            user.save()


class UserListView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def perform_create(self, serializer):
        user = serializer.save(username=serializer.validated_data.get('email', ''))
        if 'password' in self.request.data:
            user.set_password(self.request.data['password'])
            user.save()


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def perform_update(self, serializer):
        user = serializer.save()
        if 'password' in self.request.data and self.request.data['password']:
            user.set_password(self.request.data['password'])
            user.save()


class DashboardStatsView(views.APIView):
    def get(self, request):
        user = request.user
        data = {}

        try:
            if user.role == 'student':
                records = AttendanceRecord.objects.filter(student=user)
                total = records.count()
                present = records.filter(status='present').count()
                enrolled_courses = user.enrollments.values_list('course', flat=True)
                today = date.today()
                today_name = today.strftime('%A')   # e.g. 'Thursday'

                # Count timetable entries for today matching the student's program/year
                classes_today = TimetableEntry.objects.filter(
                    course__in=enrolled_courses,
                    day=today_name,
                    is_active=True,
                ).count()

                data = {
                    'attendance_rate': round((present / total * 100)) if total > 0 else 0,
                    'free_venues': Venue.objects.filter(status='free').count(),
                    'classes_today': classes_today,
                    'sessions_attended': present,
                    'total_sessions': total,
                    'recent_attendance': list(
                        records.order_by('-timestamp')[:4].values(
                            'id', 'status', 'timestamp',
                            'session__timetable_entry__course__code'
                        )
                    ),
                }

            elif user.role == 'lecturer':
                today = date.today()
                today_name = today.strftime('%A')   # e.g. 'Thursday'

                # Use TimetableEntry (not ClassSession) so lecturers see today's
                # schedule even before they have started any session
                today_entries = TimetableEntry.objects.filter(
                    lecturer=user,
                    day=today_name,
                    is_active=True,
                ).order_by('start_time')

                # Look up sessions created today for those entries
                today_sessions_qs = ClassSession.objects.filter(
                    lecturer=user,
                    date=today,
                )
                session_by_entry = {s.timetable_entry_id: s for s in today_sessions_qs}

                # Active session (for live stats)
                active_session = today_sessions_qs.filter(status='active').first()

                today_schedule = []
                for entry in today_entries:
                    session = session_by_entry.get(entry.id)
                    today_schedule.append({
                        'id': session.id if session else None,
                        'timetable_entry_id': entry.id,
                        'status': session.status if session else 'upcoming',
                        'start_time': str(entry.start_time),
                        'end_time': str(session.end_time) if session and session.end_time else None,
                        'venue__name': entry.venue.name if entry.venue else 'TBA',
                        'timetable_entry__course__code': entry.course.code if entry.course else 'N/A',
                        'target_class': entry.target_class or '',
                    })

                total_enrolled = 0
                if active_session:
                    course = active_session.timetable_entry.course
                    if course:
                        from django.db.models import Q
                        total_enrolled = User.objects.filter(
                            Q(role='student') &
                            (Q(enrollments__course=course) | Q(program=course.program, academic_year=course.academic_year))
                        ).distinct().count()

                data = {
                    'active_session': active_session.id if active_session else None,
                    'today_classes': today_entries.count(),
                    'students_present': AttendanceRecord.objects.filter(
                        session=active_session
                    ).count() if active_session else 0,
                    'total_enrolled': total_enrolled or 50,   # Fallback to 50 if no students enrolled
                    'today_schedule': today_schedule,
                }

            elif user.role == 'admin':
                # Aggregate student counts by program
                from django.db.models import Count
                from timetable.models import Course
                program_stats = User.objects.filter(role='student').values('program').annotate(count=Count('id'))
                
                data = {
                    'total_venues': Venue.objects.count(),
                    'free_now': Venue.objects.filter(status='free').count(),
                    'occupied': Venue.objects.filter(status='occupied').count(),
                    'reserved': Venue.objects.filter(status='reserved').count(),
                    'venue_status': list(Venue.objects.all().values('id', 'name', 'building', 'status')),
                    'student_counts_by_program': list(program_stats),
                    'total_lecturers': User.objects.filter(role='lecturer').count(),
                    'total_students': User.objects.filter(role='student').count(),
                    'total_courses': Course.objects.count(),
                    'active_sessions_today': ClassSession.objects.filter(date=date.today(), status='active').count(),
                }

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(data)
