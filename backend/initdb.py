import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Retrieve database configuration from environment variables
DB_NAME = os.getenv("DB_NAME")
AWS_REGION = os.getenv("AWS_REGION")
DB_ENDPOINT = os.getenv("DB_HOST")
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
    cursor.execute("""
    DROP TABLE IF EXISTS UserTasks;
    """)
  
    
    # # Create Teams table
    # cursor.execute("""
    # CREATE TABLE IF NOT EXISTS Teams (
    #     team_id SERIAL PRIMARY KEY,
    #     team_name VARCHAR(100) UNIQUE NOT NULL,
    #     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    #     join_id VARCHAR(10) UNIQUE
    # );
    # """)

    # # Insert realistic mock data into Teams table
    # cursor.execute("""
    # INSERT INTO Teams (team_name, join_id)
    # VALUES 
    #     ('Mission Control', 'MC2023'),
    #     ('Exploration Unit', 'EXPLR1'),
    #     ('Research Squad', 'RSQ789'),
    #     ('Engineering Crew', 'ENG456');
    # """)

    # # Create Users table
    # cursor.execute("""
    # CREATE TABLE IF NOT EXISTS Users (
    #     user_id SERIAL PRIMARY KEY,
    #     email VARCHAR(320) UNIQUE NOT NULL,
    #     password VARCHAR(255) NOT NULL,
    #     username VARCHAR(100) NOT NULL,
    #     team_id INT REFERENCES Teams(team_id) ON DELETE SET NULL,
    #     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    # );
    # """)
    

    # # Create Tasks table
    # cursor.execute("""
    # CREATE TABLE IF NOT EXISTS Tasks (
    #     task_id SERIAL PRIMARY KEY,
    #     task_name VARCHAR(100) NOT NULL,
    #     description TEXT,
    #     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    #     points INT DEFAULT 0
    # );
    # """)

    # # Insert realistic mock data into Tasks table (day-to-day tasks)
    # cursor.execute("""
    # INSERT INTO Tasks (task_name, description, points)
    # VALUES 
    #     ('Call a Family Member', 'Take 10 minutes to call a loved one back home and catch up.', 10),
    #     ('Take a Shower', 'Refresh yourself with a quick shower and hygiene routine.', 5),
    #     ('Chat with a Team Member', 'Have a casual chat with a teammate to build camaraderie.', 5),
    #     ('Watch a Movie', 'Relax and unwind by watching a movie in the recreation area.', 10),
    #     ('Write in Journal', 'Take some time to reflect and write in your personal journal.', 5),
    #     ('Read a Book', 'Read a chapter of a book or an article you find interesting.', 10),
    #     ('Exercise Routine', 'Complete a 30-minute physical exercise session.', 15),
    #     ('Meditate', 'Spend 10 minutes meditating to maintain mental well-being.', 5),
    #     ('Listen to Music', 'Take a break and listen to some of your favorite tunes.', 5),
    #     ('Video Call with Friends', 'Use the video link to catch up with friends for 15 minutes.', 10);
    # """)

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

    # Commit changes
    connection.commit()
    print("Tables created and realistic mock data inserted successfully.")
except Exception as e:
    print("Error connecting to the database:", e)

finally:
    cursor.close()
    connection.close()
    print("Database connection closed.")
