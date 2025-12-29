-- Script to update the database for the new email-based authentication.
-- This will change the `users` table in your existing database.

-- 1. Rename the 'username' column to 'email'.
ALTER TABLE `users` CHANGE COLUMN `username` `email` VARCHAR(50) NOT NULL;

-- 2. Update the existing 'admin' user to use an email address.
-- This assumes your current admin username is 'admin'.
-- If you have a different admin username, please change 'admin' in the line below.
UPDATE `users` SET `email` = 'admin@example.com' WHERE `email` = 'admin';

-- Note: This script does not change any passwords.
