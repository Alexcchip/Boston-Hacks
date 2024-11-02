import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Retrieve database configuration from environment variables
DB_NAME = os.getenv("DB_NAME")
AWS_REGION = os.getenv("AWS_REGION")
DB_ENDPOINT = os.getenv("DB_ENDPOINT")
DB_PORT = os.getenv("DB_PORT")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

# Connect to the PostgreSQL database
connection = psycopg2.connect(
    host=DB_ENDPOINT,
    port=DB_PORT,
    database=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD
)

cursor = connection.cursor()

try:
    # Create Teams table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Teams (
        team_id SERIAL PRIMARY KEY,
        team_name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        join_id VARCHAR(10) UNIQUE
    );
    """)

    # Create Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Users (
        user_id SERIAL PRIMARY KEY,
        email VARCHAR(320) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        team_id INT REFERENCES Teams(team_id) ON DELETE SET NULL
    );
    """)

    # Create Tasks table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Tasks (
        task_id SERIAL PRIMARY KEY,
        task_name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        points INT DEFAULT 0
    );
    """)

    # Create UserTasks table to track task completion by users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS UserTasks (
        user_task_id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
        task_id INT NOT NULL REFERENCES Tasks(task_id) ON DELETE CASCADE,
        photo_url VARCHAR(255),
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Create UserPost table for posts by users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS UserPost (
        post_id SERIAL PRIMARY KEY,
        caption TEXT,
        posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        username VARCHAR(100) NOT NULL,
        photo_link VARCHAR(100),
        user_id INT REFERENCES Users(user_id) ON DELETE CASCADE
    );
    """)

    # Commit changes
    connection.commit()
    print("Tables created successfully.")
except Exception as e:
    print("Error connecting to the database:", e)

finally:
    cursor.close()
    connection.close()
    print("Database connection closed.")
