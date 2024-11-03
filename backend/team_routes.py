# Get point totals for all teams
from flask import Blueprint, jsonify
from sqlalchemy import func
from models import db, Teams, User, UserTasks, Tasks

# Create a Blueprint for team routes
team_routes = Blueprint("team_routes", __name__)

@team_routes.route("/api/teams/points", methods=["GET"])
def get_teams_with_points():
    """
    Get all teams with their total points.
    ---
    tags:
      - Teams
    responses:
      200:
        description: Teams and their total points retrieved successfully
        content:
          application/json:
            schema:
              type: array
              items:
                type: object
                properties:
                  team_name:
                    type: string
                    description: Name of the team
                  total_points:
                    type: integer
                    description: Total points for the team
      500:
        description: Error retrieving teams and points
    """
    try:
        # Query to get total points for each team by summing points from UserTasks and Tasks
        results = db.session.query(
            Teams.team_name,
            func.coalesce(func.sum(Tasks.points), 0).label("total_points")
        ).join(User, User.team_id == Teams.team_id) \
         .join(UserTasks, User.user_id == UserTasks.user_id) \
         .join(Tasks, Tasks.task_id == UserTasks.task_id) \
         .group_by(Teams.team_name) \
         .all()

        # Format the result as a list of dictionaries
        teams_with_points = [
            {"team_name": team_name, "total_points": total_points}
            for team_name, total_points in results
        ]

        return jsonify(teams_with_points), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
