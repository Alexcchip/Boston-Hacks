# Snapstronaut

This project is a mental health application designed for astronauts. It provides features such as user authentication, a point system for completing tasks, and a map to track when the ISS flies over certain areas.

## Features

- **User Authentication**: Secure login and registration using JWT.
- **Point System**: Earn points by completing various tasks.
- **ISS Tracker**: View the current position of the ISS and see when it flies over specific locations.

## Technologies Used

- **Backend**: Flask, SQLAlchemy, PostgreSQL, Flask-JWT-Extended, Flask-CORS, Flasgger for API documentation.
- **Frontend**: React, Tailwind CSS, Leaflet for maps.
- **Database**: PostgreSQL
- **Cloud Storage**: AWS S3 for storing images.
- **Infrastructure as Code**: Terraform for managing cloud resources.

## Running the Project

### Prerequisites

- Node.js and npm
- Python 3.x
- PostgreSQL
- AWS account for S3
- Terraform

### Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

DB_USER=<your_db_user>

DB_PASSWORD=<your_db_password>

DB_HOST=<your_db_host>

DB_PORT=<your_db_port>

DB_NAME=<your_db_name>

AWS_REGION=<your_aws_region>

AWS_ACCESS_KEY_ID=<your_aws_access_key_id>

AWS_SECRET_ACCESS_KEY=<your_aws_secret_access_key>

S3_BUCKET_NAME=<your_s3_bucket_name>

JWT_SECRET_KEY=<your_jwt_secret_key>

You can look at the template in the `.env.local` file

### Backend Setup

1. Navigate to the `backend` directory:

   ```sh
   cd backend
   ```

2. Install the required Python packages:

   ```sh
   pip install -r requirements.txt
   ```

3. Initialize the database:

   ```sh
   python initdb.py
   ```

4. Run the Flask application:

   ```sh
   flask run
   ```

### Frontend Setup

1. Navigate to the `frontend` directory:

   ```sh
   cd frontend
   ```

2. Install the required npm packages:

   ```sh
   npm install
   ```

3. Start the React application:

   ```sh
   npm start
   ```

### Terraform Setup

1. Navigate to the `infrastructure` directory:

   ```sh
   cd infrastructure
   ```

2. Initialize Terraform:

   ```sh
   terraform init
   ```

3. Apply the Terraform configuration to set up the necessary cloud resources:

   ```sh
   terraform apply
   ```

## API Endpoints

### User Authentication

- **Register**: `POST /api/register`
- **Login**: `POST /api/login`
- **Protected Route**: `GET /api/protected`

### Tasks

- **Get All Tasks**: `GET /api/tasks`
- **Get Task by ID**: `GET /api/tasks/<int:task_id>`
- **Complete Task**: `POST /api/tasks/<int:task_id>/complete`
- **Get Recent User Tasks**: `GET /api/user-tasks/recent/<int:n>`
- **Get Tasks Not Completed by User**: `GET /api/tasks/not-completed`

### ISS Tracker

- **Generate Pre-signed URL**: `POST /api/generate-presigned-url`
