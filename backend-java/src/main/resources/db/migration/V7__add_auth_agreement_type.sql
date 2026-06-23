-- Add 'agreement' value to auth_type enum for data usage agreement
ALTER TYPE auth_type ADD VALUE IF NOT EXISTS 'agreement';
