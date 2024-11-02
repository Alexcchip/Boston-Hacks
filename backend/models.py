from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

db = SQLAlchemy()

class Tasks(db.Model):
    __tablename__ = 'tasks'
    
    task_id = db.Column(db.Integer, primary_key=True)
    task_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    points = db.Column(db.Integer, default=0)
    
    # Relationship to UserTasks for tracking completion
    completions = relationship('UserTasks', back_populates='task', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "task_id": self.task_id,
            "task_name": self.task_name,
            "description": self.description,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "points": self.points
        }


class Teams(db.Model):
    __tablename__ = 'teams'
    
    team_id = db.Column(db.Integer, primary_key=True)
    team_name = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    join_id = db.Column(db.String(10), unique=True)
    
    # Relationship to Users
    members = relationship('User', back_populates='team', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "team_id": self.team_id,
            "team_name": self.team_name,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        }


class UserTasks(db.Model):
    __tablename__ = 'usertasks'
    
    user_task_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.task_id'), nullable=False)
    photo_url = db.Column(db.String(255))
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships to Users and Tasks
    user = relationship('User', back_populates='tasks')
    task = relationship('Tasks', back_populates='completions')

    def to_dict(self):
        return {
            "user_task_id": self.user_task_id,
            "user_id": self.user_id,
            "task_id": self.task_id,
            "photo_url": self.photo_url,
            "completed_at": self.completed_at.strftime("%Y-%m-%d %H:%M:%S")
        }


class User(db.Model):
    __tablename__ = 'users'
    
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.team_id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships to Teams and UserTasks
    team = relationship('Teams', back_populates='members')
    tasks = relationship('UserTasks', back_populates='user', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "username": self.username,
            "email": self.email,
            "password": self.password,
            "team_id": self.team_id,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
