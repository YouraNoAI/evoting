-- phpMyAdmin SQL Dump
-- version 5.1.1deb5ubuntu1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 16, 2025 at 08:24 PM
-- Server version: 8.0.43-0ubuntu0.22.04.2
-- PHP Version: 8.1.2-1ubuntu2.22

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `evoting`
--

-- --------------------------------------------------------

--
-- Table structure for table `candidates`
--

CREATE TABLE `candidates` (
  `candidate_id` int NOT NULL,
  `nama` varchar(100) NOT NULL,
  `nim` varchar(20) DEFAULT NULL,
  `foto_url` text,
  `deskripsi` text,
  `voting_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` int NOT NULL,
  `user_nim` varchar(8) NOT NULL,
  `token` varchar(512) NOT NULL,
  `valid` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_nim`, `token`, `valid`, `created_at`) VALUES
(1, '33241006', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaW0iOiIzMzI0MTAwNiIsInJvbGUiOiJhZG1pbiIsInNpZCI6MSwiaWF0IjoxNzYwNTQ2MDc2LCJleHAiOjE3NjExNTA4NzZ9.Mpsw-RtDtLLQOyPGRkWKtk2WXYcJk77b9BZu0k4oKrk', 1, '2025-10-15 23:34:36'),
(2, '33241006', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaW0iOiIzMzI0MTAwNiIsInJvbGUiOiJhZG1pbiIsInNpZCI6MiwiaWF0IjoxNzYwNjA3NzM0LCJleHAiOjE3NjEyMTI1MzR9.DCJsmqlofN5jzg2I3Ex_ciRNoCWg1XHhg_8oi02u9Bk', 1, '2025-10-16 16:42:14'),
(3, '33241006', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaW0iOiIzMzI0MTAwNiIsInJvbGUiOiJhZG1pbiIsInNpZCI6MywiaWF0IjoxNzYwNjE0MDA2LCJleHAiOjE3NjEyMTg4MDZ9.HLWt7N4IBPMIykCCKQoTP6fkLmL2JFvwimfU9l32LpM', 1, '2025-10-16 18:26:46'),
(4, '33241006', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaW0iOiIzMzI0MTAwNiIsInJvbGUiOiJhZG1pbiIsInNpZCI6NCwiaWF0IjoxNzYwNjE0NDEwLCJleHAiOjE3NjEyMTkyMTB9.LAQfXtsxwbOVKfC42G9-2XKpW9-FpYt-ard5AoUBJ3g', 1, '2025-10-16 18:33:30'),
(5, '33241006', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaW0iOiIzMzI0MTAwNiIsInJvbGUiOiJhZG1pbiIsInNpZCI6NSwiaWF0IjoxNzYwNjE0NzQwLCJleHAiOjE3NjEyMTk1NDB9.Eo2iv8vDtYMIcC2WuDQ16hpeP3qMrrhjzZ0wwN5kLiA', 1, '2025-10-16 18:39:00'),
(6, '33241006', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaW0iOiIzMzI0MTAwNiIsInJvbGUiOiJhZG1pbiIsInNpZCI6NiwiaWF0IjoxNzYwNjE2MjA2LCJleHAiOjE3NjEyMjEwMDZ9.15HX7IPVBN0o9WIT3v2n60hc68sA-kl_f4XGMa88MPQ', 1, '2025-10-16 19:03:26'),
(7, '33241006', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaW0iOiIzMzI0MTAwNiIsInJvbGUiOiJhZG1pbiIsInNpZCI6NywiaWF0IjoxNzYwNjE2MjM3LCJleHAiOjE3NjEyMjEwMzd9.Sq89EVqGykZMfODzHjA32Mg7woSGHGzlg_C2sflb_8k', 1, '2025-10-16 19:03:57'),
(8, '33241006', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaW0iOiIzMzI0MTAwNiIsInJvbGUiOiJhZG1pbiIsInNpZCI6OCwiaWF0IjoxNzYwNjE2MjcwLCJleHAiOjE3NjEyMjEwNzB9.yiUV_87i6m0oMrJVldXT4XSCx5sVSLPljae-V1HKlzI', 1, '2025-10-16 19:04:30'),
(9, '33241006', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaW0iOiIzMzI0MTAwNiIsInJvbGUiOiJhZG1pbiIsInNpZCI6OSwiaWF0IjoxNzYwNjE2Njk3LCJleHAiOjE3NjEyMjE0OTd9.3W7Rrx-2KDzJaj7XmOXnWfVu63HIKfQZpRFZHN6CErY', 1, '2025-10-16 19:11:37'),
(10, '33241006', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaW0iOiIzMzI0MTAwNiIsInJvbGUiOiJhZG1pbiIsInNpZCI6MTAsImlhdCI6MTc2MDYxODEzNywiZXhwIjoxNzYxMjIyOTM3fQ.sVpIpcFhJFq2j1uYnVJN54XNAZguu5DLg4k8uHXnOkc', 1, '2025-10-16 19:35:37'),
(11, '33241006', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaW0iOiIzMzI0MTAwNiIsInJvbGUiOiJhZG1pbiIsInNpZCI6MTEsImlhdCI6MTc2MDYxODM5NiwiZXhwIjoxNzYxMjIzMTk2fQ.rav5BwBcY76uhGUCqN0t_Hppi8qxx7WPoLsS7sipEvM', 1, '2025-10-16 19:39:56'),
(12, '33241006', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaW0iOiIzMzI0MTAwNiIsInJvbGUiOiJhZG1pbiIsInNpZCI6MTIsImlhdCI6MTc2MDYxODQxOCwiZXhwIjoxNzYxMjIzMjE4fQ.52Q9WDSOSLU8uIoShcVoWz-Ak-nod_kOD2Ze_QD1E-k', 1, '2025-10-16 19:40:18'),
(13, '33241006', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaW0iOiIzMzI0MTAwNiIsInJvbGUiOiJhZG1pbiIsInNpZCI6MTMsImlhdCI6MTc2MDYxODQzNSwiZXhwIjoxNzYxMjIzMjM1fQ.HGSUMO4aJ_-cbeLCNzHznx2fBImRJKPl8k-scHmebTg', 1, '2025-10-16 19:40:35'),
(14, '33241006', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaW0iOiIzMzI0MTAwNiIsInJvbGUiOiJhZG1pbiIsInNpZCI6MTQsImlhdCI6MTc2MDYxOTUxNCwiZXhwIjoxNzYxMjI0MzE0fQ.qCRGgCZKrK3qHzrBH28ktU0gxRnStAGIpsuRQ65KpQs', 1, '2025-10-16 19:58:34'),
(15, '33241006', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaW0iOiIzMzI0MTAwNiIsInJvbGUiOiJhZG1pbiIsInNpZCI6MTUsImlhdCI6MTc2MDYxOTY0NiwiZXhwIjoxNzYxMjI0NDQ2fQ.KbESBiie8vh0Gq8uwu3OHjXwR8GZOPmY7k-lKpU-m9A', 1, '2025-10-16 20:00:46'),
(16, '33241006', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaW0iOiIzMzI0MTAwNiIsInJvbGUiOiJhZG1pbiIsInNpZCI6MTYsImlhdCI6MTc2MDYxOTc1MiwiZXhwIjoxNzYxMjI0NTUyfQ.0rY5EHeoTEKpZQZzSCT6QPRc1AUWx-gJZoJORZ5eaE4', 1, '2025-10-16 20:02:31'),
(17, '33241006', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaW0iOiIzMzI0MTAwNiIsInJvbGUiOiJhZG1pbiIsInNpZCI6MTcsImlhdCI6MTc2MDYxOTg2MiwiZXhwIjoxNzYxMjI0NjYyfQ.98COQAkpVltZOwSoh6l0iXuqR8jpiUapsEAQ91-s81w', 1, '2025-10-16 20:04:22'),
(18, '33241006', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaW0iOiIzMzI0MTAwNiIsInJvbGUiOiJhZG1pbiIsInNpZCI6MTgsImlhdCI6MTc2MDYyMDEzNSwiZXhwIjoxNzYxMjI0OTM1fQ.YkcHUYRBJrk-eo6Al1JDElcAb2iGbeR9ZcJdz6zRh0o', 1, '2025-10-16 20:08:55'),
(19, '33241006', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaW0iOiIzMzI0MTAwNiIsInJvbGUiOiJhZG1pbiIsInNpZCI6MTksImlhdCI6MTc2MDYyMDQ3OCwiZXhwIjoxNzYxMjI1Mjc4fQ.RjyxB54i9CvG2Ax3bJ2qu_EfdeA-SLsbSWLPHSpH8iw', 1, '2025-10-16 20:14:38'),
(20, '33241006', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaW0iOiIzMzI0MTAwNiIsInJvbGUiOiJhZG1pbiIsInNpZCI6MjAsImlhdCI6MTc2MDYyMDc0NSwiZXhwIjoxNzYxMjI1NTQ1fQ.BVJSJNgoXjX3JHexlqOVbpYLxgZM9vTBP4qu9nvOvko', 1, '2025-10-16 20:19:05'),
(21, '33241006', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaW0iOiIzMzI0MTAwNiIsInJvbGUiOiJhZG1pbiIsInNpZCI6MjEsImlhdCI6MTc2MDYyMDg5NiwiZXhwIjoxNzYxMjI1Njk2fQ.DjPm1dBjW_No9ipn-wOxyNDVH9abfTKc6jh_SJ4BxDw', 1, '2025-10-16 20:21:36');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `nim` varchar(8) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`nim`, `nama`, `password`, `role`, `created_at`) VALUES
('00000001', 'Super Admin', '$2b$10$abcdefghijklmnopqrstuv', 'admin', '2025-10-15 22:22:39'),
('33241006', 'Arya Danuwarta', 'Arya data 23', 'admin', '2025-10-15 23:11:18');

-- --------------------------------------------------------

--
-- Table structure for table `votes`
--

CREATE TABLE `votes` (
  `vote_id` int NOT NULL,
  `user_nim` varchar(8) NOT NULL,
  `candidate_id` int NOT NULL,
  `voting_id` int NOT NULL,
  `waktu` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `votings`
--

CREATE TABLE `votings` (
  `voting_id` int NOT NULL,
  `nama_voting` varchar(100) NOT NULL,
  `waktu_mulai` datetime NOT NULL,
  `waktu_selesai` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `votings`
--

INSERT INTO `votings` (`voting_id`, `nama_voting`, `waktu_mulai`, `waktu_selesai`) VALUES
(1, 'Test', '2025-10-16 20:09:00', '2025-10-17 20:09:00'),
(2, 'Test', '2025-10-16 20:09:00', '2025-10-17 20:09:00'),
(3, 'Test', '2025-10-16 20:09:00', '2025-10-17 20:09:00'),
(4, 'test', '2025-10-16 20:14:00', '2025-10-17 20:14:00'),
(5, 'test', '2025-10-16 20:14:00', '2025-10-17 20:14:00'),
(6, 'test', '2025-10-16 20:19:00', '2025-10-31 20:19:00'),
(7, 'test', '2025-10-16 20:19:00', '2025-10-31 20:19:00'),
(8, 'Test', '2025-10-16 20:21:00', '2025-10-25 20:21:00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `candidates`
--
ALTER TABLE `candidates`
  ADD PRIMARY KEY (`candidate_id`),
  ADD KEY `voting_id` (`voting_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_nim` (`user_nim`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`nim`);

--
-- Indexes for table `votes`
--
ALTER TABLE `votes`
  ADD PRIMARY KEY (`vote_id`),
  ADD UNIQUE KEY `unique_vote` (`user_nim`,`voting_id`),
  ADD KEY `candidate_id` (`candidate_id`),
  ADD KEY `voting_id` (`voting_id`);

--
-- Indexes for table `votings`
--
ALTER TABLE `votings`
  ADD PRIMARY KEY (`voting_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `candidates`
--
ALTER TABLE `candidates`
  MODIFY `candidate_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sessions`
--
ALTER TABLE `sessions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `votes`
--
ALTER TABLE `votes`
  MODIFY `vote_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `votings`
--
ALTER TABLE `votings`
  MODIFY `voting_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `candidates`
--
ALTER TABLE `candidates`
  ADD CONSTRAINT `candidates_ibfk_1` FOREIGN KEY (`voting_id`) REFERENCES `votings` (`voting_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_nim`) REFERENCES `users` (`nim`) ON DELETE CASCADE;

--
-- Constraints for table `votes`
--
ALTER TABLE `votes`
  ADD CONSTRAINT `votes_ibfk_1` FOREIGN KEY (`user_nim`) REFERENCES `users` (`nim`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `votes_ibfk_2` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`candidate_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `votes_ibfk_3` FOREIGN KEY (`voting_id`) REFERENCES `votings` (`voting_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
