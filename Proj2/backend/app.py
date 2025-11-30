from flask import Flask, send_from_directory
from extensions import db, cors, jwt, migrate
from routes import bp as api_bp
from config import Config
import os
from controllers.stats_controller import bp as stats_bp 

def create_app():
    app = Flask(__name__)

    # Load DB config from env / config.py
    app.config["SQLALCHEMY_DATABASE_URI"] = Config.SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY
    # Config
    app.config["UPLOAD_FOLDER"] = os.path.join(
        app.root_path, "uploads", "profile_pictures"
    )
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Serve uploaded profile pictures via /uploads/profile_pictures/<filename>
    @app.route("/uploads/profile_pictures/<filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    cors.init_app(
        app,
        resources={r"/api/*": {"origins": "http://localhost:3000"}},
        supports_credentials=True,
    )
    jwt.init_app(app)

    # Register blueprints
    app.register_blueprint(api_bp)
    app.register_blueprint(stats_bp)

    # Initialize database
    with app.app_context():
        # Import models here to ensure they're registered with SQLAlchemy
        import models  # noqa: F401

        db.create_all()
        print("✅ Database tables created!")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
