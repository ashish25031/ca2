-- Azure SQL Database Schema for Secure File Sharing System

-- 1. Users Table
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);

-- 2. Files Table
CREATE TABLE Files (
    id INT IDENTITY(1,1) PRIMARY KEY,
    filename NVARCHAR(255) NOT NULL,
    filepath NVARCHAR(500) NOT NULL,
    filesize BIGINT NOT NULL,
    uploaded_by INT NOT NULL,
    upload_date DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (uploaded_by) REFERENCES Users(id)
);

-- 3. SharedLinks Table
CREATE TABLE SharedLinks (
    id INT IDENTITY(1,1) PRIMARY KEY,
    file_id INT NOT NULL,
    share_token NVARCHAR(255) NOT NULL UNIQUE,
    access_password NVARCHAR(255) NULL,
    expiry_time DATETIME2 NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (file_id) REFERENCES Files(id) ON DELETE CASCADE
);
