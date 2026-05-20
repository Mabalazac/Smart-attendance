export type UserRole = 'student' | 'lecturer' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar: string;
  studentId?: string;
  staffId?: string;
  courses?: string[];
}

export interface Venue {
  id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  status: 'free' | 'reserved' | 'occupied';
  type: string;
  facilities: string[];
  coordinates: { lat: number; lng: number };
  nextAvailable?: string;
  currentClass?: string;
}

export interface TimetableEntry {
  id: string;
  courseCode: string;
  courseName: string;
  lecturer: string;
  venue: string;
  day: string;
  startTime: string;
  endTime: string;
  type: 'lecture' | 'lab' | 'tutorial';
  isActive?: boolean;
}

export interface AttendanceRecord {
  id: string;
  courseCode: string;
  courseName: string;
  date: string;
  time: string;
  venue: string;
  status: 'present' | 'absent' | 'late';
  sessionId: string;
}

export interface ClassSession {
  id: string;
  courseCode: string;
  courseName: string;
  venue: string;
  date: string;
  startTime: string;
  endTime: string;
  studentsEnrolled: number;
  studentsPresent: number;
  status: 'upcoming' | 'active' | 'ended';
}

export interface StudentAttendee {
  id: string;
  name: string;
  studentId: string;
  checkInTime: string;
  status: 'present' | 'late';
}

export const currentUser: User = {
  id: 'u1',
  name: 'Aisha Rahman',
  role: 'student',
  email: 'aisha.rahman@university.edu',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
  studentId: 'STU2024001',
  courses: ['CS301', 'CS302', 'CS303', 'MATH201'],
};

export const users: User[] = [
  currentUser,
  {
    id: 'u2',
    name: 'Dr. James Okonkwo',
    role: 'lecturer',
    email: 'j.okonkwo@university.edu',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
    staffId: 'LEC2020045',
    courses: ['CS301', 'CS302'],
  },
  {
    id: 'u3',
    name: 'Admin Sarah Chen',
    role: 'admin',
    email: 's.chen@university.edu',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
    staffId: 'ADM2019001',
  },
];

export const venues: Venue[] = [
  {
    id: 'v1',
    name: 'LT-101',
    building: 'Engineering Block A',
    floor: 1,
    capacity: 120,
    status: 'free',
    type: 'Lecture Theatre',
    facilities: ['Projector', 'AC', 'Whiteboard', 'Microphone'],
    coordinates: { lat: 3.1390, lng: 101.6869 },
  },
  {
    id: 'v2',
    name: 'CR-205',
    building: 'Science Block B',
    floor: 2,
    capacity: 40,
    status: 'occupied',
    type: 'Classroom',
    facilities: ['Projector', 'AC', 'Whiteboard'],
    coordinates: { lat: 3.1392, lng: 101.6871 },
    currentClass: 'CS301 - Data Structures',
    nextAvailable: '12:00 PM',
  },
  {
    id: 'v3',
    name: 'LAB-301',
    building: 'Computing Block C',
    floor: 3,
    capacity: 30,
    status: 'reserved',
    type: 'Computer Lab',
    facilities: ['Computers', 'AC', 'Projector', 'High-Speed Internet'],
    coordinates: { lat: 3.1388, lng: 101.6865 },
    nextAvailable: '2:00 PM',
  },
  {
    id: 'v4',
    name: 'LT-202',
    building: 'Engineering Block A',
    floor: 2,
    capacity: 80,
    status: 'free',
    type: 'Lecture Theatre',
    facilities: ['Projector', 'AC', 'Whiteboard', 'Recording System'],
    coordinates: { lat: 3.1391, lng: 101.6870 },
  },
  {
    id: 'v5',
    name: 'CR-108',
    building: 'Humanities Block D',
    floor: 1,
    capacity: 35,
    status: 'free',
    type: 'Classroom',
    facilities: ['Whiteboard', 'AC'],
    coordinates: { lat: 3.1385, lng: 101.6860 },
  },
  {
    id: 'v6',
    name: 'SEM-401',
    building: 'Admin Block E',
    floor: 4,
    capacity: 20,
    status: 'occupied',
    type: 'Seminar Room',
    facilities: ['Smart TV', 'AC', 'Video Conferencing'],
    coordinates: { lat: 3.1395, lng: 101.6875 },
    currentClass: 'MATH201 - Calculus',
    nextAvailable: '3:00 PM',
  },
];

export const timetableEntries: TimetableEntry[] = [
  {
    id: 't1',
    courseCode: 'CS301',
    courseName: 'Data Structures & Algorithms',
    lecturer: 'Dr. James Okonkwo',
    venue: 'LT-101',
    day: 'Monday',
    startTime: '08:00',
    endTime: '10:00',
    type: 'lecture',
    isActive: false,
  },
  {
    id: 't2',
    courseCode: 'CS302',
    courseName: 'Database Systems',
    lecturer: 'Dr. James Okonkwo',
    venue: 'CR-205',
    day: 'Monday',
    startTime: '10:00',
    endTime: '12:00',
    type: 'lecture',
    isActive: true,
  },
  {
    id: 't3',
    courseCode: 'MATH201',
    courseName: 'Calculus II',
    lecturer: 'Prof. Maria Santos',
    venue: 'LT-202',
    day: 'Monday',
    startTime: '14:00',
    endTime: '16:00',
    type: 'lecture',
    isActive: false,
  },
  {
    id: 't4',
    courseCode: 'CS303',
    courseName: 'Software Engineering',
    lecturer: 'Dr. Ahmed Hassan',
    venue: 'LAB-301',
    day: 'Tuesday',
    startTime: '09:00',
    endTime: '11:00',
    type: 'lab',
    isActive: false,
  },
  {
    id: 't5',
    courseCode: 'CS301',
    courseName: 'Data Structures & Algorithms',
    lecturer: 'Dr. James Okonkwo',
    venue: 'LAB-301',
    day: 'Wednesday',
    startTime: '14:00',
    endTime: '16:00',
    type: 'lab',
    isActive: false,
  },
  {
    id: 't6',
    courseCode: 'CS302',
    courseName: 'Database Systems',
    lecturer: 'Dr. James Okonkwo',
    venue: 'CR-108',
    day: 'Thursday',
    startTime: '10:00',
    endTime: '12:00',
    type: 'tutorial',
    isActive: false,
  },
  {
    id: 't7',
    courseCode: 'MATH201',
    courseName: 'Calculus II',
    lecturer: 'Prof. Maria Santos',
    venue: 'LT-101',
    day: 'Friday',
    startTime: '08:00',
    endTime: '10:00',
    type: 'lecture',
    isActive: false,
  },
];

export const attendanceRecords: AttendanceRecord[] = [
  {
    id: 'a1',
    courseCode: 'CS301',
    courseName: 'Data Structures & Algorithms',
    date: '2025-01-13',
    time: '08:05',
    venue: 'LT-101',
    status: 'present',
    sessionId: 's1',
  },
  {
    id: 'a2',
    courseCode: 'CS302',
    courseName: 'Database Systems',
    date: '2025-01-13',
    time: '10:12',
    venue: 'CR-205',
    status: 'late',
    sessionId: 's2',
  },
  {
    id: 'a3',
    courseCode: 'MATH201',
    courseName: 'Calculus II',
    date: '2025-01-10',
    time: '14:02',
    venue: 'LT-202',
    status: 'present',
    sessionId: 's3',
  },
  {
    id: 'a4',
    courseCode: 'CS303',
    courseName: 'Software Engineering',
    date: '2025-01-09',
    time: '',
    venue: 'LAB-301',
    status: 'absent',
    sessionId: 's4',
  },
  {
    id: 'a5',
    courseCode: 'CS301',
    courseName: 'Data Structures & Algorithms',
    date: '2025-01-08',
    time: '08:03',
    venue: 'LT-101',
    status: 'present',
    sessionId: 's5',
  },
  {
    id: 'a6',
    courseCode: 'CS302',
    courseName: 'Database Systems',
    date: '2025-01-07',
    time: '10:00',
    venue: 'CR-205',
    status: 'present',
    sessionId: 's6',
  },
];

export const classSessions: ClassSession[] = [
  {
    id: 'cs1',
    courseCode: 'CS302',
    courseName: 'Database Systems',
    venue: 'CR-205',
    date: '2025-01-13',
    startTime: '10:00',
    endTime: '12:00',
    studentsEnrolled: 38,
    studentsPresent: 31,
    status: 'active',
  },
  {
    id: 'cs2',
    courseCode: 'CS301',
    courseName: 'Data Structures & Algorithms',
    venue: 'LT-101',
    date: '2025-01-13',
    startTime: '08:00',
    endTime: '10:00',
    studentsEnrolled: 95,
    studentsPresent: 88,
    status: 'ended',
  },
  {
    id: 'cs3',
    courseCode: 'CS301',
    courseName: 'Data Structures & Algorithms',
    venue: 'LT-101',
    date: '2025-01-15',
    startTime: '08:00',
    endTime: '10:00',
    studentsEnrolled: 95,
    studentsPresent: 0,
    status: 'upcoming',
  },
];

export const studentAttendees: StudentAttendee[] = [
  { id: 'sa1', name: 'Aisha Rahman', studentId: 'STU2024001', checkInTime: '10:02', status: 'present' },
  { id: 'sa2', name: 'Kwame Asante', studentId: 'STU2024002', checkInTime: '10:05', status: 'present' },
  { id: 'sa3', name: 'Priya Sharma', studentId: 'STU2024003', checkInTime: '10:15', status: 'late' },
  { id: 'sa4', name: 'Carlos Mendez', studentId: 'STU2024004', checkInTime: '10:01', status: 'present' },
  { id: 'sa5', name: 'Fatima Al-Zahra', studentId: 'STU2024005', checkInTime: '10:08', status: 'present' },
  { id: 'sa6', name: 'Liam O\'Brien', studentId: 'STU2024006', checkInTime: '10:18', status: 'late' },
  { id: 'sa7', name: 'Yuki Tanaka', studentId: 'STU2024007', checkInTime: '10:03', status: 'present' },
];