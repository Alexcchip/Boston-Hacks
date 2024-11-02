from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from datetime import timedelta
from models import db, User
from dotenv import load_dotenv
import os
import sys
from sqlalchemy import text
from flasgger import Swagger

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Initialize Swagger
 

    # Rest of your setup...
    # JWT configuration, database setup, etc.

    return app

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configure CORS
    CORS(app)

    
    # Database Configuration for PostgreSQL
    DB_USER = os.getenv('DB_USER')
    DB_PASSWORD = os.getenv('DB_PASSWORD')
    DB_HOST = os.getenv('DB_HOST')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_NAME = os.getenv('DB_NAME')
    
    # Construct the PostgreSQL connection URI
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        'pool_size': 5,
        'pool_timeout': 30,
        'pool_recycle': 1800,
        'pool_pre_ping': True,
        'connect_args': {
            'connect_timeout': 10,
            'keepalives': 1,
            'keepalives_idle': 30,
            'keepalives_interval': 10,
            'keepalives_count': 5
        }
    }
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    # JWT Configuration
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "default-secret-key")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
    
    # Initialize extensions
    jwt = JWTManager(app)
    db.init_app(app)

    swagger = Swagger(app)  

    # # Create tables
    # try:
    #     with app.app_context():
    #         db.create_all()
    #         print("Successfully connected to the database and created tables.")
    # except Exception as e:
    #     print(f"Error connecting to database: {str(e)}")
    #     sys.exit(1)
    
    return app

app = create_app()

@app.route("/api/register", methods=["POST"])
def register():
    """
    Register a new user
    ---
    tags:
      - Users
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
            - username
          properties:
            email:
              type: string
            password:
              type: string
            username:
              type: string
    responses:
      201:
        description: User registered successfully
      400:
        description: Invalid input or user already exists
      500:
        description: Server error
    """

    data = request.json
    email = data.get("email")
    username = data.get("username")
    password = data.get("password")
    
    # Check if required fields are provided
    if not email or not password or not username:
        return jsonify({"error": "Email, username, and password are required"}), 400
        
    # Check if the email or username is already registered
    if User.query.filter_by(email=email).first() or User.query.filter_by(username=username).first():
        return jsonify({"error": "Email or username already registered"}), 400

    try:
        hashed_password = generate_password_hash(password)
        new_user = User(email=email, username=username, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route("/api/login", methods=["POST"])
def login():
    """
    User login
    ---
    tags:
      - Users
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
          properties:
            email:
              type: string
            password:
              type: string
    responses:
      200:
        description: Login successful, token returned
      400:
        description: Missing email or password
      401:
        description: Invalid email or password
      500:
        description: Server error
    """
    data = request.json
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid email or password"}), 401
        
    access_token = create_access_token(identity=email)
    return jsonify({"access_token": access_token, "email": email})

@app.route("/api/protected", methods=["GET"])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    user = User.query.filter_by(email=current_user).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "message": f"Hello {user.email}! This is a protected route.",
        "user_since": user.created_at.strftime("%Y-%m-%d %H:%M:%S"),
    })

@app.route("/api/users", methods=["GET"])
@jwt_required()
def get_users():
    users = User.query.all()
    return jsonify({"users": [user.to_dict() for user in users]})




# Test database connection
def test_db_connection(app):
    try:
        with app.app_context():
            # Try to execute a simple query
            db.session.execute(text('SELECT 1'))
            print("Database connection successful!")
            return True
    except Exception as e:
        print(f"Database connection failed: {str(e)}")
        return False

if __name__ == "__main__":

    # Test the database connection before starting the server
    if test_db_connection(app):
        app.run(debug=True)
    else:
        print("Exiting due to database connection failure.")
        sys.exit(1)