from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import boto3
import os
import uuid
from datetime import datetime
from models import db, User, Tasks, UserTasks

# Create a Blueprint for task routes
user_routes = Blueprint("user_routes", __name__)

# Get user by id
@user_routes.route("/api/users/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user_by_id(user_id):
    """
    Get a user by ID.
    ---
    tags:
      - Users
    parameters:
      - name: user_id
        in: path
        description: ID of the user to retrieve
        required: true
        schema:
          type: integer
    responses:
      200:
        description: User retrieved successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                user_id:
                  type: integer
                  description: ID of the user
                username:
                  type: string
                  description: Username of the user
                email:
                  type: string
                  description: Email address of the user
                created_at:
                  type: string
                  description: Date and time the user was created
      404:
        description: User not found
      500:
        description: Error retrieving user
    """
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.to_dict()), 200


@user_routes.route("/api/users", methods=["GET"])
@jwt_required()
def get_users():
    """
    Get all users.
    ---
    tags:
      - Users
    responses:
      200:
        description: Users retrieved successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                users:
                  type: array
                  items:
                    type: object
                    properties:
                      user_id:
                        type: integer
                        description: ID of the user
                      username:
                        type: string
                        description: Username of the user
                      email:
                        type: string
                        description: Email address of the user
                      created_at:
                        type: string
                        description: Date and time the user was created
      500:
        description: Error retrieving users
    """
    users = User.query.all()
    return jsonify({"users": [user.to_dict() for user in users]}), 200

@user_routes.route("/api/users/team/<int:team_id>", methods=["GET"])
@jwt_required()
def get_user_by_team(team_id):
    """
    Get all users by team id.
    ---
    tags:
      - Users
    parameters:
      - name: team_id
        in: path
        description: ID of the team to retrieve users
        required: true
        schema:
          type: integer
    responses:
      200:
        description: Users retrieved successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                users:
                  type: array
                  items:
                    type: object
                    properties:
                      user_id:
                        type: integer
                        description: ID of the user
                      username:
                        type: string
                        description: Username of the user
                      email:
                        type: string
                        description: Email address of the user
                      created_at:
                        type: string
                        description: Date and time the user was created
      404:
        description: Users not found
      500:
        description: Error retrieving users
    """
    users = User.query.filter_by(team_id=team_id).all()
    if not users:
        return jsonify({"error": "Users not found"}), 404
    return jsonify({"users": [user.to_dict() for user in users]}), 200
