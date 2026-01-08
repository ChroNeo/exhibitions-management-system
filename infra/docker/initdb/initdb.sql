-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: Jan 06, 2026 at 09:20 AM
-- Server version: 8.4.7
-- PHP Version: 8.3.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `exhibition_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `app_settings`
--

CREATE TABLE `app_settings` (
  `key_name` varchar(100) NOT NULL,
  `value_json` json NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `app_settings`
--

INSERT INTO `app_settings` (`key_name`, `value_json`) VALUES
('home_hero', '{\"mode\": \"both\", \"sort\": \"ongoing_then_soon\", \"limit\": 6, \"include_status\": \"published,ongoing\"}');

-- --------------------------------------------------------

--
-- Table structure for table `certificate_templates`
--

CREATE TABLE `certificate_templates` (
  `template_id` int NOT NULL,
  `exhibition_id` int NOT NULL,
  `organizer_name` varchar(255) NOT NULL,
  `template_name` varchar(255) NOT NULL,
  `layout_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `certificate_templates`
--

INSERT INTO `certificate_templates` (`template_id`, `exhibition_id`, `organizer_name`, `template_name`, `layout_url`, `created_at`, `updated_at`) VALUES
(1, 1, 'John Doe', 'Certificate of Attendance', 'https://cdn.example.com/certs/templates/attend.png', '2025-09-15 15:06:36', '2025-09-15 15:06:36');

-- --------------------------------------------------------

--
-- Table structure for table `exhibitions`
--

CREATE TABLE `exhibitions` (
  `exhibition_id` int NOT NULL,
  `exhibition_code` varchar(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` mediumtext,
  `description_delta` json DEFAULT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `organizer_name` varchar(255) NOT NULL,
  `picture_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `status` enum('draft','published','ongoing','ended','archived') DEFAULT 'draft',
  `created_by` int NOT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `archived_at` timestamp NULL DEFAULT NULL,
  `exhibition_set_id` int DEFAULT NULL,
  `unit_set_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `exhibitions`
--

INSERT INTO `exhibitions` (`exhibition_id`, `exhibition_code`, `title`, `description`, `description_delta`, `start_date`, `end_date`, `location`, `organizer_name`, `picture_path`, `status`, `created_by`, `updated_by`, `created_at`, `updated_at`, `archived_at`, `exhibition_set_id`, `unit_set_id`) VALUES
(1, 'EX202501', 'Smart Tech Expo 2025', NULL, '{\"ops\": [{\"insert\": \"\\n\"}]}', '2025-10-07 15:00:00', '2026-02-14 00:00:00', 'Bangkok Convention Center', 'John Doe', 'uploads/exhibitions/EXP1767418842692.jpg', 'ongoing', 1, NULL, '2025-09-15 15:06:36', '2026-01-03 05:44:55', NULL, NULL, NULL),
(3, 'EX202503', 'Green Future Week', 'งานสิ่งแวดล้อมและพลังงานสะอาด', NULL, '2025-10-05 02:00:00', '2025-10-09 11:00:00', 'Khon Kaen Hall', 'Mai Organizer', 'uploads/exhibitions/EXP1758869541507.png', 'ended', 1, NULL, '2025-09-15 15:06:36', '2025-10-24 18:54:55', NULL, NULL, NULL),
(5, 'EX202401', 'Modern Art Showcase 2011', 'A curated selection of contemporary pieces from emerging artists.', NULL, '2024-08-30 02:00:00', '2024-09-13 10:00:00', 'Gallery Hall A', 'City Arts Council', 'uploads/exhibitions/EXP1758868393393.png', 'ended', 42, NULL, '2025-09-25 13:07:39', '2025-10-24 18:59:55', NULL, NULL, NULL),
(8, 'EX202404', 'Modern Art Showcase 2024', 'A curated selection of contemporary pieces.', NULL, '2024-08-31 20:00:00', '2024-09-15 04:00:00', 'Gallery Hall A', 'City Arts Council', 'uploads/exhibitions/EXP1758868400309.png', 'draft', 42, NULL, '2025-09-25 13:35:02', '2025-09-26 06:33:20', NULL, NULL, NULL),
(12, 'EX202505', 're', 'test', NULL, '2025-09-25 09:05:00', '2025-09-26 09:05:00', 'test', 'test', 'uploads/exhibitions/EXP1758868407111.png', 'draft', 1, NULL, '2025-09-25 23:05:55', '2025-09-26 06:33:27', NULL, NULL, NULL),
(14, 'EX202506', 'ทดสอบการแก้ไข21', 'นิทรรศการ “Smart Tech Expo 2025” ถูกออกแบบมาให้เป็นพื้นที่แห่งการบรรจบกันของเทคโนโลยี นวัตกรรม และความคิดสร้างสรรค์จากทั่วโลก ผู้เข้าชมจะได้พบกับบูธสตาร์ตอัปด้าน AI ที่นำเสนอแอปพลิเคชันอัจฉริยะซึ่งสามารถเรียนรู้พฤติกรรมผู้ใช้และปรับตัวได้ทันที นิทรรศการหุ่นยนต์ที่ผสานความสามารถด้านวิศวกรรมกับศิลปะการเคลื่อนไหวราวกับมีชีวิตจริง โซน IoT ที่จำลองบ้านอัจฉริยะทั้งหลังให้ผู้ชมได้สัมผัสประสบการณ์ “อนาคตของการอยู่อาศัย” และเวิร์กช็อปด้าน Cybersecurity ที่จะพาคุณลงลึกถึงการป้องกันภัยในโลกดิจิทัล', NULL, '2025-09-20 10:35:00', '2025-09-21 15:35:00', NULL, 'test', 'uploads/exhibitions/EXP1758868430956.png', 'draft', 1, NULL, '2025-09-25 23:35:24', '2025-10-09 09:25:46', NULL, NULL, NULL),
(15, 'EX202507', 'test', 'test', NULL, '2025-10-31 04:57:00', '2025-11-08 04:57:00', 'test', 'test', 'uploads/exhibitions/EXP1759433238838.jpg', 'ended', 1, NULL, '2025-10-02 19:27:19', '2025-12-31 09:19:55', NULL, NULL, NULL),
(16, 'EX202508', 'test', '<p>this is the test <strong>wow this is the bold wow za 007 </strong></p>', NULL, '2025-10-21 04:57:00', '2025-10-21 04:57:00', 'test', 'asdf', NULL, 'ended', 1, NULL, '2025-10-24 18:57:43', '2025-10-24 20:49:32', NULL, NULL, NULL),
(17, 'EX202509', 'test', '<p>test</p>', '{\"ops\": [{\"insert\": \"test\\n\"}]}', '2025-10-28 19:51:00', '2028-05-30 19:51:00', 'test', 'test', 'uploads/exhibitions/EXP1767174707770.jpg', 'ongoing', 2, NULL, '2025-12-31 09:51:48', '2025-12-31 10:34:55', NULL, NULL, NULL),
(99, 'EX202601', 'AI Technology Expo 2026', NULL, NULL, '2026-01-01 00:00:00', '2026-01-10 00:00:00', NULL, 'test', NULL, 'ongoing', 1, NULL, '2026-01-06 08:39:03', '2026-01-06 08:39:03', NULL, 101, 102);

--
-- Triggers `exhibitions`
--
DELIMITER $$
CREATE TRIGGER `trg_exhibitions_before_insert` BEFORE INSERT ON `exhibitions` FOR EACH ROW BEGIN
  DECLARE y INT;
  DECLARE next_num INT;

  SET y = IFNULL(YEAR(NEW.start_date), YEAR(CURDATE()));

  IF NEW.exhibition_code IS NULL OR NEW.exhibition_code = '' THEN
    SELECT IFNULL(MAX(CAST(RIGHT(e.exhibition_code, 2) AS UNSIGNED)), 0) + 1
      INTO next_num
    FROM exhibitions e
    WHERE e.exhibition_code LIKE CONCAT('EX', y, '%');

    SET NEW.exhibition_code = CONCAT('EX', y, LPAD(next_num, 2, '0'));
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `normal_users`
--

CREATE TABLE `normal_users` (
  `user_id` int NOT NULL,
  `line_user_id` varchar(100) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `picture_url` varchar(500) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `last_synced_at` timestamp NULL DEFAULT NULL,
  `role` enum('user','staff') DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `normal_users`
--

INSERT INTO `normal_users` (`user_id`, `line_user_id`, `full_name`, `gender`, `birthdate`, `username`, `picture_url`, `email`, `phone`, `last_synced_at`, `role`) VALUES
(1, 'U1234567890', 'Alice Chan', 'female', '1998-05-12', 'alicec', NULL, 'alice@example.com', NULL, NULL, 'user'),
(2, 'U0987654321', 'Bob Lee', 'male', '1995-09-22', 'boblee', NULL, 'bob@example.com', NULL, NULL, 'user'),
(3, 'U1122334455', 'Charlie Kim', 'male', '1999-03-18', 'charliek', NULL, 'charlie@example.com', NULL, NULL, 'staff'),
(4, 'U5566778899', 'ดลยา มงคล', 'female', '2000-01-15', 'donlaya', NULL, 'donlaya@example.com', NULL, NULL, 'staff'),
(5, 'U6677889900', 'ปรีชา ใจดี', 'male', '1997-07-07', 'preecha', NULL, 'preecha@example.com', NULL, NULL, 'user'),
(6, 'U1010101010', 'Som Tana', 'male', '1996-02-20', 'somt', NULL, 'somt@example.com', NULL, NULL, 'user'),
(7, 'U2020202020', 'Mina Phan', 'female', '2001-11-11', 'minaph', NULL, 'mina@example.com', NULL, NULL, 'user'),
(8, 'U3030303030', 'Ken Wong', 'male', '1994-04-04', 'kenw', NULL, 'ken@example.com', NULL, NULL, 'user'),
(9, 'U4040404040', 'ศศิธร สายชล', 'female', '1998-08-21', 'sasithorn', NULL, 'sasi@example.com', NULL, NULL, 'user'),
(10, 'U5050505050', 'Napat J.', 'male', '1997-12-05', 'napatj', NULL, 'napat@example.com', NULL, NULL, 'user'),
(11, 'U6060606060', 'Ploy Nun', 'female', '1999-06-30', 'ploynun', NULL, 'ploy@example.com', NULL, NULL, 'user'),
(12, 'U7070707070', 'Arthit K.', 'male', '1995-03-03', 'arthitk', NULL, 'arthit@example.com', NULL, NULL, 'user'),
(13, NULL, 'สมชาย ใจดี', 'male', '1999-05-21', NULL, NULL, 'visitor@example.com', '0812345678', NULL, 'user'),
(14, NULL, 'สุกัญญา ใจดี', 'female', '1995-03-10', NULL, NULL, 'staff@example.com', '0897654321', NULL, 'staff'),
(15, 'Ue9761b5cc006f2b8c7d0897e8b272c61', '279 ยงศักดิ์ (Neo)', 'male', '2026-01-01', '279neo', 'https://sprofile.line-scdn.net/0h3enF8LH7bEpDP3IYHEISdDNvbyBgTjVYbVlxJXQ3Z3kpWi1Oa1BwfyU6Oyp9BytPOFwgLiQ7MHJhWWhyZhknLw12VxMGVFF5DiJfeQ1iLn4mS3NZCyA_KQFbeRIgbFVXJAlUcSNLdz8rZF9-CAcjRxhfaH58T1JbEWgAHEYNAsksPRsfblgqKX44M3L2', 'egency999@gmail.com', '0952909471', '2026-01-05 09:09:58', 'user'),
(16, 'Ub4cf78728db86411aad7edcc1da9d55b', '65200123 ณัฐวัฒน์', 'male', '2004-06-08', '65200123', 'https://sprofile.line-scdn.net/0heL-djeviOmMAHS0TR35EHHBNOQkjbGNxL3wnBmFNN1E7JXs2L31xUWIdZ1Q1JXUxJClwUTAfZ1EMDk0FHkvGVwctZ1I8JHg9K3p9jQ', 'nattawat.fing@gmail.com', '0941493541', '2026-01-05 09:44:22', 'staff'),
(17, NULL, 'ณัฐวัฒน์', 'male', '2026-01-05', NULL, NULL, 'nah@gmail.com', '57818881', NULL, 'user');

-- --------------------------------------------------------

--
-- Table structure for table `organizer_users`
--

CREATE TABLE `organizer_users` (
  `user_id` int NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `last_synced_at` timestamp NULL DEFAULT NULL,
  `role` enum('admin','organizer') DEFAULT 'organizer',
  `last_login_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `organizer_users`
--

INSERT INTO `organizer_users` (`user_id`, `username`, `password_hash`, `email`, `last_synced_at`, `role`, `last_login_at`) VALUES
(1, 'admin01', '$2a$12$G6hlqoz6yKviU4Oult3lgOSkiw0aP7urh3gKW9dCF6XP5QS6EiFNy', 'admin01@example.com', NULL, 'admin', NULL),
(2, 'org_john', '9f735e0df9a1ddc702bf0a1a7b83033f9f7153a00c29de82cedadc9957289b05', 'john@expo.com', NULL, 'organizer', NULL),
(3, 'org_somchai', 'hashedpass3', 'somchai@expo.com', NULL, 'organizer', NULL),
(4, 'org_mai', 'hashedpass4', 'mai@expo.com', NULL, 'organizer', NULL),
(5, 'organizer_new', 'a615a46a9f52e117dffce7d7235b464a910f74508dfb51a27ce8c63d0413d9a0', 'organizer_new@example.com', NULL, 'organizer', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE `questions` (
  `question_id` int NOT NULL,
  `set_id` int NOT NULL,
  `topic` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `questions`
--

INSERT INTO `questions` (`question_id`, `set_id`, `topic`) VALUES
(1, 1, 'ความสะอาดและความปลอดภัย'),
(2, 1, 'การประชาสัมพันธ์ข้อมูล'),
(3, 2, 'ความรู้ที่ได้รับจากบูธ'),
(4, 2, 'การให้บริการของเจ้าหน้าที่'),
(501, 101, 'ความสะอาดและความปลอดภัย'),
(502, 101, 'การประชาสัมพันธ์ข้อมูล'),
(503, 101, 'ชอบวิทยากรหลักหรือไม่?'),
(601, 102, 'ความรู้ที่ได้รับจากบูธ'),
(602, 102, 'การให้บริการของเจ้าหน้าที่');

-- --------------------------------------------------------

--
-- Table structure for table `question_sets`
--

CREATE TABLE `question_sets` (
  `set_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `is_master` tinyint(1) DEFAULT '0' COMMENT '1=แม่แบบกลาง, 0=ของงานเฉพาะ',
  `type` enum('EXHIBITION','UNIT') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `question_sets`
--

INSERT INTO `question_sets` (`set_id`, `name`, `is_master`, `type`) VALUES
(1, 'Master Exhibition Standard', 1, 'EXHIBITION'),
(2, 'Master Unit Standard', 1, 'UNIT'),
(101, 'Set for AI Expo (Exhibition)', 0, 'EXHIBITION'),
(102, 'Set for AI Expo (Unit)', 0, 'UNIT');

-- --------------------------------------------------------

--
-- Table structure for table `registrations`
--

CREATE TABLE `registrations` (
  `registration_id` int NOT NULL,
  `exhibition_id` int NOT NULL,
  `user_id` int NOT NULL,
  `registered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `registrations`
--

INSERT INTO `registrations` (`registration_id`, `exhibition_id`, `user_id`, `registered_at`) VALUES
(1, 1, 1, '2025-10-20 14:30:00'),
(2, 1, 2, '2025-10-22 16:00:00'),
(3, 1, 13, '2025-10-20 10:04:26'),
(4, 1, 14, '2025-10-20 10:20:43'),
(5, 17, 15, '2026-01-03 04:31:56'),
(6, 1, 15, '2026-01-03 06:05:57'),
(7, 1, 16, '2026-01-05 08:39:52'),
(10, 1, 17, '2026-01-05 09:45:33');

-- --------------------------------------------------------

--
-- Table structure for table `survey_answers`
--

CREATE TABLE `survey_answers` (
  `answer_id` int NOT NULL,
  `submission_id` int NOT NULL,
  `question_id` int NOT NULL,
  `score` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `survey_answers`
--

INSERT INTO `survey_answers` (`answer_id`, `submission_id`, `question_id`, `score`) VALUES
(1, 1001, 501, 5),
(2, 1001, 502, 4),
(3, 1001, 503, 5),
(4, 1002, 601, 4),
(5, 1002, 602, 2);

-- --------------------------------------------------------

--
-- Table structure for table `survey_submissions`
--

CREATE TABLE `survey_submissions` (
  `submission_id` int NOT NULL,
  `exhibition_id` int NOT NULL,
  `unit_id` int DEFAULT NULL COMMENT 'ถ้า NULL แสดงว่าประเมินงาน, ถ้ามีค่าแสดงว่าประเมินบูธ',
  `user_id` int NOT NULL,
  `comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `survey_submissions`
--

INSERT INTO `survey_submissions` (`submission_id`, `exhibition_id`, `unit_id`, `user_id`, `comment`, `created_at`) VALUES
(1001, 99, NULL, 5, 'งานจัดดีมากครับ แอร์เย็น', '2026-01-06 08:41:26'),
(1002, 99, 5, 5, 'พี่สต๊าฟอธิบายงงๆ นิดนึง', '2026-01-06 08:41:46');

-- --------------------------------------------------------

--
-- Table structure for table `units`
--

CREATE TABLE `units` (
  `unit_id` int NOT NULL,
  `unit_code` varchar(30) DEFAULT NULL,
  `exhibition_id` int NOT NULL,
  `unit_name` varchar(255) NOT NULL,
  `description` mediumtext,
  `description_delta` json DEFAULT NULL,
  `unit_type` enum('activity','booth') NOT NULL DEFAULT 'booth',
  `poster_url` varchar(500) DEFAULT NULL,
  `detail_pdf_url` varchar(500) DEFAULT NULL,
  `starts_at` datetime DEFAULT NULL,
  `ends_at` datetime DEFAULT NULL,
  `additional_question_set_id` int DEFAULT NULL COMMENT 'Optional: Additional questions specific to this unit (staff-created)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `units`
--

INSERT INTO `units` (`unit_id`, `unit_code`, `exhibition_id`, `unit_name`, `description`, `description_delta`, `unit_type`, `poster_url`, `detail_pdf_url`, `starts_at`, `ends_at`, `additional_question_set_id`) VALUES
(1, 'EX20250101', 1, 'Robotics Lab Demo2', '<p><strong>s dlrow eht</strong></p>', '{\"ops\": [{\"insert\": \"s dlrow eht\", \"attributes\": {\"bold\": true}}, {\"insert\": \"\\n\"}]}', 'booth', 'uploads/units/EXP1759848361494.jpg', NULL, '2024-04-30 06:00:00', '2024-04-30 14:00:00', NULL),
(2, 'EX20250102', 1, 'Robot Show', 'โชว์บนเวทีใหญ่', NULL, 'activity', 'uploads/units/EXP1759849066017.webp', NULL, '2025-11-02 07:00:00', '2025-11-02 08:00:00', NULL),
(3, 'EX20250103', 1, 'IoT Corner', 'ของเล่น IoT', NULL, 'booth', 'uploads/units/EXP1759849287066.png', NULL, '2025-11-01 03:00:00', '2025-11-05 10:00:00', NULL),
(4, 'EX20250104', 1, 'Cloud 101 Talk', 'แนะนำพื้นฐานคลาวด์', NULL, 'activity', NULL, NULL, '2025-11-03 11:00:00', '2025-11-03 12:00:00', NULL),
(5, 'EX20260101', 99, 'Robot AI Booth', NULL, NULL, 'booth', NULL, NULL, NULL, NULL, NULL),
(6, 'EX20260102', 99, 'Smart Farm Booth', NULL, NULL, 'booth', NULL, NULL, NULL, NULL, NULL),
(7, 'EX20250107', 1, 'Startup Pitch', 'พิตช์บนเวที', NULL, 'activity', NULL, NULL, '2025-11-05 10:00:00', '2025-11-05 12:00:00', NULL),
(8, 'EX20250108', 1, 'Hardware Lab', 'ทดลองบอร์ด ESP32', NULL, 'booth', NULL, NULL, '2025-11-02 09:00:00', '2025-11-05 18:00:00', NULL),
(12, 'EX20250109', 1, 'Robotics Lab Demo', '<p>Hands-on robotics challenge this is the bold<strong> what happpend so that is it lkjklkj</strong></p>', '{\"ops\": [{\"insert\": \"Hands-on robotics challenge this is the bold\"}, {\"insert\": \" what happpend so that is it lkjklkj\", \"attributes\": {\"bold\": true}}, {\"insert\": \"\\n\"}]}', 'booth', 'uploads/units/EXP1760008335192.png', NULL, '2024-04-30 06:00:00', '2024-04-30 14:00:00', NULL),
(15, 'EX20250110', 1, 'dfdfkdj', '<ol><li><strong>รายละเอียดรายละเอียดรายละเอียดรายละเอียดรายละเอียด zxcvzxcvx</strong></li></ol>', '{\"ops\": [{\"insert\": \"รายละเอียดรายละเอียดรายละเอียดรายละเอียดรายละเอียด zxcvzxcvx\", \"attributes\": {\"bold\": true}}, {\"insert\": \"\\n\", \"attributes\": {\"list\": \"ordered\"}}]}', 'booth', 'uploads/units/EXP1760260365114.png', NULL, '2025-10-11 06:12:00', '2025-10-12 07:14:00', NULL),
(16, 'EX20250701', 15, 'units test', '<p><strong><em>test</em></strong></p>', '{\"ops\": [{\"insert\": \"test\", \"attributes\": {\"bold\": true, \"italic\": true}}, {\"insert\": \"\\n\"}]}', 'booth', 'uploads/units/EXP1761072122823.png', NULL, '2025-10-21 04:41:00', '2025-10-22 04:41:00', NULL),
(17, 'EX20250301', 3, 'ทดสอบเพิ่มกิจกรรม', 'resrasl;dfka;sdlfkasdf', NULL, 'activity', 'uploads/units/EXP1761072295328.png', NULL, '2025-10-19 22:44:00', '2025-10-22 22:44:00', NULL),
(18, 'EX20250302', 3, 'test', 'test', NULL, 'activity', 'uploads/units/EXP1761072379903.png', NULL, '2025-10-20 18:46:00', '2025-10-29 18:46:00', NULL),
(19, 'EX20250901', 17, 'test', '<p>test</p>', '{\"ops\": [{\"insert\": \"test\\n\"}]}', 'activity', 'uploads/units/EXP1767176856956.png', NULL, '2025-12-11 20:00:00', '2025-12-31 20:00:00', NULL),
(20, 'EX20250902', 17, 'tes2', '<p>testa</p>', '{\"ops\": [{\"insert\": \"testa\\n\"}]}', 'booth', 'uploads/units/EXP1767418200023.png', NULL, '2025-12-30 05:29:00', '2026-01-22 05:29:00', NULL);

--
-- Triggers `units`
--
DELIMITER $$
CREATE TRIGGER `trg_units_before_insert` BEFORE INSERT ON `units` FOR EACH ROW BEGIN
  DECLARE next_num INT;

  IF NEW.exhibition_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'exhibition_id is required';
  END IF;

  IF NEW.unit_code IS NULL OR NEW.unit_code = '' THEN
    SELECT IFNULL(MAX(CAST(RIGHT(u.unit_code, 2) AS UNSIGNED)), 0) + 1
      INTO next_num
    FROM units u
    WHERE u.exhibition_id = NEW.exhibition_id;

    SET NEW.unit_code = (
      SELECT CONCAT(e.exhibition_code, LPAD(next_num, 2, '0'))
      FROM exhibitions e
      WHERE e.exhibition_id = NEW.exhibition_id
    );
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `units_checkins`
--

CREATE TABLE `units_checkins` (
  `checkin_id` int NOT NULL,
  `exhibition_id` int NOT NULL,
  `user_id` int NOT NULL,
  `unit_id` int NOT NULL,
  `checkin_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `units_checkins`
--

INSERT INTO `units_checkins` (`checkin_id`, `exhibition_id`, `user_id`, `unit_id`, `checkin_at`) VALUES
(1, 17, 15, 19, '2025-11-01 10:05:00'),
(3, 1, 15, 1, '2026-01-05 09:02:20');

-- --------------------------------------------------------

--
-- Table structure for table `unit_staffs`
--

CREATE TABLE `unit_staffs` (
  `unit_id` int NOT NULL,
  `staff_user_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `unit_staffs`
--

INSERT INTO `unit_staffs` (`unit_id`, `staff_user_id`) VALUES
(19, 3),
(20, 4),
(3, 5),
(3, 14),
(1, 16);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_certificate_templates`
-- (See below for the actual view)
--
CREATE TABLE `v_certificate_templates` (
`template_id` int
,`exhibition_code` varchar(20)
,`exhibition_title` varchar(255)
,`organizer_name` varchar(255)
,`template_name` varchar(255)
,`layout_url` varchar(500)
,`created_at` timestamp
,`updated_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_exhibitions`
-- (See below for the actual view)
--
CREATE TABLE `v_exhibitions` (
`exhibition_id` int
,`exhibition_code` varchar(20)
,`title` varchar(255)
,`description` mediumtext
,`start_date` datetime
,`end_date` datetime
,`location` varchar(255)
,`organizer_name` varchar(255)
,`picture_path` varchar(500)
,`status` enum('draft','published','ongoing','ended','archived')
,`created_at` timestamp
,`updated_at` timestamp
,`archived_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_exhibition_feedback`
-- (See below for the actual view)
--
CREATE TABLE `v_exhibition_feedback` (
`submission_id` int
,`exhibition_id` int
,`exhibition_name` varchar(255)
,`user_id` int
,`user_name` varchar(255)
,`question_topic` varchar(255)
,`score` int
,`comment` text
,`created_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_exhibition_with_registrations`
-- (See below for the actual view)
--
CREATE TABLE `v_exhibition_with_registrations` (
`exhibition_id` int
,`exhibition_code` varchar(20)
,`title` varchar(255)
,`total_registrations` bigint
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_registrations`
-- (See below for the actual view)
--
CREATE TABLE `v_registrations` (
`registration_id` int
,`exhibition_code` varchar(20)
,`exhibition_title` varchar(255)
,`user_name` varchar(255)
,`registered_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_stats_score_by_question`
-- (See below for the actual view)
--
CREATE TABLE `v_stats_score_by_question` (
`exhibition_name` varchar(255)
,`target_name` varchar(255)
,`topic` varchar(255)
,`total_voters` bigint
,`average_score` decimal(13,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_units_by_exhibition`
-- (See below for the actual view)
--
CREATE TABLE `v_units_by_exhibition` (
`unit_id` int
,`unit_code` varchar(30)
,`unit_name` varchar(255)
,`unit_type` enum('activity','booth')
,`poster_url` varchar(500)
,`starts_at` datetime
,`ends_at` datetime
,`exhibition_id` int
,`exhibition_code` varchar(20)
,`exhibition_title` varchar(255)
,`staff_names` text
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_units_checkins`
-- (See below for the actual view)
--
CREATE TABLE `v_units_checkins` (
`checkin_id` int
,`exhibition_code` varchar(20)
,`exhibition_title` varchar(255)
,`user_name` varchar(255)
,`unit_code` varchar(30)
,`unit_name` varchar(255)
,`checkin_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_unit_feedback`
-- (See below for the actual view)
--
CREATE TABLE `v_unit_feedback` (
`submission_id` int
,`exhibition_id` int
,`exhibition_name` varchar(255)
,`unit_id` int
,`unit_name` varchar(255)
,`user_id` int
,`user_name` varchar(255)
,`question_topic` varchar(255)
,`score` int
,`comment` text
,`created_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_user_exhibition_checkin_status`
-- (See below for the actual view)
--
CREATE TABLE `v_user_exhibition_checkin_status` (
`exhibition_id` int
,`exhibition_code` varchar(20)
,`exhibition_title` varchar(255)
,`unit_id` int
,`unit_code` varchar(30)
,`unit_name` varchar(255)
,`unit_type` enum('activity','booth')
,`user_id` int
,`is_checked_in` int
);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `app_settings`
--
ALTER TABLE `app_settings`
  ADD PRIMARY KEY (`key_name`);

--
-- Indexes for table `certificate_templates`
--
ALTER TABLE `certificate_templates`
  ADD PRIMARY KEY (`template_id`),
  ADD KEY `idx_ct_exhibition` (`exhibition_id`);

--
-- Indexes for table `exhibitions`
--
ALTER TABLE `exhibitions`
  ADD PRIMARY KEY (`exhibition_id`),
  ADD UNIQUE KEY `uq_exhibition_code` (`exhibition_code`),
  ADD KEY `fk_exh_exhibition_set` (`exhibition_set_id`),
  ADD KEY `fk_exh_unit_set` (`unit_set_id`);

--
-- Indexes for table `normal_users`
--
ALTER TABLE `normal_users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `uq_line_user_id` (`line_user_id`),
  ADD UNIQUE KEY `uq_username` (`username`),
  ADD UNIQUE KEY `uq_email` (`email`);

--
-- Indexes for table `organizer_users`
--
ALTER TABLE `organizer_users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `uq_org_username` (`username`),
  ADD UNIQUE KEY `uq_org_email` (`email`);

--
-- Indexes for table `questions`
--
ALTER TABLE `questions`
  ADD PRIMARY KEY (`question_id`),
  ADD KEY `fk_questions_set` (`set_id`);

--
-- Indexes for table `question_sets`
--
ALTER TABLE `question_sets`
  ADD PRIMARY KEY (`set_id`);

--
-- Indexes for table `registrations`
--
ALTER TABLE `registrations`
  ADD PRIMARY KEY (`registration_id`),
  ADD UNIQUE KEY `uq_registration` (`exhibition_id`,`user_id`),
  ADD KEY `fk_reg_user` (`user_id`);

--
-- Indexes for table `survey_answers`
--
ALTER TABLE `survey_answers`
  ADD PRIMARY KEY (`answer_id`),
  ADD KEY `fk_ans_sub` (`submission_id`),
  ADD KEY `fk_ans_quest` (`question_id`);

--
-- Indexes for table `survey_submissions`
--
ALTER TABLE `survey_submissions`
  ADD PRIMARY KEY (`submission_id`),
  ADD KEY `fk_sub_exh` (`exhibition_id`),
  ADD KEY `fk_sub_unit` (`unit_id`),
  ADD KEY `fk_sub_user` (`user_id`);

--
-- Indexes for table `units`
--
ALTER TABLE `units`
  ADD PRIMARY KEY (`unit_id`),
  ADD UNIQUE KEY `uq_units_exh_name` (`exhibition_id`,`unit_name`),
  ADD UNIQUE KEY `uq_unit_code` (`unit_code`),
  ADD KEY `idx_unit_additional_questions` (`additional_question_set_id`);

--
-- Indexes for table `units_checkins`
--
ALTER TABLE `units_checkins`
  ADD PRIMARY KEY (`checkin_id`),
  ADD UNIQUE KEY `uq_checkin` (`exhibition_id`,`user_id`,`unit_id`),
  ADD KEY `idx_uc_exhibition` (`exhibition_id`),
  ADD KEY `idx_uc_user` (`user_id`),
  ADD KEY `idx_uc_unit` (`unit_id`);

--
-- Indexes for table `unit_staffs`
--
ALTER TABLE `unit_staffs`
  ADD PRIMARY KEY (`unit_id`,`staff_user_id`),
  ADD KEY `staff_user_id` (`staff_user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `certificate_templates`
--
ALTER TABLE `certificate_templates`
  MODIFY `template_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `exhibitions`
--
ALTER TABLE `exhibitions`
  MODIFY `exhibition_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT for table `normal_users`
--
ALTER TABLE `normal_users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `organizer_users`
--
ALTER TABLE `organizer_users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
  MODIFY `question_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=603;

--
-- AUTO_INCREMENT for table `question_sets`
--
ALTER TABLE `question_sets`
  MODIFY `set_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=103;

--
-- AUTO_INCREMENT for table `registrations`
--
ALTER TABLE `registrations`
  MODIFY `registration_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `survey_answers`
--
ALTER TABLE `survey_answers`
  MODIFY `answer_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `survey_submissions`
--
ALTER TABLE `survey_submissions`
  MODIFY `submission_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1003;

--
-- AUTO_INCREMENT for table `units`
--
ALTER TABLE `units`
  MODIFY `unit_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `units_checkins`
--
ALTER TABLE `units_checkins`
  MODIFY `checkin_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

-- --------------------------------------------------------

--
-- Structure for view `v_certificate_templates`
--
DROP TABLE IF EXISTS `v_certificate_templates`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_certificate_templates`  AS SELECT `ct`.`template_id` AS `template_id`, `e`.`exhibition_code` AS `exhibition_code`, `e`.`title` AS `exhibition_title`, `ct`.`organizer_name` AS `organizer_name`, `ct`.`template_name` AS `template_name`, `ct`.`layout_url` AS `layout_url`, `ct`.`created_at` AS `created_at`, `ct`.`updated_at` AS `updated_at` FROM (`certificate_templates` `ct` join `exhibitions` `e` on((`ct`.`exhibition_id` = `e`.`exhibition_id`))) ;

-- --------------------------------------------------------

--
-- Structure for view `v_exhibitions`
--
DROP TABLE IF EXISTS `v_exhibitions`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_exhibitions`  AS SELECT `e`.`exhibition_id` AS `exhibition_id`, `e`.`exhibition_code` AS `exhibition_code`, `e`.`title` AS `title`, `e`.`description` AS `description`, `e`.`start_date` AS `start_date`, `e`.`end_date` AS `end_date`, `e`.`location` AS `location`, `e`.`organizer_name` AS `organizer_name`, `e`.`picture_path` AS `picture_path`, `e`.`status` AS `status`, `e`.`created_at` AS `created_at`, `e`.`updated_at` AS `updated_at`, `e`.`archived_at` AS `archived_at` FROM `exhibitions` AS `e` ;

-- --------------------------------------------------------

--
-- Structure for view `v_exhibition_feedback`
--
DROP TABLE IF EXISTS `v_exhibition_feedback`;

CREATE ALGORITHM=UNDEFINED DEFINER=`appuser`@`%` SQL SECURITY DEFINER VIEW `v_exhibition_feedback`  AS SELECT `s`.`submission_id` AS `submission_id`, `e`.`exhibition_id` AS `exhibition_id`, `e`.`title` AS `exhibition_name`, `u`.`user_id` AS `user_id`, `u`.`full_name` AS `user_name`, `q`.`topic` AS `question_topic`, `a`.`score` AS `score`, `s`.`comment` AS `comment`, `s`.`created_at` AS `created_at` FROM ((((`survey_submissions` `s` join `exhibitions` `e` on((`s`.`exhibition_id` = `e`.`exhibition_id`))) join `normal_users` `u` on((`s`.`user_id` = `u`.`user_id`))) join `survey_answers` `a` on((`s`.`submission_id` = `a`.`submission_id`))) join `questions` `q` on((`a`.`question_id` = `q`.`question_id`))) WHERE (`s`.`unit_id` is null) ;

-- --------------------------------------------------------

--
-- Structure for view `v_exhibition_with_registrations`
--
DROP TABLE IF EXISTS `v_exhibition_with_registrations`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_exhibition_with_registrations`  AS SELECT `e`.`exhibition_id` AS `exhibition_id`, `e`.`exhibition_code` AS `exhibition_code`, `e`.`title` AS `title`, count(`r`.`registration_id`) AS `total_registrations` FROM (`exhibitions` `e` left join `registrations` `r` on((`e`.`exhibition_id` = `r`.`exhibition_id`))) GROUP BY `e`.`exhibition_id`, `e`.`exhibition_code`, `e`.`title` ;

-- --------------------------------------------------------

--
-- Structure for view `v_registrations`
--
DROP TABLE IF EXISTS `v_registrations`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_registrations`  AS SELECT `r`.`registration_id` AS `registration_id`, `e`.`exhibition_code` AS `exhibition_code`, `e`.`title` AS `exhibition_title`, `u`.`full_name` AS `user_name`, `r`.`registered_at` AS `registered_at` FROM ((`registrations` `r` join `exhibitions` `e` on((`r`.`exhibition_id` = `e`.`exhibition_id`))) join `normal_users` `u` on((`r`.`user_id` = `u`.`user_id`))) ;

-- --------------------------------------------------------

--
-- Structure for view `v_stats_score_by_question`
--
DROP TABLE IF EXISTS `v_stats_score_by_question`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_stats_score_by_question`  AS SELECT `e`.`title` AS `exhibition_name`, coalesce(`un`.`unit_name`,'Event Overview') AS `target_name`, `q`.`topic` AS `topic`, count(distinct `s`.`submission_id`) AS `total_voters`, round(avg(`a`.`score`),2) AS `average_score` FROM ((((`survey_answers` `a` join `questions` `q` on((`a`.`question_id` = `q`.`question_id`))) join `survey_submissions` `s` on((`a`.`submission_id` = `s`.`submission_id`))) join `exhibitions` `e` on((`s`.`exhibition_id` = `e`.`exhibition_id`))) left join `units` `un` on((`s`.`unit_id` = `un`.`unit_id`))) GROUP BY `e`.`exhibition_id`, `un`.`unit_id`, `q`.`question_id` ;

-- --------------------------------------------------------

--
-- Structure for view `v_units_by_exhibition`
--
DROP TABLE IF EXISTS `v_units_by_exhibition`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_units_by_exhibition`  AS SELECT `u`.`unit_id` AS `unit_id`, `u`.`unit_code` AS `unit_code`, `u`.`unit_name` AS `unit_name`, `u`.`unit_type` AS `unit_type`, `u`.`poster_url` AS `poster_url`, `u`.`starts_at` AS `starts_at`, `u`.`ends_at` AS `ends_at`, `e`.`exhibition_id` AS `exhibition_id`, `e`.`exhibition_code` AS `exhibition_code`, `e`.`title` AS `exhibition_title`, coalesce(group_concat(`nu`.`full_name` separator ', '),'') AS `staff_names` FROM (((`units` `u` join `exhibitions` `e` on((`u`.`exhibition_id` = `e`.`exhibition_id`))) left join `unit_staffs` `us` on((`u`.`unit_id` = `us`.`unit_id`))) left join `normal_users` `nu` on((`us`.`staff_user_id` = `nu`.`user_id`))) GROUP BY `u`.`unit_id`, `e`.`exhibition_id`, `e`.`exhibition_code`, `e`.`title`, `u`.`unit_code`, `u`.`unit_name`, `u`.`unit_type`, `u`.`poster_url`, `u`.`starts_at`, `u`.`ends_at` ;

-- --------------------------------------------------------

--
-- Structure for view `v_units_checkins`
--
DROP TABLE IF EXISTS `v_units_checkins`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_units_checkins`  AS SELECT `uc`.`checkin_id` AS `checkin_id`, `e`.`exhibition_code` AS `exhibition_code`, `e`.`title` AS `exhibition_title`, `nu`.`full_name` AS `user_name`, `u`.`unit_code` AS `unit_code`, `u`.`unit_name` AS `unit_name`, `uc`.`checkin_at` AS `checkin_at` FROM (((`units_checkins` `uc` join `exhibitions` `e` on((`uc`.`exhibition_id` = `e`.`exhibition_id`))) join `normal_users` `nu` on((`uc`.`user_id` = `nu`.`user_id`))) join `units` `u` on((`uc`.`unit_id` = `u`.`unit_id`))) ;

-- --------------------------------------------------------

--
-- Structure for view `v_unit_feedback`
--
DROP TABLE IF EXISTS `v_unit_feedback`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_unit_feedback`  AS SELECT `s`.`submission_id` AS `submission_id`, `e`.`exhibition_id` AS `exhibition_id`, `e`.`title` AS `exhibition_name`, `un`.`unit_id` AS `unit_id`, `un`.`unit_name` AS `unit_name`, `u`.`user_id` AS `user_id`, `u`.`full_name` AS `user_name`, `q`.`topic` AS `question_topic`, `a`.`score` AS `score`, `s`.`comment` AS `comment`, `s`.`created_at` AS `created_at` FROM (((((`survey_submissions` `s` join `exhibitions` `e` on((`s`.`exhibition_id` = `e`.`exhibition_id`))) join `units` `un` on((`s`.`unit_id` = `un`.`unit_id`))) join `normal_users` `u` on((`s`.`user_id` = `u`.`user_id`))) join `survey_answers` `a` on((`s`.`submission_id` = `a`.`submission_id`))) join `questions` `q` on((`a`.`question_id` = `q`.`question_id`))) WHERE (`s`.`unit_id` is not null) ;

-- --------------------------------------------------------

--
-- Structure for view `v_user_exhibition_checkin_status`
--
DROP TABLE IF EXISTS `v_user_exhibition_checkin_status`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_user_exhibition_checkin_status`  AS SELECT DISTINCT `e`.`exhibition_id` AS `exhibition_id`, `e`.`exhibition_code` AS `exhibition_code`, `e`.`title` AS `exhibition_title`, `u`.`unit_id` AS `unit_id`, `u`.`unit_code` AS `unit_code`, `u`.`unit_name` AS `unit_name`, `u`.`unit_type` AS `unit_type`, `r`.`user_id` AS `user_id`, (case when (`uc`.`checkin_id` is not null) then 1 else 0 end) AS `is_checked_in` FROM (((`registrations` `r` join `exhibitions` `e` on((`r`.`exhibition_id` = `e`.`exhibition_id`))) left join `units` `u` on((`e`.`exhibition_id` = `u`.`exhibition_id`))) left join `units_checkins` `uc` on(((`uc`.`unit_id` = `u`.`unit_id`) and (`uc`.`user_id` = `r`.`user_id`) and (`uc`.`exhibition_id` = `e`.`exhibition_id`)))) ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `certificate_templates`
--
ALTER TABLE `certificate_templates`
  ADD CONSTRAINT `fk_ct_exhibition` FOREIGN KEY (`exhibition_id`) REFERENCES `exhibitions` (`exhibition_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `exhibitions`
--
ALTER TABLE `exhibitions`
  ADD CONSTRAINT `fk_exh_unit_set` FOREIGN KEY (`unit_set_id`) REFERENCES `question_sets` (`set_id`),
  ADD CONSTRAINT `fk_exh_exhibition_set` FOREIGN KEY (`exhibition_set_id`) REFERENCES `question_sets` (`set_id`);

--
-- Constraints for table `questions`
--
ALTER TABLE `questions`
  ADD CONSTRAINT `fk_questions_set` FOREIGN KEY (`set_id`) REFERENCES `question_sets` (`set_id`) ON DELETE CASCADE;

--
-- Constraints for table `registrations`
--
ALTER TABLE `registrations`
  ADD CONSTRAINT `fk_reg_exhibition` FOREIGN KEY (`exhibition_id`) REFERENCES `exhibitions` (`exhibition_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reg_user` FOREIGN KEY (`user_id`) REFERENCES `normal_users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `survey_answers`
--
ALTER TABLE `survey_answers`
  ADD CONSTRAINT `fk_ans_quest` FOREIGN KEY (`question_id`) REFERENCES `questions` (`question_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ans_sub` FOREIGN KEY (`submission_id`) REFERENCES `survey_submissions` (`submission_id`) ON DELETE CASCADE;

--
-- Constraints for table `survey_submissions`
--
ALTER TABLE `survey_submissions`
  ADD CONSTRAINT `fk_sub_exh` FOREIGN KEY (`exhibition_id`) REFERENCES `exhibitions` (`exhibition_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sub_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`unit_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sub_user` FOREIGN KEY (`user_id`) REFERENCES `normal_users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `units`
--
ALTER TABLE `units`
  ADD CONSTRAINT `fk_units_exhibition` FOREIGN KEY (`exhibition_id`) REFERENCES `exhibitions` (`exhibition_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_unit_additional_questions` FOREIGN KEY (`additional_question_set_id`) REFERENCES `question_sets` (`set_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `units_checkins`
--
ALTER TABLE `units_checkins`
  ADD CONSTRAINT `fk_uc_exhibition` FOREIGN KEY (`exhibition_id`) REFERENCES `exhibitions` (`exhibition_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_uc_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`unit_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_uc_user` FOREIGN KEY (`user_id`) REFERENCES `normal_users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `unit_staffs`
--
ALTER TABLE `unit_staffs`
  ADD CONSTRAINT `unit_staffs_ibfk_1` FOREIGN KEY (`unit_id`) REFERENCES `units` (`unit_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `unit_staffs_ibfk_2` FOREIGN KEY (`staff_user_id`) REFERENCES `normal_users` (`user_id`) ON DELETE CASCADE;

DELIMITER $$
--
-- Events
--
CREATE DEFINER=`root`@`%` EVENT `ev_exhibitions_auto_status` ON SCHEDULE EVERY 5 MINUTE STARTS '2025-10-24 18:54:55' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
  -- set ongoing เมื่อกำลังจัดอยู่
  UPDATE exhibitions
  SET status = 'ongoing'
  WHERE status IN ('published','ongoing')
    AND CONVERT_TZ(NOW(), '+00:00', '+07:00') BETWEEN start_date AND end_date;

  -- set ended เมื่อจบแล้ว
  UPDATE exhibitions
  SET status = 'ended'
  WHERE status IN ('published','ongoing')
    AND CONVERT_TZ(NOW(), '+00:00', '+07:00') > end_date;
END$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
