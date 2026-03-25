-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: Mar 15, 2026 at 11:07 AM
-- Server version: 8.4.8
-- PHP Version: 8.3.30

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
  `exhibition_id` int NOT NULL COMMENT 'FK เชื่อมกับตารางนิทรรศการ',
  `background_url` varchar(500) DEFAULT NULL COMMENT 'ที่อยู่ไฟล์ PDF/Image พื้นหลัง',
  `layout_config` json DEFAULT NULL COMMENT 'เก็บค่า config เช่น {participant_name: {x: 100, y: 200, font_size: 24}}',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `certificate_templates`
--

INSERT INTO `certificate_templates` (`template_id`, `exhibition_id`, `background_url`, `layout_config`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, '{\"date\": {\"x\": 300, \"y\": 600, \"align\": \"center\", \"color\": \"#666666\", \"font_size\": 24}, \"organizer_name\": {\"x\": 300, \"y\": 700, \"align\": \"center\", \"color\": \"#666666\", \"font_size\": 20}, \"exhibition_title\": {\"x\": 300, \"y\": 200, \"align\": \"center\", \"color\": \"#333333\", \"font_size\": 36}, \"participant_name\": {\"x\": 300, \"y\": 500, \"align\": \"center\", \"color\": \"#000000\", \"font_size\": 48}}', '2025-09-15 15:06:36', '2025-09-15 15:06:36'),
(3, 17, NULL, '{\"participant_name\": {\"x\": 996, \"y\": 798, \"align\": \"center\", \"color\": \"#000000\", \"font_size\": 48}}', '2026-01-14 15:34:52', '2026-01-15 16:33:22');

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
  `detail_pdf_url` varchar(500) DEFAULT NULL,
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

INSERT INTO `exhibitions` (`exhibition_id`, `exhibition_code`, `title`, `description`, `description_delta`, `start_date`, `end_date`, `location`, `organizer_name`, `picture_path`, `detail_pdf_url`, `status`, `created_by`, `updated_by`, `created_at`, `updated_at`, `archived_at`, `exhibition_set_id`, `unit_set_id`) VALUES
(1, 'EX202501', 'Future Tech Expo 2026', '<p><strong>สัมผัสนวัตกรรม</strong> AI และหุ่นยนต์แห่งอนาคต พบกับ Gadget ล่าสุดจากบริษัทยักษ์ใหญ่ทั่วโลก</p>', '{\"ops\": [{\"insert\": \"สัมผัสนวัตกรรม\", \"attributes\": {\"bold\": true}}, {\"insert\": \" AI และหุ่นยนต์แห่งอนาคต พบกับ Gadget ล่าสุดจากบริษัทยักษ์ใหญ่ทั่วโลก\\n\"}]}', '2026-02-08 22:00:00', '2026-06-11 23:00:00', 'BITEC Bangna, Hall 98', 'Tech Pioneer Group', 'uploads/exhibitions/EXP1772573045755.png', 'uploads/exhibitions/EXP_PDF1772903343328.pdf', 'ongoing', 1, NULL, '2025-09-15 15:06:36', '2026-03-07 17:09:03', NULL, 103, 104),
(3, 'EX202503', 'Green Future Week', 'งานสิ่งแวดล้อมและพลังงานสะอาด', NULL, '2025-10-05 02:00:00', '2025-10-09 11:00:00', 'Khon Kaen Hall', 'Mai Organizer', NULL, NULL, 'ended', 1, NULL, '2025-09-15 15:06:36', '2025-10-24 18:54:55', NULL, NULL, NULL),
(5, 'EX202401', 'Modern Art Showcase 2011', 'A curated selection of contemporary pieces from emerging artists.', NULL, '2024-08-30 02:00:00', '2024-09-13 10:00:00', 'Gallery Hall A', 'City Arts Council', NULL, NULL, 'ended', 42, NULL, '2025-09-25 13:07:39', '2025-10-24 18:59:55', NULL, NULL, NULL),
(8, 'EX202404', 'Modern Art Showcase 2024', 'A curated selection of contemporary pieces.', NULL, '2024-08-31 20:00:00', '2024-09-15 04:00:00', 'Gallery Hall A', 'City Arts Council', NULL, NULL, 'draft', 42, NULL, '2025-09-25 13:35:02', '2025-09-26 06:33:20', NULL, NULL, NULL),
(12, 'EX202505', 're', 'test', NULL, '2025-09-25 09:05:00', '2025-09-26 09:05:00', 'test', 'test', NULL, NULL, 'draft', 1, NULL, '2025-09-25 23:05:55', '2025-09-26 06:33:27', NULL, NULL, NULL),
(14, 'EX202506', 'ทดสอบการแก้ไข21', 'นิทรรศการ \"Smart Tech Expo 2025\" ถูกออกแบบมาให้เป็นพื้นที่แห่งการบรรจบกันของเทคโนโลยี นวัตกรรม และความคิดสร้างสรรค์จากทั่วโลก ผู้เข้าชมจะได้พบกับบูธสตาร์ตอัปด้าน AI ที่นำเสนอแอปพลิเคชันอัจฉริยะซึ่งสามารถเรียนรู้พฤติกรรมผู้ใช้และปรับตัวได้ทันที นิทรรศการหุ่นยนต์ที่ผสานความสามารถด้านวิศวกรรมกับศิลปะการเคลื่อนไหวราวกับมีชีวิตจริง โซน IoT ที่จำลองบ้านอัจฉริยะทั้งหลังให้ผู้ชมได้สัมผัสประสบการณ์ \"อนาคตของการอยู่อาศัย\" และเวิร์กช็อปด้าน Cybersecurity ที่จะพาคุณลงลึกถึงการป้องกันภัยในโลกดิจิทัล', NULL, '2025-09-20 10:35:00', '2025-09-21 15:35:00', NULL, 'test', NULL, NULL, 'draft', 1, NULL, '2025-09-25 23:35:24', '2025-10-09 09:25:46', NULL, NULL, NULL),
(15, 'EX202507', 'test', 'test', NULL, '2025-10-31 04:57:00', '2025-11-08 04:57:00', 'test', 'test', NULL, NULL, 'ended', 1, NULL, '2025-10-02 19:27:19', '2025-12-31 09:19:55', NULL, NULL, NULL),
(16, 'EX202508', 'test', '<p>this is the test <strong>wow this is the bold wow za 007 </strong></p>', NULL, '2025-10-21 04:57:00', '2025-10-21 04:57:00', 'test', 'asdf', NULL, NULL, 'ended', 1, NULL, '2025-10-24 18:57:43', '2025-10-24 20:49:32', NULL, NULL, NULL),
(17, 'EX202509', 'test', '<p>test</p>', '{\"ops\": [{\"insert\": \"test\\n\"}]}', '2025-10-27 15:51:00', '2028-05-29 15:51:00', 'test', 'test', NULL, NULL, 'ongoing', 2, NULL, '2025-12-31 09:51:48', '2026-01-25 18:14:04', NULL, 105, 106),
(99, 'EX202601', 'AI Technology Expo 2026', NULL, NULL, '2026-01-01 00:00:00', '2026-01-10 00:00:00', NULL, 'test', NULL, NULL, 'ended', 1, NULL, '2026-01-06 08:39:03', '2026-01-10 07:34:55', NULL, 101, 102);

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
-- Table structure for table `exhibition_announcements`
--

CREATE TABLE `exhibition_announcements` (
  `announcement_id` int NOT NULL,
  `exhibition_id` int NOT NULL COMMENT 'Links to a specific exhibition',
  `topic` varchar(255) NOT NULL COMMENT 'The headline',
  `description` text COMMENT 'The main content',
  `description_delta` text COMMENT 'Quill Delta JSON for rich text content',
  `image_url` varchar(2048) DEFAULT NULL COMMENT 'Path or URL to the picture',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '1 = Show, 0 = Hide (Soft delete)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `exhibition_announcements`
--

INSERT INTO `exhibition_announcements` (`announcement_id`, `exhibition_id`, `topic`, `description`, `description_delta`, `image_url`, `is_active`, `created_at`, `updated_at`) VALUES
(7, 1, 'test', 'test', NULL, 'uploads/news/NEWS1770891167809.jpg', 1, '2026-02-12 10:12:48', '2026-02-12 10:18:39'),
(8, 1, 'test2', 'test2', NULL, 'uploads/news/NEWS1770891602610.png', 1, '2026-02-12 10:20:02', '2026-02-12 10:20:02'),
(9, 1, 'อัปเดตระบบความปลอดภัยประจำเดือนกุมภาพันธ์', 'เราได้ทำการอัปเดตระบบความปลอดภัยครั้งสำคัญประจำเดือนกุมภาพันธ์ 2026 การอัปเดตนี้รวมถึงการแก้ไขช่องโหว่ที่อาจเกิดขึ้นและปรับปรุงประสิทธิภาพโดยรวมของระบบ ผู้ใช้งานอาจพบการเปลี่ยนแปลงเล็กน้อยในหน้าเข้าสู่ระบบ ซึ่งเป็นส่วนหนึ่งของมาตรการยืนยันตัวตนแบบใหม่ของเรา ทีมงานขอขอบคุณที่ไว้วางใจใช้บริการของเราเสมอมา หากพบปัญหาในการใช้งาน กรุณาติดต่อฝ่ายสนับสนุนทันที', NULL, 'uploads/news/NEWS1771063478193.jpg', 1, '2026-02-14 10:04:38', '2026-02-14 10:04:38'),
(10, 17, 'test', 'ทดสอบ uploads ข่าวสาร', '{\"ops\":[{\"insert\":\"ทดสอบ uploads ข่าวสาร\\n\"}]}', 'uploads/news/NEWS1773159753996.jpg', 1, '2026-03-10 16:22:34', '2026-03-10 16:22:34');

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
  `current_exhibition_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `normal_users`
--

INSERT INTO `normal_users` (`user_id`, `line_user_id`, `full_name`, `gender`, `birthdate`, `username`, `picture_url`, `email`, `phone`, `last_synced_at`, `current_exhibition_id`) VALUES
(1, 'U0001', 'สมชาย ใจดี', 'male', '1990-05-15', 'somchai', NULL, 'somchai@example.com', '0812345671', NULL, 1),
(2, 'U0002', 'สมหญิง รักสวย', 'female', '1992-03-22', 'somying', NULL, 'somying@example.com', '0812345672', NULL, 1),
(3, 'U0003', 'วิชัย สตาฟ', 'male', '1988-11-10', 'wichai', NULL, 'wichai@example.com', '0812345673', NULL, NULL),
(4, 'U0004', 'นารี สตาฟ', 'female', '1995-07-01', 'naree', NULL, 'naree@example.com', '0812345674', NULL, NULL),
(5, 'U0005', 'ประยุทธ์ ทดสอบ', 'male', '1985-01-30', 'prayuth', NULL, 'prayuth@example.com', '0812345675', NULL, 1),
(13, 'U0013', 'ทดสอบ สิบสาม', 'male', '1991-06-18', 'test13', NULL, 'test13@example.com', '0812345683', NULL, 1),
(14, 'U0014', 'ทดสอบ สิบสี่', 'female', '1993-09-25', 'test14', NULL, 'test14@example.com', '0812345684', NULL, 1),
(15, 'U0015', 'ทดสอบ สิบห้า', 'male', '1994-02-14', 'test15', NULL, 'test15@example.com', '0812345685', NULL, 17),
(16, 'U0016', 'ทดสอบ สิบหก', 'female', '1996-12-05', 'test16', NULL, 'test16@example.com', '0812345686', NULL, 1),
(17, 'U0017', 'ทดสอบ สิบเจ็ด', 'male', '1997-08-20', 'test17', NULL, 'test17@example.com', '0812345687', NULL, 1),
(18, 'Ue9761b5cc006f2b8c7d0897e8b272c61', '279 ยงศักดิ์ (Neo)', 'male', '2026-02-03', '279neo', 'https://sprofile.line-scdn.net/0h3enF8LH7bEpDP3IYHEISdDNvbyBgTjVYbVlxJXQ3Z3kpWi1Oa1BwfyU6Oyp9BytPOFwgLiQ7MHJhWWhyZhknLw12VxMGVFF5DiJfeQ1iLn4mS3NZCyA_KQFbeRIgbFVXJAlUcSNLdz8rZF9-CAcjRxhfaH58T1JbEWgAHEYNAsksPRsfblgqKX44M3L2', 'test@gmail.com', '0952909471', '2026-03-15 09:04:54', 17),
(22, 'Ub4cf78728db86411aad7edcc1da9d55b', '65200123 ณัฐวัฒน์', 'male', '2010-02-12', '65200123', 'https://sprofile.line-scdn.net/0heL-djeviOmMAHS0TR35EHHBNOQkjbGNxL3wnBmFNN1E7JXs2L31xUWIdZ1Q1JXUxJClwUTAfZ1EMDk0FHkvGVwctZ1I8JHg9K3p9jQ', 'kjahhisi.jj@gmail.com', '5681992778', '2026-03-13 08:03:43', NULL);

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
(1, 'admin01', '$2a$12$G6hlqoz6yKviU4Oult3lgOSkiw0aP7urh3gKW9dCF6XP5QS6EiFNy', 'admin01@example.com', NULL, 'admin', '2026-03-11 17:48:00'),
(2, 'org_john', '$2a$12$D5ahB2w4pMDgxxy9dWPWUeQJBuFrjbILYxaA645cb7HpqbKxAB3Mi', 'john@expo.com', NULL, 'organizer', '2026-02-14 07:42:46');

-- --------------------------------------------------------

--
-- Table structure for table `questions_template`
--

CREATE TABLE `questions_template` (
  `qt_id` int NOT NULL,
  `content` text NOT NULL,
  `category` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `questions_template`
--

INSERT INTO `questions_template` (`qt_id`, `content`, `category`) VALUES
(1, 'ความสะอาดและความปลอดภัย', NULL),
(2, 'การประชาสัมพันธ์ข้อมูล', NULL),
(3, 'ความรู้ที่ได้รับจากบูธ', NULL),
(4, 'การให้บริการของเจ้าหน้าที่', NULL),
(5, 'ความสุภาพและเป็นมิตรของเจ้าหน้าที่ประจำบูธ', NULL),
(6, 'ความกระตือรือร้นในการให้บริการ', NULL),
(7, 'ความชัดเจนในการตอบคำถามและให้ข้อมูล', NULL),
(8, 'บุคลิกภาพและการแต่งกายของเจ้าหน้าที่', NULL),
(9, 'ความน่าสนใจของเนื้อหา/นวัตกรรมที่นำมาจัดแสดง', NULL),
(10, 'ความรู้ใหม่ที่ได้รับจากบูธนี้', NULL),
(11, 'ความสามารถในการอธิบายข้อมูลเชิงลึกของวิทยากร', NULL),
(12, 'เอกสารประกอบหรือสื่อการเรียนรู้มีความเหมาะสม', NULL),
(13, 'ความสนุกสนานของกิจกรรมที่จัดขึ้น', NULL),
(14, 'ระยะเวลาในการร่วมกิจกรรมมีความเหมาะสม', NULL),
(15, 'ของรางวัลหรือของที่ระลึกมีความน่าสนใจ', NULL),
(16, 'ขั้นตอนการร่วมกิจกรรมเข้าใจง่าย ไม่ซับซ้อน', NULL),
(17, 'ความสะดวกในการเดินทางมายังสถานที่จัดงาน', NULL),
(18, 'ความเพียงพอและความสะอาดของห้องน้ำ', NULL),
(19, 'ความชัดเจนของป้ายบอกทางภายในงาน', NULL),
(20, 'ระบบการลงทะเบียนเข้างานมีความรวดเร็ว', NULL),
(21, 'ความเหมาะสมของระบบแสง เสียง และอุณหภูมิภายในฮอลล์', NULL),
(22, 'ภาพรวมความพึงพอใจต่อการจัดงานครั้งนี้', NULL),
(23, 'ความน่าสนใจของหัวข้อการจัดงาน', NULL),
(24, 'ระยะเวลาการจัดงานมีความเหมาะสม', NULL),
(25, 'โอกาสที่คุณจะมาร่วมงานนี้อีกในครั้งต่อไป', NULL),
(26, 'ชอบวิทยากรหลักหรือไม่?', NULL),
(27, 'การประชาสัมพันธ์ข้อมูล2123123213', NULL),
(28, 'asfsadfdsa', NULL),
(29, 'test', NULL),
(30, 'taht is cus', NULL),
(31, 'together we fight', NULL);

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
(3, 'Master Unit: Service Mind (เน้นการบริการ)', 1, 'UNIT'),
(4, 'Master Unit: Knowledge & Innovation (เน้นความรู้/นวัตกรรม)', 1, 'UNIT'),
(5, 'Master Unit: Activity & Fun (เน้นความสนุก/กิจกรรม)', 1, 'UNIT'),
(6, 'Master Exh: Facilities & Logistics (สถานที่และความสะดวก)', 1, 'EXHIBITION'),
(7, 'Master Exh: Overall Experience (ความพึงพอใจภาพรวม)', 1, 'EXHIBITION'),
(101, 'Set for AI Expo (Exhibition)', 0, 'EXHIBITION'),
(102, 'Set for AI Expo (Unit)', 0, 'UNIT'),
(103, 'Questions for Exhibition EX202501 (EXHIBITION)', 0, 'EXHIBITION'),
(104, 'Questions for Exhibition EX202501 (UNIT)', 0, 'UNIT'),
(105, 'Questions for Exhibition EX202509 (EXHIBITION)', 0, 'EXHIBITION'),
(106, 'Questions for Exhibition EX202509 (UNIT)', 0, 'UNIT');

-- --------------------------------------------------------

--
-- Table structure for table `registrations`
--

CREATE TABLE `registrations` (
  `registration_id` int NOT NULL,
  `exhibition_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` enum('visitor','staff') NOT NULL DEFAULT 'visitor',
  `registered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `registrations`
--

INSERT INTO `registrations` (`registration_id`, `exhibition_id`, `user_id`, `role`, `registered_at`) VALUES
(1, 1, 1, 'visitor', '2025-10-20 14:30:00'),
(2, 1, 2, 'visitor', '2025-10-22 16:00:00'),
(3, 1, 13, 'visitor', '2025-10-20 10:04:26'),
(4, 1, 14, 'visitor', '2025-10-20 10:20:43'),
(5, 17, 15, 'visitor', '2026-01-03 04:31:56'),
(6, 1, 15, 'visitor', '2026-01-03 06:05:57'),
(7, 1, 16, 'visitor', '2026-01-05 08:39:52'),
(10, 1, 17, 'visitor', '2026-01-05 09:45:33'),
(11, 17, 18, 'visitor', '2026-02-14 08:08:43'),
(16, 1, 18, 'staff', '2026-02-14 08:17:22'),
(17, 17, 22, 'visitor', '2026-02-14 09:07:35');

-- --------------------------------------------------------

--
-- Table structure for table `set_question_mapping`
--

CREATE TABLE `set_question_mapping` (
  `set_id` int NOT NULL,
  `qt_id` int NOT NULL,
  `sort_order` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `set_question_mapping`
--

INSERT INTO `set_question_mapping` (`set_id`, `qt_id`, `sort_order`) VALUES
(1, 1, 1),
(1, 2, 2),
(2, 3, 1),
(2, 4, 2),
(3, 5, 1),
(3, 6, 2),
(3, 7, 3),
(3, 8, 4),
(4, 9, 1),
(4, 10, 2),
(4, 11, 3),
(4, 12, 4),
(5, 13, 1),
(5, 14, 2),
(5, 15, 3),
(5, 16, 4),
(6, 17, 1),
(6, 18, 2),
(6, 19, 3),
(6, 20, 4),
(6, 21, 5),
(7, 22, 1),
(7, 23, 2),
(7, 24, 3),
(7, 25, 4),
(101, 1, 1),
(101, 2, 2),
(101, 26, 3),
(102, 3, 1),
(102, 4, 2),
(103, 1, 1),
(103, 2, 2),
(103, 27, 3),
(103, 28, 4),
(104, 5, 1),
(104, 6, 2),
(104, 7, 3),
(104, 8, 4),
(104, 30, 5),
(104, 31, 6),
(105, 29, 1),
(106, 5, 1),
(106, 6, 2),
(106, 7, 3),
(106, 8, 4),
(106, 29, 5);

-- --------------------------------------------------------

--
-- Table structure for table `survey_answers`
--

CREATE TABLE `survey_answers` (
  `answer_id` int NOT NULL,
  `submission_id` int NOT NULL,
  `set_id` int NOT NULL,
  `qt_id` int NOT NULL,
  `score` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `survey_answers`
--

INSERT INTO `survey_answers` (`answer_id`, `submission_id`, `set_id`, `qt_id`, `score`) VALUES
(1, 1001, 101, 1, 5),
(2, 1001, 101, 2, 4),
(3, 1001, 101, 26, 5),
(61, 1018, 106, 5, 5),
(62, 1018, 106, 6, 5),
(63, 1018, 106, 7, 4),
(64, 1018, 106, 8, 5),
(65, 1018, 106, 29, 5),
(66, 1019, 105, 29, 4);

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
(1002, 99, 5, 5, 'พี่สต๊าฟอธิบายงงๆ นิดนึง', '2026-01-06 08:41:46'),
(1018, 17, 19, 13, 'พี่วิชัยบริการดีมาก อธิบายเข้าใจง่ายสุดๆ', '2026-02-18 07:12:53'),
(1019, 17, NULL, 22, NULL, '2026-02-18 07:51:16');

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
(1, 'EX20250101', 1, 'Robotics Lab Demo2', '<p><strong>s dlrow eht</strong></p>', '{\"ops\": [{\"insert\": \"s dlrow eht\", \"attributes\": {\"bold\": true}}, {\"insert\": \"\\n\"}]}', 'booth', NULL, NULL, '2024-04-30 06:00:00', '2024-04-30 14:00:00', NULL),
(2, 'EX20250102', 1, 'Robot Show', 'โชว์บนเวทีใหญ่', NULL, 'activity', NULL, NULL, '2025-11-02 07:00:00', '2025-11-02 08:00:00', NULL),
(3, 'EX20250103', 1, 'IoT Corner', 'ของเล่น IoT', NULL, 'booth', NULL, NULL, '2025-11-01 03:00:00', '2025-11-05 10:00:00', NULL),
(4, 'EX20250104', 1, 'Cloud 101 Talk', 'แนะนำพื้นฐานคลาวด์', NULL, 'activity', NULL, NULL, '2025-11-03 11:00:00', '2025-11-03 12:00:00', NULL),
(5, 'EX20260101', 99, 'Robot AI Booth', NULL, NULL, 'booth', NULL, NULL, NULL, NULL, NULL),
(6, 'EX20260102', 99, 'Smart Farm Booth', NULL, NULL, 'booth', NULL, NULL, NULL, NULL, NULL),
(7, 'EX20250107', 1, 'Startup Pitch', 'พิตช์บนเวที', NULL, 'activity', NULL, NULL, '2025-11-05 10:00:00', '2025-11-05 12:00:00', NULL),
(8, 'EX20250108', 1, 'Hardware Lab', 'ทดลองบอร์ด ESP32', NULL, 'booth', NULL, NULL, '2025-11-02 09:00:00', '2025-11-05 18:00:00', NULL),
(12, 'EX20250109', 1, 'Robotics Lab Demo', '<p>Hands-on robotics challenge this is the bold<strong> what happpend so that is it lkjklkj</strong></p>', '{\"ops\": [{\"insert\": \"Hands-on robotics challenge this is the bold\"}, {\"insert\": \" what happpend so that is it lkjklkj\", \"attributes\": {\"bold\": true}}, {\"insert\": \"\\n\"}]}', 'booth', NULL, NULL, '2024-04-30 06:00:00', '2024-04-30 14:00:00', NULL),
(15, 'EX20250110', 1, 'dfdfkdj', '<ol><li><strong>รายละเอียดรายละเอียดรายละเอียดรายละเอียดรายละเอียด zxcvzxcvx</strong></li></ol>', '{\"ops\": [{\"insert\": \"รายละเอียดรายละเอียดรายละเอียดรายละเอียดรายละเอียด zxcvzxcvx\", \"attributes\": {\"bold\": true}}, {\"insert\": \"\\n\", \"attributes\": {\"list\": \"ordered\"}}]}', 'booth', NULL, NULL, '2025-10-11 06:12:00', '2025-10-12 07:14:00', NULL),
(16, 'EX20250701', 15, 'units test', '<p><strong><em>test</em></strong></p>', '{\"ops\": [{\"insert\": \"test\", \"attributes\": {\"bold\": true, \"italic\": true}}, {\"insert\": \"\\n\"}]}', 'booth', NULL, NULL, '2025-10-21 04:41:00', '2025-10-22 04:41:00', NULL),
(17, 'EX20250301', 3, 'ทดสอบเพิ่มกิจกรรม', 'resrasl;dfka;sdlfkasdf', NULL, 'activity', NULL, NULL, '2025-10-19 22:44:00', '2025-10-22 22:44:00', NULL),
(18, 'EX20250302', 3, 'test', 'test', NULL, 'activity', NULL, NULL, '2025-10-20 18:46:00', '2025-10-29 18:46:00', NULL),
(19, 'EX20250901', 17, 'test', '<p>test</p>', '{\"ops\": [{\"insert\": \"test\\n\"}]}', 'activity', NULL, NULL, '2025-12-11 20:00:00', '2025-12-31 20:00:00', NULL),
(20, 'EX20250902', 17, 'tes2', '<p>testa</p>', '{\"ops\": [{\"insert\": \"testa\\n\"}]}', 'booth', 'uploads/units/EXP1772572222581.jpg', 'uploads/units/EXP_PDF1772572259981.pdf', '2026-03-11 01:00:00', '2026-05-20 11:29:00', NULL);

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
(9, 17, 15, 20, '2025-11-01 10:05:00'),
(10, 17, 22, 20, '2026-02-14 09:07:44'),
(12, 17, 13, 19, '2026-02-18 07:12:53');

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
(2, 18);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_certificate_templates`
-- (See below for the actual view)
--
CREATE TABLE `v_certificate_templates` (
`background_url` varchar(500)
,`created_at` timestamp
,`exhibition_code` varchar(20)
,`exhibition_id` int
,`exhibition_title` varchar(255)
,`layout_config` json
,`organizer_name` varchar(255)
,`template_id` int
,`updated_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_exhibitions`
-- (See below for the actual view)
--
CREATE TABLE `v_exhibitions` (
`archived_at` timestamp
,`created_at` timestamp
,`description` mediumtext
,`end_date` datetime
,`exhibition_code` varchar(20)
,`exhibition_id` int
,`location` varchar(255)
,`organizer_name` varchar(255)
,`picture_path` varchar(500)
,`start_date` datetime
,`status` enum('draft','published','ongoing','ended','archived')
,`title` varchar(255)
,`updated_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_exhibition_feedback`
-- (See below for the actual view)
--
CREATE TABLE `v_exhibition_feedback` (
`comment` text
,`created_at` timestamp
,`exhibition_id` int
,`exhibition_name` varchar(255)
,`question_topic` text
,`score` int
,`submission_id` int
,`user_id` int
,`user_name` varchar(255)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_exhibition_with_registrations`
-- (See below for the actual view)
--
CREATE TABLE `v_exhibition_with_registrations` (
`exhibition_code` varchar(20)
,`exhibition_id` int
,`title` varchar(255)
,`total_registrations` bigint
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_my_event_surveys`
-- (See below for the actual view)
--
CREATE TABLE `v_my_event_surveys` (
`end_date` datetime
,`exhibition_code` varchar(20)
,`exhibition_id` int
,`exhibition_set_id` int
,`location` varchar(255)
,`picture_path` varchar(500)
,`registered_at` timestamp
,`registration_id` int
,`start_date` datetime
,`status` enum('draft','published','ongoing','ended','archived')
,`survey_completed` int
,`title` varchar(255)
,`user_id` int
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_org_dashboard_kpis`
-- (See below for the actual view)
--
CREATE TABLE `v_org_dashboard_kpis` (
`description` mediumtext
,`exhibition_avg_score` decimal(13,2)
,`exhibition_id` int
,`location` varchar(255)
,`status` enum('draft','published','ongoing','ended','archived')
,`title` varchar(255)
,`total_checkins` bigint
,`total_registrations` bigint
,`total_units` bigint
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_org_exhibition_feedback_stats`
-- (See below for the actual view)
--
CREATE TABLE `v_org_exhibition_feedback_stats` (
`exhibition_id` int
,`score` decimal(13,2)
,`topic` text
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_org_unit_stats`
-- (See below for the actual view)
--
CREATE TABLE `v_org_unit_stats` (
`checkins` bigint
,`exhibition_id` int
,`id` int
,`name` varchar(255)
,`rating` decimal(13,2)
,`type` enum('activity','booth')
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_registrations`
-- (See below for the actual view)
--
CREATE TABLE `v_registrations` (
`exhibition_code` varchar(20)
,`exhibition_title` varchar(255)
,`registered_at` timestamp
,`registration_id` int
,`user_name` varchar(255)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_staff_dashboard_question_scores`
-- (See below for the actual view)
--
CREATE TABLE `v_staff_dashboard_question_scores` (
`average_score` decimal(10,2)
,`qt_id` int
,`question_topic` text
,`response_count` bigint
,`staff_user_id` int
,`unit_id` int
,`unit_name` varchar(255)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_staff_dashboard_stats`
-- (See below for the actual view)
--
CREATE TABLE `v_staff_dashboard_stats` (
`average_score` decimal(13,2)
,`description` mediumtext
,`description_delta` json
,`detail_pdf_url` varchar(500)
,`ends_at` datetime
,`exhibition_id` int
,`exhibition_location` varchar(255)
,`exhibition_status` enum('draft','published','ongoing','ended','archived')
,`exhibition_title` varchar(255)
,`poster_url` varchar(500)
,`staff_user_id` int
,`starts_at` datetime
,`total_reviews` bigint
,`total_visitors` bigint
,`unit_code` varchar(30)
,`unit_id` int
,`unit_name` varchar(255)
,`unit_type` enum('activity','booth')
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_stats_score_by_question`
-- (See below for the actual view)
--
CREATE TABLE `v_stats_score_by_question` (
`average_score` decimal(13,2)
,`exhibition_name` varchar(255)
,`target_name` varchar(255)
,`topic` text
,`total_voters` bigint
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_units_by_exhibition`
-- (See below for the actual view)
--
CREATE TABLE `v_units_by_exhibition` (
`ends_at` datetime
,`exhibition_code` varchar(20)
,`exhibition_id` int
,`exhibition_title` varchar(255)
,`poster_url` varchar(500)
,`staff_names` text
,`starts_at` datetime
,`unit_code` varchar(30)
,`unit_id` int
,`unit_name` varchar(255)
,`unit_type` enum('activity','booth')
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_units_checkins`
-- (See below for the actual view)
--
CREATE TABLE `v_units_checkins` (
`checkin_at` timestamp
,`checkin_id` int
,`exhibition_code` varchar(20)
,`exhibition_title` varchar(255)
,`unit_code` varchar(30)
,`unit_name` varchar(255)
,`user_name` varchar(255)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_unit_feedback`
-- (See below for the actual view)
--
CREATE TABLE `v_unit_feedback` (
`comment` text
,`created_at` timestamp
,`exhibition_id` int
,`exhibition_name` varchar(255)
,`question_topic` text
,`score` int
,`submission_id` int
,`unit_id` int
,`unit_name` varchar(255)
,`user_id` int
,`user_name` varchar(255)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_user_exhibition_checkin_status`
-- (See below for the actual view)
--
CREATE TABLE `v_user_exhibition_checkin_status` (
`exhibition_code` varchar(20)
,`exhibition_id` int
,`exhibition_title` varchar(255)
,`is_checked_in` int
,`unit_code` varchar(30)
,`unit_id` int
,`unit_name` varchar(255)
,`unit_type` enum('activity','booth')
,`user_id` int
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
-- Indexes for table `exhibition_announcements`
--
ALTER TABLE `exhibition_announcements`
  ADD PRIMARY KEY (`announcement_id`),
  ADD KEY `fk_announce_exhibition` (`exhibition_id`);

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
-- Indexes for table `questions_template`
--
ALTER TABLE `questions_template`
  ADD PRIMARY KEY (`qt_id`);

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
-- Indexes for table `set_question_mapping`
--
ALTER TABLE `set_question_mapping`
  ADD PRIMARY KEY (`set_id`,`qt_id`),
  ADD KEY `fk_sqm_qt` (`qt_id`);

--
-- Indexes for table `survey_answers`
--
ALTER TABLE `survey_answers`
  ADD PRIMARY KEY (`answer_id`),
  ADD KEY `fk_ans_sub` (`submission_id`),
  ADD KEY `fk_ans_mapping` (`set_id`,`qt_id`);

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
  MODIFY `template_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `exhibitions`
--
ALTER TABLE `exhibitions`
  MODIFY `exhibition_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT for table `exhibition_announcements`
--
ALTER TABLE `exhibition_announcements`
  MODIFY `announcement_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `normal_users`
--
ALTER TABLE `normal_users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `organizer_users`
--
ALTER TABLE `organizer_users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `questions_template`
--
ALTER TABLE `questions_template`
  MODIFY `qt_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `question_sets`
--
ALTER TABLE `question_sets`
  MODIFY `set_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=107;

--
-- AUTO_INCREMENT for table `registrations`
--
ALTER TABLE `registrations`
  MODIFY `registration_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `survey_answers`
--
ALTER TABLE `survey_answers`
  MODIFY `answer_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

--
-- AUTO_INCREMENT for table `survey_submissions`
--
ALTER TABLE `survey_submissions`
  MODIFY `submission_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1020;

--
-- AUTO_INCREMENT for table `units`
--
ALTER TABLE `units`
  MODIFY `unit_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `units_checkins`
--
ALTER TABLE `units_checkins`
  MODIFY `checkin_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

-- --------------------------------------------------------

--
-- Structure for view `v_certificate_templates`
--
DROP TABLE IF EXISTS `v_certificate_templates`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_certificate_templates`  AS SELECT `ct`.`template_id` AS `template_id`, `ct`.`exhibition_id` AS `exhibition_id`, `e`.`exhibition_code` AS `exhibition_code`, `e`.`title` AS `exhibition_title`, `e`.`organizer_name` AS `organizer_name`, `ct`.`background_url` AS `background_url`, `ct`.`layout_config` AS `layout_config`, `ct`.`created_at` AS `created_at`, `ct`.`updated_at` AS `updated_at` FROM (`certificate_templates` `ct` join `exhibitions` `e` on((`ct`.`exhibition_id` = `e`.`exhibition_id`))) ;

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

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_exhibition_feedback`  AS SELECT `s`.`submission_id` AS `submission_id`, `e`.`exhibition_id` AS `exhibition_id`, `e`.`title` AS `exhibition_name`, `u`.`user_id` AS `user_id`, `u`.`full_name` AS `user_name`, `qt`.`content` AS `question_topic`, `a`.`score` AS `score`, `s`.`comment` AS `comment`, `s`.`created_at` AS `created_at` FROM ((((`survey_submissions` `s` join `exhibitions` `e` on((`s`.`exhibition_id` = `e`.`exhibition_id`))) join `normal_users` `u` on((`s`.`user_id` = `u`.`user_id`))) join `survey_answers` `a` on((`s`.`submission_id` = `a`.`submission_id`))) join `questions_template` `qt` on((`a`.`qt_id` = `qt`.`qt_id`))) WHERE (`s`.`unit_id` is null) ;

-- --------------------------------------------------------

--
-- Structure for view `v_exhibition_with_registrations`
--
DROP TABLE IF EXISTS `v_exhibition_with_registrations`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_exhibition_with_registrations`  AS SELECT `e`.`exhibition_id` AS `exhibition_id`, `e`.`exhibition_code` AS `exhibition_code`, `e`.`title` AS `title`, count(`r`.`registration_id`) AS `total_registrations` FROM (`exhibitions` `e` left join `registrations` `r` on((`e`.`exhibition_id` = `r`.`exhibition_id`))) GROUP BY `e`.`exhibition_id`, `e`.`exhibition_code`, `e`.`title` ;

-- --------------------------------------------------------

--
-- Structure for view `v_my_event_surveys`
--
DROP TABLE IF EXISTS `v_my_event_surveys`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_my_event_surveys`  AS SELECT `r`.`user_id` AS `user_id`, `r`.`registration_id` AS `registration_id`, `e`.`exhibition_id` AS `exhibition_id`, `e`.`title` AS `title`, `e`.`exhibition_code` AS `exhibition_code`, `e`.`location` AS `location`, `e`.`start_date` AS `start_date`, `e`.`end_date` AS `end_date`, `e`.`picture_path` AS `picture_path`, `e`.`status` AS `status`, `e`.`exhibition_set_id` AS `exhibition_set_id`, `r`.`registered_at` AS `registered_at`, (case when (`ss`.`submission_id` is not null) then 1 else 0 end) AS `survey_completed` FROM ((`registrations` `r` join `exhibitions` `e` on((`r`.`exhibition_id` = `e`.`exhibition_id`))) left join `survey_submissions` `ss` on(((`ss`.`user_id` = `r`.`user_id`) and (`ss`.`exhibition_id` = `r`.`exhibition_id`) and (`ss`.`unit_id` is null)))) ;

-- --------------------------------------------------------

--
-- Structure for view `v_org_dashboard_kpis`
--
DROP TABLE IF EXISTS `v_org_dashboard_kpis`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_org_dashboard_kpis`  AS SELECT `e`.`exhibition_id` AS `exhibition_id`, `e`.`title` AS `title`, `e`.`status` AS `status`, `e`.`location` AS `location`, `e`.`description` AS `description`, (select count(0) from `registrations` `r` where (`r`.`exhibition_id` = `e`.`exhibition_id`)) AS `total_registrations`, (select count(0) from `units` `u` where (`u`.`exhibition_id` = `e`.`exhibition_id`)) AS `total_units`, (select count(0) from `units_checkins` `uc` where (`uc`.`exhibition_id` = `e`.`exhibition_id`)) AS `total_checkins`, (select round(avg(`a`.`score`),2) from (`survey_submissions` `s` join `survey_answers` `a` on((`s`.`submission_id` = `a`.`submission_id`))) where ((`s`.`exhibition_id` = `e`.`exhibition_id`) and (`s`.`unit_id` is null))) AS `exhibition_avg_score` FROM `exhibitions` AS `e` ;

-- --------------------------------------------------------

--
-- Structure for view `v_org_exhibition_feedback_stats`
--
DROP TABLE IF EXISTS `v_org_exhibition_feedback_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_org_exhibition_feedback_stats`  AS SELECT `s`.`exhibition_id` AS `exhibition_id`, `qt`.`content` AS `topic`, round(avg(`a`.`score`),2) AS `score` FROM ((`survey_submissions` `s` join `survey_answers` `a` on((`s`.`submission_id` = `a`.`submission_id`))) join `questions_template` `qt` on((`a`.`qt_id` = `qt`.`qt_id`))) WHERE (`s`.`unit_id` is null) GROUP BY `s`.`exhibition_id`, `qt`.`qt_id`, `qt`.`content` ;

-- --------------------------------------------------------

--
-- Structure for view `v_org_unit_stats`
--
DROP TABLE IF EXISTS `v_org_unit_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_org_unit_stats`  AS SELECT `u`.`exhibition_id` AS `exhibition_id`, `u`.`unit_id` AS `id`, `u`.`unit_name` AS `name`, `u`.`unit_type` AS `type`, (select count(0) from `units_checkins` `uc` where (`uc`.`unit_id` = `u`.`unit_id`)) AS `checkins`, (select round(avg(`a`.`score`),2) from (`survey_submissions` `s` join `survey_answers` `a` on((`s`.`submission_id` = `a`.`submission_id`))) where (`s`.`unit_id` = `u`.`unit_id`)) AS `rating` FROM `units` AS `u` ;

-- --------------------------------------------------------

--
-- Structure for view `v_registrations`
--
DROP TABLE IF EXISTS `v_registrations`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_registrations`  AS SELECT `r`.`registration_id` AS `registration_id`, `e`.`exhibition_code` AS `exhibition_code`, `e`.`title` AS `exhibition_title`, `u`.`full_name` AS `user_name`, `r`.`registered_at` AS `registered_at` FROM ((`registrations` `r` join `exhibitions` `e` on((`r`.`exhibition_id` = `e`.`exhibition_id`))) join `normal_users` `u` on((`r`.`user_id` = `u`.`user_id`))) ;

-- --------------------------------------------------------

--
-- Structure for view `v_staff_dashboard_question_scores`
--
DROP TABLE IF EXISTS `v_staff_dashboard_question_scores`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_staff_dashboard_question_scores`  AS SELECT `us`.`staff_user_id` AS `staff_user_id`, `u`.`unit_id` AS `unit_id`, `u`.`unit_name` AS `unit_name`, `qt`.`qt_id` AS `qt_id`, `qt`.`content` AS `question_topic`, count(`a`.`score`) AS `response_count`, cast(avg(`a`.`score`) as decimal(10,2)) AS `average_score` FROM ((((`unit_staffs` `us` join `units` `u` on((`us`.`unit_id` = `u`.`unit_id`))) join `survey_submissions` `s` on((`u`.`unit_id` = `s`.`unit_id`))) join `survey_answers` `a` on((`s`.`submission_id` = `a`.`submission_id`))) join `questions_template` `qt` on((`a`.`qt_id` = `qt`.`qt_id`))) GROUP BY `us`.`staff_user_id`, `u`.`unit_id`, `u`.`unit_name`, `qt`.`qt_id`, `qt`.`content` ORDER BY `average_score` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `v_staff_dashboard_stats`
--
DROP TABLE IF EXISTS `v_staff_dashboard_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_staff_dashboard_stats`  AS SELECT `us`.`staff_user_id` AS `staff_user_id`, `u`.`unit_id` AS `unit_id`, `u`.`unit_code` AS `unit_code`, `u`.`unit_name` AS `unit_name`, `u`.`unit_type` AS `unit_type`, `u`.`description` AS `description`, `u`.`description_delta` AS `description_delta`, `u`.`poster_url` AS `poster_url`, `u`.`detail_pdf_url` AS `detail_pdf_url`, `u`.`starts_at` AS `starts_at`, `u`.`ends_at` AS `ends_at`, `e`.`exhibition_id` AS `exhibition_id`, `e`.`title` AS `exhibition_title`, `e`.`location` AS `exhibition_location`, `e`.`status` AS `exhibition_status`, coalesce(`checkin_stats`.`total_visitors`,0) AS `total_visitors`, coalesce(`review_stats`.`review_count`,0) AS `total_reviews`, coalesce(round(`review_stats`.`avg_score`,2),0.00) AS `average_score` FROM ((((`unit_staffs` `us` join `units` `u` on((`us`.`unit_id` = `u`.`unit_id`))) join `exhibitions` `e` on((`u`.`exhibition_id` = `e`.`exhibition_id`))) left join (select `units_checkins`.`unit_id` AS `unit_id`,count(`units_checkins`.`checkin_id`) AS `total_visitors` from `units_checkins` group by `units_checkins`.`unit_id`) `checkin_stats` on((`u`.`unit_id` = `checkin_stats`.`unit_id`))) left join (select `s`.`unit_id` AS `unit_id`,count(distinct `s`.`submission_id`) AS `review_count`,avg(`a`.`score`) AS `avg_score` from (`survey_submissions` `s` join `survey_answers` `a` on((`s`.`submission_id` = `a`.`submission_id`))) where (`s`.`unit_id` is not null) group by `s`.`unit_id`) `review_stats` on((`u`.`unit_id` = `review_stats`.`unit_id`))) ;

-- --------------------------------------------------------

--
-- Structure for view `v_stats_score_by_question`
--
DROP TABLE IF EXISTS `v_stats_score_by_question`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_stats_score_by_question`  AS SELECT `e`.`title` AS `exhibition_name`, coalesce(`un`.`unit_name`,'Event Overview') AS `target_name`, `qt`.`content` AS `topic`, count(distinct `s`.`submission_id`) AS `total_voters`, round(avg(`a`.`score`),2) AS `average_score` FROM ((((`survey_answers` `a` join `questions_template` `qt` on((`a`.`qt_id` = `qt`.`qt_id`))) join `survey_submissions` `s` on((`a`.`submission_id` = `s`.`submission_id`))) join `exhibitions` `e` on((`s`.`exhibition_id` = `e`.`exhibition_id`))) left join `units` `un` on((`s`.`unit_id` = `un`.`unit_id`))) GROUP BY `e`.`exhibition_id`, `un`.`unit_id`, `qt`.`qt_id` ;

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

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_unit_feedback`  AS SELECT `s`.`submission_id` AS `submission_id`, `e`.`exhibition_id` AS `exhibition_id`, `e`.`title` AS `exhibition_name`, `un`.`unit_id` AS `unit_id`, `un`.`unit_name` AS `unit_name`, `u`.`user_id` AS `user_id`, `u`.`full_name` AS `user_name`, `qt`.`content` AS `question_topic`, `a`.`score` AS `score`, `s`.`comment` AS `comment`, `s`.`created_at` AS `created_at` FROM (((((`survey_submissions` `s` join `exhibitions` `e` on((`s`.`exhibition_id` = `e`.`exhibition_id`))) join `units` `un` on((`s`.`unit_id` = `un`.`unit_id`))) join `normal_users` `u` on((`s`.`user_id` = `u`.`user_id`))) join `survey_answers` `a` on((`s`.`submission_id` = `a`.`submission_id`))) join `questions_template` `qt` on((`a`.`qt_id` = `qt`.`qt_id`))) WHERE (`s`.`unit_id` is not null) ;

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
-- Constraints for table `exhibitions`
--
ALTER TABLE `exhibitions`
  ADD CONSTRAINT `fk_exh_exhibition_set` FOREIGN KEY (`exhibition_set_id`) REFERENCES `question_sets` (`set_id`),
  ADD CONSTRAINT `fk_exh_unit_set` FOREIGN KEY (`unit_set_id`) REFERENCES `question_sets` (`set_id`);

--
-- Constraints for table `exhibition_announcements`
--
ALTER TABLE `exhibition_announcements`
  ADD CONSTRAINT `fk_announce_exhibition` FOREIGN KEY (`exhibition_id`) REFERENCES `exhibitions` (`exhibition_id`) ON DELETE CASCADE;

--
-- Constraints for table `registrations`
--
ALTER TABLE `registrations`
  ADD CONSTRAINT `fk_reg_exhibition` FOREIGN KEY (`exhibition_id`) REFERENCES `exhibitions` (`exhibition_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reg_user` FOREIGN KEY (`user_id`) REFERENCES `normal_users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `set_question_mapping`
--
ALTER TABLE `set_question_mapping`
  ADD CONSTRAINT `fk_sqm_qt` FOREIGN KEY (`qt_id`) REFERENCES `questions_template` (`qt_id`),
  ADD CONSTRAINT `fk_sqm_set` FOREIGN KEY (`set_id`) REFERENCES `question_sets` (`set_id`) ON DELETE CASCADE;

--
-- Constraints for table `survey_answers`
--
ALTER TABLE `survey_answers`
  ADD CONSTRAINT `fk_ans_mapping` FOREIGN KEY (`set_id`,`qt_id`) REFERENCES `set_question_mapping` (`set_id`, `qt_id`),
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
  ADD CONSTRAINT `fk_unit_additional_questions` FOREIGN KEY (`additional_question_set_id`) REFERENCES `question_sets` (`set_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_units_exhibition` FOREIGN KEY (`exhibition_id`) REFERENCES `exhibitions` (`exhibition_id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
    AND NOW() BETWEEN start_date AND end_date;

  -- set ended เมื่อจบแล้ว
  UPDATE exhibitions
  SET status = 'ended'
  WHERE status IN ('published','ongoing')
    AND NOW() > end_date;
END$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
