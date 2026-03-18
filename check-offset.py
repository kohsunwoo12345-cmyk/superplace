import re

# Sample queries to check
queries = [
    "INSERT INTO student_attendance_codes (id, userId, code, academyId, class, isActive) VALUES",
    "INSERT INTO student_attendance_codes (id, userId, code, academyId, classId, isActive) VALUES",
    "SELECT id, name, email, academyId, class FROM users WHERE id = ?",
    "SELECT id, name, email, academyId, classId FROM users WHERE id = ?",
]

for q in queries:
    if 'class' in q and 'classId' not in q:
        idx = q.find('class')
        print(f"Query: {q[:60]}...")
        print(f"  'class' at position: {idx}")
        print()
