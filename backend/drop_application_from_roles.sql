-- Migration to remove application relationship from Roles table
-- Run this via SQLPlus manually

-- Drop the APPLICATION_ID column from ROLES table
ALTER TABLE ROLES DROP COLUMN APPLICATION_ID;
