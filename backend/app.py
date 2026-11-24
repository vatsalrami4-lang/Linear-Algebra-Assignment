"""
Linear System Solver Suite - Backend Application
Flask REST API and Static SPA server powering all linear algebra solvers, classification, and benchmarks.
"""
import os
import sys

# Ensure backend directory is in python module search path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from database.db import init_db
from routes.api import api_bp

def create_app():
    # Locate frontend dist folder if built
    dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist'))
    
    app = Flask(__name__, static_folder=dist_dir if os.path.exists(dist_dir) else None)
    # Enable CORS for all routes so frontend (Vite dev server or build) can communicate seamlessly
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Initialize SQLite database
    init_db()
    
    # Register API blueprint
    app.register_blueprint(api_bp, url_prefix='/api')
    
    @app.errorhandler(404)
    def not_found(e):
        # If dist folder exists and route is not /api, serve index.html for SPA routing
        if os.path.exists(dist_dir):
            return send_from_directory(dist_dir, 'index.html')
        return jsonify({'success': False, 'error': 'Endpoint not found'}), 404
        
    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
        
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        if os.path.exists(dist_dir):
            target = os.path.join(dist_dir, path)
            if path != "" and os.path.exists(target):
                return send_from_directory(dist_dir, path)
            else:
                return send_from_directory(dist_dir, 'index.html')
        return jsonify({
            'name': 'Linear System Solver Suite API',
            'status': 'Online',
            'version': '1.0.0',
            'docs': '/api/health'
        })
        
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Linear System Solver Suite on http://127.0.0.1:{port}")
    app.run(host='127.0.0.1', port=port, debug=False)
