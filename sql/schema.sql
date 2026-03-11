CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(80) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE voters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  department VARCHAR(120) NOT NULL,
  biometric_hash VARCHAR(128) NOT NULL
);

CREATE TABLE elections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  election_date DATE NOT NULL,
  club_name VARCHAR(120) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE candidates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  election_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  position VARCHAR(120) NOT NULL,
  photo_url VARCHAR(255),
  CONSTRAINT fk_candidate_election FOREIGN KEY (election_id) REFERENCES elections(id)
);

CREATE TABLE votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  election_id INT NOT NULL,
  voter_id INT NOT NULL,
  candidate_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vote_election FOREIGN KEY (election_id) REFERENCES elections(id),
  CONSTRAINT fk_vote_voter FOREIGN KEY (voter_id) REFERENCES voters(id),
  CONSTRAINT fk_vote_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id),
  CONSTRAINT uq_vote_once UNIQUE (election_id, voter_id)
);

CREATE TABLE token_blocklist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jti VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
