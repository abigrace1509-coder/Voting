INSERT INTO admins (username, password_hash)
VALUES ('admin', '$scrypt$N=32768,r=8,p=1$8F0O80XZI8uDxTG6$ca645612ff4788f5926d6f680c67f4b2d552d9d8f510214f6ceab8927cb28ca95d35604f7ccf763d2139a0f0f8e3f23b6db85f12d4818e7625e95f26b5c5ea4f');

INSERT INTO voters (student_id, name, department, biometric_hash)
VALUES ('STU001', 'Aarav Sharma', 'Computer Science', SHA2(CONCAT('sample-image-data','demo-pepper'), 256));

INSERT INTO elections (name, election_date, club_name, is_active, is_published)
VALUES ('Student Coding Club Election', CURDATE(), 'Coding Club', TRUE, FALSE);

INSERT INTO candidates (election_id, name, position, photo_url)
VALUES
(1, 'Riya Patel', 'President', 'https://picsum.photos/seed/riya/200'),
(1, 'Karan Mehta', 'President', 'https://picsum.photos/seed/karan/200');
