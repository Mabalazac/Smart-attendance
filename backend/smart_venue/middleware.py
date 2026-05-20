import datetime
import logging
from django.core.cache import cache
from django.utils.timezone import localtime, now

logger = logging.getLogger(__name__)

def sync_system_state():
    """
    Evaluates timetable entries and active class sessions to automate state transitions:
    1. End expired class sessions.
    2. Reserve venues for upcoming classes.
    3. Release venues if a class is not started within the 15-minute grace period.
    """
    from attendance.models import ClassSession
    from timetable.models import TimetableEntry
    from venues.models import Venue

    current_datetime = localtime(now())
    current_time = current_datetime.time()
    today_name = current_datetime.strftime('%A')
    today_date = current_datetime.date()

    # 1. End active sessions that have passed their end time
    expired_sessions = ClassSession.objects.filter(
        status='active',
        timetable_entry__end_time__lte=current_time,
        date__lte=today_date
    )
    
    for session in expired_sessions:
        session.status = 'ended'
        session.save(update_fields=['status'])
        if session.venue:
            session.venue.status = 'free'
            session.venue.save(update_fields=['status'])
            logger.info(f"Auto-ended session {session.id} and freed venue {session.venue.name}")

    # 2. Process today's active timetable entries to reserve or free venues
    todays_entries = TimetableEntry.objects.filter(
        day=today_name,
        is_active=True,
        venue__isnull=False
    )
    
    # We only care about entries that should be happening right now
    current_entries = todays_entries.filter(
        start_time__lte=current_time,
        end_time__gt=current_time
    )

    for entry in current_entries:
        # Check if a session was created for this entry today
        session_exists = ClassSession.objects.filter(
            timetable_entry=entry,
            date=today_date
        ).exists()

        if not session_exists:
            # Calculate how many minutes since start time
            start_datetime = datetime.datetime.combine(today_date, entry.start_time)
            # Make start_datetime timezone aware
            from django.utils.timezone import make_aware, get_current_timezone
            if not start_datetime.tzinfo:
                start_datetime = make_aware(start_datetime, get_current_timezone())
                
            minutes_elapsed = (current_datetime - start_datetime).total_seconds() / 60.0

            if 0 <= minutes_elapsed <= 15:
                # Inside 15 minute grace period -> Reserved
                if entry.venue.status not in ['reserved', 'occupied']:
                    entry.venue.status = 'reserved'
                    entry.venue.save(update_fields=['status'])
                    logger.info(f"Auto-reserved venue {entry.venue.name} for upcoming class {entry.course.code}")
            elif minutes_elapsed > 15:
                # Grace period expired -> Free
                if entry.venue.status == 'reserved':
                    entry.venue.status = 'free'
                    entry.venue.save(update_fields=['status'])
                    logger.info(f"Grace period expired for class {entry.course.code}. Freed venue {entry.venue.name}")


class StateSyncMiddleware:
    """
    Middleware that runs state synchronization for venues and classes
    on incoming requests, throttled to run once every 60 seconds.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # We only need to run this periodically. We throttle it to 60 seconds.
        # This acts as a poor man's cron job without requiring Celery.
        lock_id = "system_state_sync_lock"
        if not cache.get(lock_id):
            # Set the cache for 60 seconds to prevent other requests from triggering it
            cache.set(lock_id, True, 60)
            try:
                sync_system_state()
            except Exception as e:
                logger.error(f"Error during system state sync: {e}")

        response = self.get_response(request)
        return response
