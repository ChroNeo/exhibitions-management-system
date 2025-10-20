-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: Oct 20, 2025 at 10:52 AM
-- Server version: 8.4.6
-- PHP Version: 8.2.29

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
  `description` text,
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
  `archived_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `exhibitions`
--

INSERT INTO `exhibitions` (`exhibition_id`, `exhibition_code`, `title`, `description`, `start_date`, `end_date`, `location`, `organizer_name`, `picture_path`, `status`, `created_by`, `updated_by`, `created_at`, `updated_at`, `archived_at`) VALUES
(1, 'EX202501', 'Smart Tech Expo 2025', 'งานแสดงเทคโนโลยีและนวัตกรรม', '2025-11-01 02:00:00', '2025-11-05 11:00:00', 'Bangkok Convention Center', 'John Doe', 'uploads/exhibitions/EXP1758869553109.png', 'published', 1, NULL, '2025-09-15 15:06:36', '2025-09-26 06:52:33', NULL),
(3, 'EX202503', 'Green Future Week', 'งานสิ่งแวดล้อมและพลังงานสะอาด', '2025-10-05 02:00:00', '2025-10-09 11:00:00', 'Khon Kaen Hall', 'Mai Organizer', 'uploads/exhibitions/EXP1758869541507.png', 'published', 1, NULL, '2025-09-15 15:06:36', '2025-09-26 06:52:21', NULL),
(5, 'EX202401', 'Modern Art Showcase 2011', 'A curated selection of contemporary pieces from emerging artists.', '2024-08-30 02:00:00', '2024-09-13 10:00:00', 'Gallery Hall A', 'City Arts Council', 'uploads/exhibitions/EXP1758868393393.png', 'draft', 42, NULL, '2025-09-25 13:07:39', '2025-09-26 06:33:13', NULL),
(8, 'EX202404', 'Modern Art Showcase 2024', 'A curated selection of contemporary pieces.', '2024-08-31 20:00:00', '2024-09-15 04:00:00', 'Gallery Hall A', 'City Arts Council', 'uploads/exhibitions/EXP1758868400309.png', 'draft', 42, NULL, '2025-09-25 13:35:02', '2025-09-26 06:33:20', NULL),
(12, 'EX202505', 're', 'test', '2025-09-25 09:05:00', '2025-09-26 09:05:00', 'test', 'test', 'uploads/exhibitions/EXP1758868407111.png', 'draft', 1, NULL, '2025-09-25 23:05:55', '2025-09-26 06:33:27', NULL),
(14, 'EX202506', 'ทดสอบการแก้ไข21', 'นิทรรศการ “Smart Tech Expo 2025” ถูกออกแบบมาให้เป็นพื้นที่แห่งการบรรจบกันของเทคโนโลยี นวัตกรรม และความคิดสร้างสรรค์จากทั่วโลก ผู้เข้าชมจะได้พบกับบูธสตาร์ตอัปด้าน AI ที่นำเสนอแอปพลิเคชันอัจฉริยะซึ่งสามารถเรียนรู้พฤติกรรมผู้ใช้และปรับตัวได้ทันที นิทรรศการหุ่นยนต์ที่ผสานความสามารถด้านวิศวกรรมกับศิลปะการเคลื่อนไหวราวกับมีชีวิตจริง โซน IoT ที่จำลองบ้านอัจฉริยะทั้งหลังให้ผู้ชมได้สัมผัสประสบการณ์ “อนาคตของการอยู่อาศัย” และเวิร์กช็อปด้าน Cybersecurity ที่จะพาคุณลงลึกถึงการป้องกันภัยในโลกดิจิทัล', '2025-09-20 10:35:00', '2025-09-21 15:35:00', NULL, 'test', 'uploads/exhibitions/EXP1758868430956.png', 'draft', 1, NULL, '2025-09-25 23:35:24', '2025-10-09 09:25:46', NULL),
(15, 'EX202507', 'test', 'test', '2025-10-02 11:57:00', '2025-10-22 11:57:00', 'test', 'test', 'uploads/exhibitions/EXP1759433238838.jpg', 'draft', 1, NULL, '2025-10-02 19:27:19', '2025-10-09 07:22:22', NULL);

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
-- Table structure for table `exhibition_feedback`
--

CREATE TABLE `exhibition_feedback` (
  `feedback_id` int NOT NULL,
  `exhibition_id` int NOT NULL,
  `user_id` int NOT NULL,
  `rating` tinyint DEFAULT NULL,
  `comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `exhibition_feedback`
--

INSERT INTO `exhibition_feedback` (`feedback_id`, `exhibition_id`, `user_id`, `rating`, `comment`, `created_at`) VALUES
(1, 1, 1, 5, 'งานดีมาก จัดระบบดี', '2025-11-01 16:45:56');

-- --------------------------------------------------------

--
-- Table structure for table `feature_banners`
--

CREATE TABLE `feature_banners` (
  `banner_id` int NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `href` varchar(255) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
(14, NULL, 'สุกัญญา ใจดี', 'female', '1995-03-10', NULL, NULL, 'staff@example.com', '0897654321', NULL, 'staff');

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
(2, 'org_john', '$2a$12$G6hlqoz6yKviU4Oult3lgOSkiw0aP7urh3gKW9dCF6XP5QS6EiFNy', 'john@expo.com', NULL, 'organizer', NULL),
(3, 'org_somchai', 'hashedpass3', 'somchai@expo.com', NULL, 'organizer', NULL),
(4, 'org_mai', 'hashedpass4', 'mai@expo.com', NULL, 'organizer', NULL),
(5, 'organizer_new', 'a615a46a9f52e117dffce7d7235b464a910f74508dfb51a27ce8c63d0413d9a0', 'organizer_new@example.com', NULL, 'organizer', NULL);

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
(4, 1, 14, '2025-10-20 10:20:43');

-- --------------------------------------------------------

--
-- Table structure for table `units`
--

CREATE TABLE `units` (
  `unit_id` int NOT NULL,
  `unit_code` varchar(30) DEFAULT NULL,
  `exhibition_id` int NOT NULL,
  `unit_name` varchar(255) NOT NULL,
  `description` text,
  `unit_type` enum('activity','booth') NOT NULL DEFAULT 'booth',
  `poster_url` varchar(500) DEFAULT NULL,
  `starts_at` datetime DEFAULT NULL,
  `ends_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `units`
--

INSERT INTO `units` (`unit_id`, `unit_code`, `exhibition_id`, `unit_name`, `description`, `unit_type`, `poster_url`, `starts_at`, `ends_at`) VALUES
(1, 'EX20250101', 1, 'Robotics Lab Demo2', 'Hands-on robotics challenge', 'booth', 'uploads/units/EXP1759848361494.jpg', '2024-04-30 20:00:00', '2024-05-01 04:00:00'),
(2, 'EX20250102', 1, 'Robot Show', 'โชว์บนเวทีใหญ่', 'activity', 'uploads/units/EXP1759849066017.webp', '2025-11-02 07:00:00', '2025-11-02 08:00:00'),
(3, 'EX20250103', 1, 'IoT Corner', 'ของเล่น IoT', 'booth', 'uploads/units/EXP1759849287066.png', '2025-11-01 03:00:00', '2025-11-05 10:00:00'),
(4, 'EX20250104', 1, 'Cloud 101 Talk', 'แนะนำพื้นฐานคลาวด์', 'activity', NULL, '2025-11-03 11:00:00', '2025-11-03 12:00:00'),
(5, 'EX20250105', 1, 'AR/VR Demo', 'ลองของจริง', 'booth', 'uploads/units/EXP1759848371446.jpg', '2025-11-01 02:30:00', '2025-11-05 10:30:00'),
(6, 'EX20250106', 1, 'Security Workshop', 'เวิร์กช็อปความปลอดภัย', 'activity', NULL, '2025-11-04 13:00:00', '2025-11-04 15:00:00'),
(7, 'EX20250107', 1, 'Startup Pitch', 'พิตช์บนเวที', 'activity', NULL, '2025-11-05 10:00:00', '2025-11-05 12:00:00'),
(8, 'EX20250108', 1, 'Hardware Lab', 'ทดลองบอร์ด ESP32', 'booth', NULL, '2025-11-02 09:00:00', '2025-11-05 18:00:00'),
(12, 'EX20250109', 1, 'Robotics Lab Demo', 'Hands-on robotics challenge', 'booth', 'uploads/units/EXP1760008335192.png', '2024-05-01 03:00:00', '2024-05-01 11:00:00'),
(15, 'EX20250110', 1, 'dfdfkdj', 'รายละเอียดรายละเอียดรายละเอียดรายละเอียดรายละเอียด', 'booth', 'uploads/units/EXP1760260365114.png', '2025-10-12 10:12:00', '2025-10-13 11:14:00');

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
(1, 1, 1, 1, '2025-11-01 10:05:00');

-- --------------------------------------------------------

--
-- Table structure for table `unit_feedback`
--

CREATE TABLE `unit_feedback` (
  `feedback_id` int NOT NULL,
  `unit_id` int NOT NULL,
  `user_id` int NOT NULL,
  `rating` tinyint DEFAULT NULL,
  `comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `unit_feedback`
--

INSERT INTO `unit_feedback` (`feedback_id`, `unit_id`, `user_id`, `rating`, `comment`, `created_at`) VALUES
(1, 1, 1, 5, 'บูธ AI สุดยอด เข้าใจง่าย คนอธิบายเก่ง', '2025-11-01 11:00:00');

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
(3, 5),
(3, 14);

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
,`description` text
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
`feedback_id` int
,`exhibition_code` varchar(20)
,`exhibition_title` varchar(255)
,`unit_name` varchar(255)
,`user_name` varchar(255)
,`rating` tinyint
,`comment` text
,`created_at` timestamp
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
  ADD UNIQUE KEY `uq_exhibition_code` (`exhibition_code`);

--
-- Indexes for table `exhibition_feedback`
--
ALTER TABLE `exhibition_feedback`
  ADD PRIMARY KEY (`feedback_id`),
  ADD KEY `idx_exhf_exhibition` (`exhibition_id`),
  ADD KEY `fk_exhf_user` (`user_id`);

--
-- Indexes for table `feature_banners`
--
ALTER TABLE `feature_banners`
  ADD PRIMARY KEY (`banner_id`);

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
-- Indexes for table `registrations`
--
ALTER TABLE `registrations`
  ADD PRIMARY KEY (`registration_id`),
  ADD UNIQUE KEY `uq_registration` (`exhibition_id`,`user_id`),
  ADD KEY `fk_reg_user` (`user_id`);

--
-- Indexes for table `units`
--
ALTER TABLE `units`
  ADD PRIMARY KEY (`unit_id`),
  ADD UNIQUE KEY `uq_units_exh_name` (`exhibition_id`,`unit_name`),
  ADD UNIQUE KEY `uq_unit_code` (`unit_code`);

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
-- Indexes for table `unit_feedback`
--
ALTER TABLE `unit_feedback`
  ADD PRIMARY KEY (`feedback_id`),
  ADD KEY `idx_uf_unit` (`unit_id`),
  ADD KEY `idx_uf_user` (`user_id`);

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
  MODIFY `exhibition_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `exhibition_feedback`
--
ALTER TABLE `exhibition_feedback`
  MODIFY `feedback_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `feature_banners`
--
ALTER TABLE `feature_banners`
  MODIFY `banner_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `normal_users`
--
ALTER TABLE `normal_users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `organizer_users`
--
ALTER TABLE `organizer_users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `registrations`
--
ALTER TABLE `registrations`
  MODIFY `registration_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `units`
--
ALTER TABLE `units`
  MODIFY `unit_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `units_checkins`
--
ALTER TABLE `units_checkins`
  MODIFY `checkin_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `unit_feedback`
--
ALTER TABLE `unit_feedback`
  MODIFY `feedback_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_unit_feedback`  AS SELECT `f`.`feedback_id` AS `feedback_id`, `e`.`exhibition_code` AS `exhibition_code`, `e`.`title` AS `exhibition_title`, `un`.`unit_name` AS `unit_name`, `u`.`full_name` AS `user_name`, `f`.`rating` AS `rating`, `f`.`comment` AS `comment`, `f`.`created_at` AS `created_at` FROM (((`unit_feedback` `f` join `units` `un` on((`f`.`unit_id` = `un`.`unit_id`))) join `exhibitions` `e` on((`un`.`exhibition_id` = `e`.`exhibition_id`))) join `normal_users` `u` on((`f`.`user_id` = `u`.`user_id`))) ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `certificate_templates`
--
ALTER TABLE `certificate_templates`
  ADD CONSTRAINT `fk_ct_exhibition` FOREIGN KEY (`exhibition_id`) REFERENCES `exhibitions` (`exhibition_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `exhibition_feedback`
--
ALTER TABLE `exhibition_feedback`
  ADD CONSTRAINT `fk_exhf_exhibition` FOREIGN KEY (`exhibition_id`) REFERENCES `exhibitions` (`exhibition_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_exhf_user` FOREIGN KEY (`user_id`) REFERENCES `normal_users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `registrations`
--
ALTER TABLE `registrations`
  ADD CONSTRAINT `fk_reg_exhibition` FOREIGN KEY (`exhibition_id`) REFERENCES `exhibitions` (`exhibition_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reg_user` FOREIGN KEY (`user_id`) REFERENCES `normal_users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `units`
--
ALTER TABLE `units`
  ADD CONSTRAINT `fk_units_exhibition` FOREIGN KEY (`exhibition_id`) REFERENCES `exhibitions` (`exhibition_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `units_checkins`
--
ALTER TABLE `units_checkins`
  ADD CONSTRAINT `fk_uc_exhibition` FOREIGN KEY (`exhibition_id`) REFERENCES `exhibitions` (`exhibition_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_uc_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`unit_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_uc_user` FOREIGN KEY (`user_id`) REFERENCES `normal_users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `unit_feedback`
--
ALTER TABLE `unit_feedback`
  ADD CONSTRAINT `fk_uf_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`unit_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_uf_user` FOREIGN KEY (`user_id`) REFERENCES `normal_users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `unit_staffs`
--
ALTER TABLE `unit_staffs`
  ADD CONSTRAINT `unit_staffs_ibfk_1` FOREIGN KEY (`unit_id`) REFERENCES `units` (`unit_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `unit_staffs_ibfk_2` FOREIGN KEY (`staff_user_id`) REFERENCES `normal_users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
