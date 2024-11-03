from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import boto3
import os
import uuid
from datetime import datetime
from models import db, User, Tasks, UserTasks
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request
from dotenv import load_dotenv


load_dotenv()

def jwt_optional(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if request.method == 'OPTIONS':
            return fn(*args, **kwargs)
        else:
            verify_jwt_in_request()
            return fn(*args, **kwargs)
    return wrapper

# Initialize S3 client
s3_client = boto3.client(
    "s3",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "astronaut-app-images-bucket")

# Create a Blueprint for task routes
task_routes = Blueprint("task_routes", __name__)


@task_routes.route("/api/tasks/not-completed", methods=["GET"])
@jwt_required()
def get_tasks_not_completed_by_user():
    """
    Get a list of tasks not completed by the current user.
    ---
    tags:
      - Tasks
    responses:
      200:
        description: List of tasks not completed by the user
        content:
          application/json:
            schema:
              type: array
              items:
                type: object
                properties:
                  task_id:
                    type: integer
                    description: ID of the task
                  task_name:
                    type: string
                    description: Name of the task
                  description:
                    type: string
                    description: Description of the task
                  created_at:
                    type: string
                    description: Date and time the task was created
                  points:
                    type: integer
                    description: Points awarded for completing the task
      500:
        description: Server error
    """
    # Get the current user's email from the JWT
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    try:
        # Get tasks not completed by the user
        completed_task_ids = db.session.query(UserTasks.task_id).filter_by(user_id=user.user_id).subquery()
        tasks_not_completed = Tasks.query.filter(~Tasks.task_id.in_(completed_task_ids)).all()

        # Return tasks not completed
        return jsonify([task.to_dict() for task in tasks_not_completed]), 200
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500



@task_routes.route("/api/tasks", methods=["GET"])
@jwt_required()
def get_all_asks():
    """
    Get all tasks.
    ---
    tags:
      - Tasks
    responses:
      200:
        description: Tasks retrieved successfully
        content:
          application/json:
            schema:
              type: array
              items:
                type: object
                properties:
                  task_id:
                    type: integer
                    description: ID of the task
                  task_name:
                    type: string
                    description: Name of the task
                  description:
                    type: string
                    description: Description of the task
                  created_at:
                    type: string
                    description: Date and time the task was created
                  points:
                    type: integer
                    description: Points awarded for completing the task
      500:
        description: Error retrieving tasks
    """
    tasks = Tasks.query.all()
    try:
        return jsonify([task.to_dict() for task in tasks]), 200
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500







@task_routes.route("/api/tasks/<int:task_id>", methods=["GET"])
@jwt_required()
def get_task_by_id(task_id):
    """
    Get a task by ID.
    ---
    tags:
      - Tasks
    parameters:
      - name: task_id
        in: path
        required: true
        type: integer
        description: ID of the task to retrieve
    responses:
      200:
        description: Task retrieved successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                task_id:
                  type: integer
                  description: ID of the task
                task_name:
                  type: string
                  description: Name of the task
                description:
                  type: string
                  description: Description of the task
                created_at:
                  type: string
                  description: Date and time the task was created
                points:
                  type: integer
                  description: Points awarded for completing the task
      404:
        description: Task not found
    """
    task = Tasks.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    return jsonify(task.to_dict()), 200


@task_routes.route("/api/generate-presigned-url", methods=["POST"])
@jwt_required()
def generate_presigned_url():
    """
    Generate a pre-signed URL for direct upload to S3.
    ---
    tags:
      - Upload
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              file_name:
                type: string
                description: "Name of the file to be uploaded"
    responses:
      200:
        description: "Pre-signed URL generated successfully"
        content:
          application/json:
            schema:
              type: object
              properties:
                url:
                  type: string
                  description: "Pre-signed URL for upload"
                file_key:
                  type: string
                  description: "Unique file key in S3"
      500:
        description: "Error generating pre-signed URL"
    """
    data = request.json
    file_name = data.get("file_name")
    
    # Validate the file extension
    allowed_extensions = {"jpeg", "jpg", "png"}
    file_extension = file_name.rsplit(".", 1)[-1].lower()  # Get the extension
    if file_extension not in allowed_extensions:
        return jsonify({"error": "Invalid file type. Only jpeg, jpg, or png allowed."}), 400

    # Set the appropriate content type
    content_type = f"image/{'jpeg' if file_extension in ['jpeg', 'jpg'] else 'png'}"
    
    # Generate a unique file key for S3
    file_key = f"{uuid.uuid4().hex}_{file_name}"
    
    try:
        # Generate the pre-signed URL for a PUT operation
        presigned_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": S3_BUCKET_NAME,
                "Key": file_key,
                "ContentType": content_type  # Use the determined content type
            },
            ExpiresIn=3600  # URL is valid for 1 hour
        )
        return jsonify({"url": presigned_url, "file_key": file_key}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@task_routes.route("/api/tasks/<int:task_id>/complete", methods=["POST"])
@jwt_required()
def complete_task(task_id):
    """
    Complete a task by saving the S3 link of the uploaded photo.
    ---
    tags:
      - Tasks
    parameters:
      - name: task_id
        in: path
        required: true
        type: integer
        description: ID of the task to mark as complete
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            file_key:
              type: string
              description: The file key of the uploaded image in S3
    responses:
      201:
        description: Task marked as completed successfully
      400:
        description: Invalid input or task does not exist
      500:
        description: Server error
    """
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    task = Tasks.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    data = request.json
    photo_key = data.get("file_key")
    if not photo_key:
        return jsonify({"error": "file_key is required"}), 400

    # Construct the S3 URL
    photo_url = f"https://{S3_BUCKET_NAME}.s3.amazonaws.com/{photo_key}"
    
    # Record task completion in UserTasks table
    try:
        new_completion = UserTasks(
            user_id=user.user_id,
            task_id=task_id,
            photo_url=photo_url,
            completed_at=datetime.utcnow()
        )
        db.session.add(new_completion)
        db.session.commit()
        return jsonify({"message": "Task marked as completed", "photo_url": photo_url}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@task_routes.route("/api/user-tasks/recent/<int:n>", methods=["GET"])
@jwt_required()
def get_recent_user_tasks(n):
    """
    Get the last n UserTasks with additional data like task name, points, and username.
    ---
    tags:
      - UserTasks
    parameters:
      - name: n
        in: path
        required: true
        type: integer
        description: Number of most recent UserTasks to retrieve
    responses:
      200:
        description: List of most recent UserTasks with detailed information
        content:
          application/json:
            schema:
              type: array
              items:
                type: object
                properties:
                  user_task_id:
                    type: integer
                    description: ID of the user task
                  user_id:
                    type: integer
                    description: ID of the user who completed the task
                  task_id:
                    type: integer
                    description: ID of the completed task
                  task_name:
                    type: string
                    description: Name of the task
                  points:
                    type: integer
                    description: Points awarded for completing the task
                  username:
                    type: string
                    description: Username of the user who completed the task
                  photo_url:
                    type: string
                    description: URL of the completion photo
                  completed_at:
                    type: string
                    description: Completion timestamp
      500:
        description: Server error
    """
    try:
        # Query for the recent tasks, joining User and Task details
        recent_tasks = (
            db.session.query(UserTasks, User.username, Tasks.task_name, Tasks.points)
            .join(User, UserTasks.user_id == User.user_id)
            .join(Tasks, UserTasks.task_id == Tasks.task_id)
            .order_by(UserTasks.completed_at.desc())
            .limit(n)
            .all()
        )
        
        # Format response with the required data
        response = [
            {
                "user_task_id": task.user_task_id,
                "user_id": task.user_id,
                "task_id": task.task_id,
                "task_name": task_name,
                "points": points,
                "username": username,
                "photo_url": task.photo_url,
                "completed_at": task.completed_at.strftime("%Y-%m-%d %H:%M:%S")
            }
            for task, username, task_name, points in recent_tasks
        ]
        
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
