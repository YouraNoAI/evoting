CREATE DATABASE evoting;
USE evoting;

-- 1. Tabel Users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nim VARCHAR(8) NOT NULL UNIQUE,
  nama VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user','admin') DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE votings (
  voting_id INT AUTO_INCREMENT PRIMARY KEY,
  nama_voting VARCHAR(100) NOT NULL,
  waktu_mulai DATETIME NOT NULL,
  waktu_selesai DATETIME NOT NULL
);

-- 3. Tabel Candidates
CREATE TABLE candidates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  nim VARCHAR(20),
  foto_url TEXT,
  deskripsi TEXT,
  voting_id INT,
  FOREIGN KEY (voting_id) REFERENCES votings(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- 4. Tabel Votes
CREATE TABLE votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  candidate_id INT NOT NULL,
  voting_id INT NOT NULL,
  waktu DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_vote (user_id, voting_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  FOREIGN KEY (voting_id) REFERENCES votings(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
