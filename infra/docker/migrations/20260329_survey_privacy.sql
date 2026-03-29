START TRANSACTION;

CREATE TABLE IF NOT EXISTS `survey_tracking` (
  `tracking_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `exhibition_id` int NOT NULL,
  `unit_id` int NOT NULL DEFAULT '0' COMMENT '0 = exhibition-level survey',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`tracking_id`),
  UNIQUE KEY `uq_user_exh_unit` (`user_id`,`exhibition_id`,`unit_id`),
  KEY `fk_tracking_user` (`user_id`),
  KEY `fk_tracking_exh` (`exhibition_id`),
  CONSTRAINT `fk_tracking_exh` FOREIGN KEY (`exhibition_id`) REFERENCES `exhibitions` (`exhibition_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tracking_user` FOREIGN KEY (`user_id`) REFERENCES `normal_users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP PROCEDURE IF EXISTS `migrate_survey_privacy`;

DELIMITER $$
CREATE PROCEDURE `migrate_survey_privacy`()
BEGIN
  IF EXISTS (
    SELECT 1
    FROM `survey_submissions`
    GROUP BY `user_id`, `exhibition_id`, COALESCE(`unit_id`, 0)
    HAVING COUNT(*) > 1
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Duplicate survey_submissions rows found for the same (user_id, exhibition_id, unit_id). Resolve duplicates before running this migration.';
  END IF;

  INSERT INTO `survey_tracking` (`user_id`, `exhibition_id`, `unit_id`, `created_at`)
  SELECT
    `user_id`,
    `exhibition_id`,
    COALESCE(`unit_id`, 0),
    `created_at`
  FROM `survey_submissions`;

  ALTER TABLE `survey_submissions`
    DROP FOREIGN KEY `fk_sub_user`;

  ALTER TABLE `survey_submissions`
    DROP COLUMN `user_id`,
    MODIFY `created_at` DATE DEFAULT (CURRENT_DATE);

  DROP VIEW IF EXISTS `v_exhibition_feedback`;
  CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_exhibition_feedback` AS
    SELECT
      `s`.`submission_id` AS `submission_id`,
      `e`.`exhibition_id` AS `exhibition_id`,
      `e`.`title` AS `exhibition_name`,
      `qt`.`content` AS `question_topic`,
      `a`.`score` AS `score`,
      `s`.`comment` AS `comment`,
      `s`.`created_at` AS `created_at`
    FROM `survey_submissions` `s`
      JOIN `exhibitions` `e` ON (`s`.`exhibition_id` = `e`.`exhibition_id`)
      JOIN `survey_answers` `a` ON (`s`.`submission_id` = `a`.`submission_id`)
      JOIN `questions_template` `qt` ON (`a`.`qt_id` = `qt`.`qt_id`)
    WHERE (`s`.`unit_id` IS NULL);

  DROP VIEW IF EXISTS `v_my_event_surveys`;
  CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_my_event_surveys` AS
    SELECT
      `r`.`user_id` AS `user_id`,
      `r`.`registration_id` AS `registration_id`,
      `e`.`exhibition_id` AS `exhibition_id`,
      `e`.`title` AS `title`,
      `e`.`exhibition_code` AS `exhibition_code`,
      `e`.`location` AS `location`,
      `e`.`start_date` AS `start_date`,
      `e`.`end_date` AS `end_date`,
      `e`.`picture_path` AS `picture_path`,
      `e`.`status` AS `status`,
      `e`.`exhibition_set_id` AS `exhibition_set_id`,
      `r`.`registered_at` AS `registered_at`,
      (CASE WHEN (`st`.`tracking_id` IS NOT NULL) THEN 1 ELSE 0 END) AS `survey_completed`
    FROM `registrations` `r`
      JOIN `exhibitions` `e` ON (`r`.`exhibition_id` = `e`.`exhibition_id`)
      LEFT JOIN `survey_tracking` `st`
        ON ((`st`.`user_id` = `r`.`user_id`)
          AND (`st`.`exhibition_id` = `r`.`exhibition_id`)
          AND (`st`.`unit_id` = 0));

  DROP VIEW IF EXISTS `v_unit_feedback`;
  CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `v_unit_feedback` AS
    SELECT
      `s`.`submission_id` AS `submission_id`,
      `e`.`exhibition_id` AS `exhibition_id`,
      `e`.`title` AS `exhibition_name`,
      `un`.`unit_id` AS `unit_id`,
      `un`.`unit_name` AS `unit_name`,
      `qt`.`content` AS `question_topic`,
      `a`.`score` AS `score`,
      `s`.`comment` AS `comment`,
      `s`.`created_at` AS `created_at`
    FROM `survey_submissions` `s`
      JOIN `exhibitions` `e` ON (`s`.`exhibition_id` = `e`.`exhibition_id`)
      JOIN `units` `un` ON (`s`.`unit_id` = `un`.`unit_id`)
      JOIN `survey_answers` `a` ON (`s`.`submission_id` = `a`.`submission_id`)
      JOIN `questions_template` `qt` ON (`a`.`qt_id` = `qt`.`qt_id`)
    WHERE (`s`.`unit_id` IS NOT NULL);
END $$
DELIMITER ;

CALL `migrate_survey_privacy`();

DROP PROCEDURE IF EXISTS `migrate_survey_privacy`;

COMMIT;
