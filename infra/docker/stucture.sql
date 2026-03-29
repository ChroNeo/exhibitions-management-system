-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: Mar 01, 2026 at 09:21 AM
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

-- --------------------------------------------------------

--
-- Table structure for table `questions_template`
--

CREATE TABLE `questions_template` (
  `qt_id` int NOT NULL,
  `content` text NOT NULL,
  `category` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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

-- --------------------------------------------------------

--
-- Table structure for table `set_question_mapping`
--

CREATE TABLE `set_question_mapping` (
  `set_id` int NOT NULL,
  `qt_id` int NOT NULL,
  `sort_order` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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

-- --------------------------------------------------------

--
-- Table structure for table `survey_submissions`
--

CREATE TABLE `survey_submissions` (
  `submission_id` int NOT NULL,
  `exhibition_id` int NOT NULL,
  `unit_id` int DEFAULT NULL COMMENT 'ถ้า NULL แสดงว่าประเมินงาน, ถ้ามีค่าแสดงว่าประเมินบูธ',
  `comment` text,
  `created_at` date DEFAULT (CURRENT_DATE)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `survey_tracking`
--

CREATE TABLE `survey_tracking` (
  `tracking_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `exhibition_id` int NOT NULL,
  `unit_id` int NOT NULL DEFAULT '0' COMMENT '0 = exhibition-level survey',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`tracking_id`),
  UNIQUE KEY `uq_user_exh_unit` (`user_id`,`exhibition_id`,`unit_id`),
  KEY `fk_tracking_user` (`user_id`),
  KEY `fk_tracking_exh` (`exhibition_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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

-- --------------------------------------------------------

--
-- Table structure for table `unit_staffs`
--

CREATE TABLE `unit_staffs` (
  `unit_id` int NOT NULL,
  `staff_user_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
,`created_at` date
,`exhibition_id` int
,`exhibition_name` varchar(255)
,`question_topic` text
,`score` int
,`submission_id` int
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
`exhibition_avg_score` decimal(13,2)
,`exhibition_id` int
,`description` mediumtext
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
,`created_at` date
,`exhibition_id` int
,`exhibition_name` varchar(255)
,`question_topic` text
,`score` int
,`submission_id` int
,`unit_id` int
,`unit_name` varchar(255)
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
  ADD KEY `fk_sub_unit` (`unit_id`);

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
  MODIFY `template_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `exhibitions`
--
ALTER TABLE `exhibitions`
  MODIFY `exhibition_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `exhibition_announcements`
--
ALTER TABLE `exhibition_announcements`
  MODIFY `announcement_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `normal_users`
--
ALTER TABLE `normal_users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `organizer_users`
--
ALTER TABLE `organizer_users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `questions_template`
--
ALTER TABLE `questions_template`
  MODIFY `qt_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `question_sets`
--
ALTER TABLE `question_sets`
  MODIFY `set_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `registrations`
--
ALTER TABLE `registrations`
  MODIFY `registration_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `survey_answers`
--
ALTER TABLE `survey_answers`
  MODIFY `answer_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `survey_submissions`
--
ALTER TABLE `survey_submissions`
  MODIFY `submission_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `units`
--
ALTER TABLE `units`
  MODIFY `unit_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `units_checkins`
--
ALTER TABLE `units_checkins`
  MODIFY `checkin_id` int NOT NULL AUTO_INCREMENT;

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

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_exhibition_feedback`  AS SELECT `s`.`submission_id` AS `submission_id`, `e`.`exhibition_id` AS `exhibition_id`, `e`.`title` AS `exhibition_name`, `qt`.`content` AS `question_topic`, `a`.`score` AS `score`, `s`.`comment` AS `comment`, `s`.`created_at` AS `created_at` FROM (((`survey_submissions` `s` join `exhibitions` `e` on((`s`.`exhibition_id` = `e`.`exhibition_id`))) join `survey_answers` `a` on((`s`.`submission_id` = `a`.`submission_id`))) join `questions_template` `qt` on((`a`.`qt_id` = `qt`.`qt_id`))) WHERE (`s`.`unit_id` is null) ;

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

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_my_event_surveys`  AS SELECT `r`.`user_id` AS `user_id`, `r`.`registration_id` AS `registration_id`, `e`.`exhibition_id` AS `exhibition_id`, `e`.`title` AS `title`, `e`.`exhibition_code` AS `exhibition_code`, `e`.`location` AS `location`, `e`.`start_date` AS `start_date`, `e`.`end_date` AS `end_date`, `e`.`picture_path` AS `picture_path`, `e`.`status` AS `status`, `e`.`exhibition_set_id` AS `exhibition_set_id`, `r`.`registered_at` AS `registered_at`, (case when (`st`.`tracking_id` is not null) then 1 else 0 end) AS `survey_completed` FROM ((`registrations` `r` join `exhibitions` `e` on((`r`.`exhibition_id` = `e`.`exhibition_id`))) left join `survey_tracking` `st` on(((`st`.`user_id` = `r`.`user_id`) and (`st`.`exhibition_id` = `r`.`exhibition_id`) and (`st`.`unit_id` = 0)))) ;

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

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_unit_feedback`  AS SELECT `s`.`submission_id` AS `submission_id`, `e`.`exhibition_id` AS `exhibition_id`, `e`.`title` AS `exhibition_name`, `un`.`unit_id` AS `unit_id`, `un`.`unit_name` AS `unit_name`, `qt`.`content` AS `question_topic`, `a`.`score` AS `score`, `s`.`comment` AS `comment`, `s`.`created_at` AS `created_at` FROM ((((`survey_submissions` `s` join `exhibitions` `e` on((`s`.`exhibition_id` = `e`.`exhibition_id`))) join `units` `un` on((`s`.`unit_id` = `un`.`unit_id`))) join `survey_answers` `a` on((`s`.`submission_id` = `a`.`submission_id`))) join `questions_template` `qt` on((`a`.`qt_id` = `qt`.`qt_id`))) WHERE (`s`.`unit_id` is not null) ;

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
  ADD CONSTRAINT `fk_sub_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`unit_id`) ON DELETE CASCADE;

--
-- Constraints for table `survey_tracking`
--
ALTER TABLE `survey_tracking`
  ADD CONSTRAINT `fk_tracking_user` FOREIGN KEY (`user_id`) REFERENCES `normal_users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_tracking_exh` FOREIGN KEY (`exhibition_id`) REFERENCES `exhibitions` (`exhibition_id`) ON DELETE CASCADE;

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
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
