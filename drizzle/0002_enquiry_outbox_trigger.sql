-- Queue the staff alert in the same statement that stores the enquiry, so an
-- accepted enquiry can never exist without its alert. Spam is not alerted.
CREATE TRIGGER IF NOT EXISTS `enquiries_outbox_after_insert`
AFTER INSERT ON `enquiries`
WHEN NEW.`status` <> 'spam'
BEGIN
  INSERT OR IGNORE INTO `outbox_events`
    (`event_key`, `type`, `enquiry_id`, `state`, `attempts`, `next_attempt_at`, `created_at`, `updated_at`)
  VALUES
    ('enquiry.notify:' || NEW.`id`, 'enquiry.notify', NEW.`id`, 'pending', 0,
     CAST(strftime('%s', 'now') AS INTEGER) * 1000,
     CAST(strftime('%s', 'now') AS INTEGER) * 1000,
     CAST(strftime('%s', 'now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
-- The pipeline stages changed: answered becomes contacted, closed becomes lost.
UPDATE `enquiries` SET `status` = 'contacted' WHERE `status` = 'answered';
--> statement-breakpoint
UPDATE `enquiries` SET `status` = 'lost' WHERE `status` = 'closed';
