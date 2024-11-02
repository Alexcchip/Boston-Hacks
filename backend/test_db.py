import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

def test_connection():
    # Get connection parameters from environment variables
    params = {
        'dbname': os.getenv('DB_NAME'),
        'user': os.getenv('DB_USER'),
        'password': os.getenv('DB_PASSWORD'),
        'host': os.getenv('DB_HOST'),
        'port': os.getenv('DB_PORT', '5432'),
        'connect_timeout': 10
    }
    
    try:
        print("Attempting to connect to the database...")
        print(f"Host: {params['host']}")
        print(f"Database: {params['dbname']}")
        print(f"User: {params['user']}")
        
        conn = psycopg2.connect(**params)
        cur = conn.cursor()
        
        # Simple test query
        cur.execute('SELECT version();')
        db_version = cur.fetchone()
        
        print("Successfully connected to the database!")
        print(f"PostgreSQL version: {db_version[0]}")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error connecting to the database: {str(e)}")

if __name__ == "__main__":
    test_connection()