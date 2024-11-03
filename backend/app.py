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
from models import db, User, Teams
from dotenv import load_dotenv
import os
import sys
from sqlalchemy import text
from flasgger import Swagger
from task_routes import task_routes
from team_routes import team_routes
from user_routes import user_routes
import requests

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configure CORS
    CORS(app, resources={r"/*": {"origins": "*"}}, allow_headers=["Content-Type", "Authorization"])

    
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
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
    
    # Initialize extensions
    jwt = JWTManager(app)
    db.init_app(app)

    app.register_blueprint(task_routes)  # Register the task routes
    app.register_blueprint(team_routes)
    app.register_blueprint(user_routes)
    app.config['SWAGGER'] = {
        'title': 'Astronaut Task API',
        'uiversion': 3,
        'openapi': '3.0.2'
    }

    

    swagger = Swagger(app)  
    
    return app

app = create_app()

@app.route("/api/register", methods=["POST"])
def register():
    """
    Register a new user
    ---
    tags:
      - Users
    requestBody:
      content:
        application/json:
          schema:
            type: object
            required:
              - email
              - password
              - username
              - team_name
            properties:
              email:
                type: string
              password:
                type: string
              username:
                type: string
              team_name:
                type: string
                description: "Name of the team to join or create"
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
    team_name = data.get("team_name")
    
    # Check if required fields are provided
    if not email or not password or not username or not team_name:
        return jsonify({"error": "Email, username, password, and team name are required"}), 400
        
    # Check if the email or username is already registered
    if User.query.filter_by(email=email).first() or User.query.filter_by(username=username).first():
        return jsonify({"error": "Email or username already registered"}), 400

    try:
        # Hash the password
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        
        # Check if the team already exists
        team = Teams.query.filter_by(team_name=team_name).first()
        
        # If the team doesn't exist, create a new team
        if not team:
            team = Teams(team_name=team_name, join_id="TEAM" + str(Teams.query.count() + 1))
            db.session.add(team)
            db.session.flush()  # Ensures team_id is available for new_user assignment
        
        # Create the new user and assign to the team
        new_user = User(email=email, username=username, password=hashed_password, team_id=team.team_id)
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({"message": "User registered successfully", "team": team_name}), 201
    
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
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              email:
                type: string
                description: "The user's email address"
              password:
                type: string
                description: "The user's password"
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
        "email": user.email,
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
    
@app.route("/api/iss-now", methods=["GET"])
@jwt_required()
def get_iss_position():
    try:
        response = requests.get("http://api.open-notify.org/iss-now.json")
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500
    data = response.json()
    return jsonify(data)

if __name__ == "__main__":

    # Test the database connection before starting the server
    if test_db_connection(app):
        app.run(debug=True)
    else:
        print("Exiting due to database connection failure.")
        sys.exit(1)

